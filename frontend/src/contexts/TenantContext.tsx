// frontend/src/contexts/TenantContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Tenant, Subscription } from '@/types/auth.types';
import { api } from '@/services/api';
import { domainResolutionService, TenantDomainInfo, DomainValidationResult } from '@/services/domainResolutionService';
import { log } from '@/utils/logger';

// Enhanced tenant context types
export interface TenantContextType {
  // Tenant information
  tenant: Tenant | null;
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  
  // Domain and routing
  currentDomain: string;
  domainInfo: TenantDomainInfo | null;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isTenantUser: boolean;
  
  // Domain resolution
  isFromSubdomain: () => boolean;
  isFromCustomDomain: () => boolean;
  
  // Actions
  refreshTenant: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  resolveTenantFromDomain: () => Promise<DomainValidationResult>;
}

const TenantContext = createContext<TenantContextType | null>(null);

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Hook for tenant-aware API calls
export const useTenantApi = () => {
  const { tenant, isSuperAdmin } = useTenant();
  
  const apiCall = useCallback(async <T,>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
    config?: any
  ): Promise<T> => {
    // Add tenant context to API calls
    const headers = {
      ...config?.headers,
      'X-Tenant-ID': tenant?._id || '',
      'X-Tenant-Domain': tenant?.domain || '',
      'X-Is-Super-Admin': isSuperAdmin.toString(),
    };
    
    const response = await api.request<T>({
      method,
      url,
      data,
      headers,
      ...config,
    });
    
    return response.data;
  }, [tenant, isSuperAdmin]);
  
  return { apiCall };
};

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { user, tenant: authTenant, subscription: authSubscription, switchTenant: authSwitchTenant } = useAuthStore();
  
  // Local state
  const [tenant, setTenant] = useState<Tenant | null>(authTenant);
  const [subscription, setSubscription] = useState<Subscription | null>(authSubscription);
  const [domainInfo, setDomainInfo] = useState<TenantDomainInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current domain
  const currentDomain = window.location.hostname;
  
  // Fix: Memoized values to prevent unnecessary re-renders
  const isSuperAdmin = useMemo(() => user?.role === 'super_admin', [user?.role]);
  const isTenantAdmin = useMemo(() => user?.role === 'admin' || user?.role === 'super_admin', [user?.role]);
  const isTenantUser = useMemo(() => user?.role === 'user', [user?.role]);
  
  // Fix: Cache for tenant resolution to prevent excessive API calls
  const tenantCache = useRef<Map<string, { tenant: Tenant; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Fix: Memoized domain resolution functions
  const isFromSubdomain = useCallback(() => {
    return domainInfo?.isSubdomain || false;
  }, [domainInfo?.isSubdomain]);
  
  const isFromCustomDomain = useCallback(() => {
    return domainInfo?.isCustomDomain || false;
  }, [domainInfo?.isCustomDomain]);
  
  // Fix: Optimized tenant refresh with caching
  const refreshTenantById = useCallback(async (tenantId: string): Promise<void> => {
    try {
      // Check cache first
      const cached = tenantCache.current.get(tenantId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setTenant(cached.tenant);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      const response = await api.get<Tenant>(`/tenants/${tenantId}`);
      if (response.data) {
        setTenant(response.data);
        // Cache the result
        tenantCache.current.set(tenantId, {
          tenant: response.data,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      log.error('Failed to refresh tenant', { error: error instanceof Error ? error.message : String(error) });
      setError('Failed to refresh tenant');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fix: Optimized refresh function
  const refreshTenant = useCallback(async (): Promise<void> => {
    if (tenant?._id) {
      await refreshTenantById(tenant._id);
    }
  }, [tenant?._id, refreshTenantById]);
  
  // Fix: Optimized tenant switching
  const switchTenant = useCallback(async (tenantId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authSwitchTenant(tenantId);
      
      // Refresh tenant data
      await refreshTenantById(tenantId);
      
      // Clear cache for other tenants
      tenantCache.current.clear();
      
    } catch (error) {
      log.error('Failed to switch tenant', { error: error instanceof Error ? error.message : String(error) });
      setError('Failed to switch tenant');
    } finally {
      setIsLoading(false);
    }
  }, [authSwitchTenant, refreshTenantById]);
  
  // Fix: Optimized domain resolution with caching
  const resolveTenantFromDomain = useCallback(async (): Promise<DomainValidationResult> => {
    try {
      const result = await domainResolutionService.resolveTenantFromDomain();
      
      if (result.isValid && result.tenantInfo) {
        setDomainInfo(result.tenantInfo);
        
        // If we have tenant info from domain, fetch full tenant data
        if (result.tenantInfo.tenantId !== 'super-admin') {
          await refreshTenantById(result.tenantInfo.tenantId);
        }
      }
      
      return result;
    } catch (error) {
      log.error('Domain resolution failed', { error: error instanceof Error ? error.message : String(error) });
      return {
        isValid: false,
        error: 'Domain resolution failed'
      };
    }
  }, [refreshTenantById]);
  
  // Fix: Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    tenant,
    subscription,
    isLoading,
    error,
    currentDomain,
    domainInfo,
    isSuperAdmin,
    isTenantAdmin,
    isTenantUser,
    isFromSubdomain,
    isFromCustomDomain,
    refreshTenant,
    switchTenant,
    resolveTenantFromDomain
  }), [
    tenant,
    subscription,
    isLoading,
    error,
    currentDomain,
    domainInfo,
    isSuperAdmin,
    isTenantAdmin,
    isTenantUser,
    isFromSubdomain,
    isFromCustomDomain,
    refreshTenant,
    switchTenant,
    resolveTenantFromDomain
  ]);
  
  // Fix: Sync with auth store changes but prevent loops
  useEffect(() => {
    if (authTenant && authTenant._id !== tenant?._id) {
      setTenant(authTenant);
    }
  }, [authTenant?._id]); // Only depend on tenant ID to prevent loops
  
  useEffect(() => {
    if (authSubscription && authSubscription._id !== subscription?._id) {
      setSubscription(authSubscription);
    }
  }, [authSubscription?._id]); // Only depend on subscription ID to prevent loops
  
  // Fix: Initialize domain resolution only once
  useEffect(() => {
    if (!domainInfo && user) {
      resolveTenantFromDomain().catch(error => {
        log.error('Initial domain resolution failed', { error: error instanceof Error ? error.message : String(error) });
      });
    }
  }, [user, domainInfo, resolveTenantFromDomain]);
  
  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

// Theme-related hooks (simplified to prevent re-render issues)
export const useTenantTheme = () => {
  const { tenant } = useTenant();
  
  const getTheme = useCallback(() => {
    if (!tenant?.settings?.branding) {
      return {
        companyName: 'Maple Leaf Immigration Services',
        primaryColor: '#DC2626',
        secondaryColor: '#F3F4F6'
      };
    }
    
    return {
      companyName: tenant.settings.branding.companyName || 'Maple Leaf Immigration Services',
      primaryColor: tenant.settings.branding.primaryColor || '#DC2626',
      secondaryColor: tenant.settings.branding.secondaryColor || '#F3F4F6'
    };
  }, [tenant?.settings?.branding]);
  
  const applyTheme = useCallback(() => {
    const theme = getTheme();
    
    // Apply theme to document
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
      document.title = `${theme.companyName} - Immigration Portal`;
    }
  }, [getTheme]);
  
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);
  
  return {
    getTheme,
    applyTheme,
  };
};

export default TenantProvider;