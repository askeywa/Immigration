// frontend/src/components/tenant/TenantLayout.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuthStore } from '@/store/authStore';
import { domainResolutionService } from '@/services/domainResolutionService';
import { TenantNavigation } from './TenantNavigation';
import { TenantContextIndicator } from './TenantContextIndicator';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { 
  AlertCircle, 
  Loader2, 
  Wifi, 
  WifiOff,
  Shield,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { 
  HomeIcon, 
  UsersIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  ChartPieIcon 
} from '@heroicons/react/24/outline';

interface TenantLayoutProps {
  children: React.ReactNode;
}

export const TenantLayout: React.FC<TenantLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { tenant, isLoading, error, isSuperAdmin, isActive, isTrialExpired } = useTenant();
  const { user } = useAuthStore();
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const [domainResolutionStatus, setDomainResolutionStatus] = useState<'resolving' | 'resolved' | 'error'>('resolved');
  
  // Use ref to prevent multiple domain resolutions
  const domainResolved = useRef(false);
  const mounted = useRef(true);

  // Monitor connection status (optimized)
  const handleOnline = useCallback(() => setConnectionStatus('online'), []);
  const handleOffline = useCallback(() => setConnectionStatus('offline'), []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mounted.current = false;
    };
  }, [handleOnline, handleOffline]);

  // FIXED: Handle domain resolution only once and only when needed
  useEffect(() => {
    const resolveDomain = async () => {
      // Prevent multiple calls
      if (domainResolved.current || !mounted.current) {
        return;
      }

      // Only resolve domain if we don't have tenant info and user is authenticated
      if (!tenant && user && !isSuperAdmin) {
        try {
          domainResolved.current = true;
          setDomainResolutionStatus('resolving');
          
          const result = await domainResolutionService.resolveTenantFromDomain();
          
          if (mounted.current) {
            setDomainResolutionStatus(result.success ? 'resolved' : 'error');
          }
        } catch (error) {
          console.error('Domain resolution failed:', error);
          if (mounted.current) {
            setDomainResolutionStatus('error');
          }
        }
      } else {
        // We have tenant or user is super admin, mark as resolved
        setDomainResolutionStatus('resolved');
        domainResolved.current = true;
      }
    };

    // Only run domain resolution once when component mounts and user is available
    if (user && !domainResolved.current) {
      resolveDomain();
    }
  }, [user, tenant, isSuperAdmin]); // Only depend on these specific values

  // Reset domain resolution when tenant changes
  useEffect(() => {
    if (tenant) {
      domainResolved.current = false;
      setDomainResolutionStatus('resolved');
    }
  }, [tenant?._id]); // Only depend on tenant ID

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Loading Tenant Context</h2>
          <p className="text-sm text-gray-500">Please wait while we resolve your tenant information...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Tenant Access Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show tenant not found state
  if (!tenant && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Tenant Access
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              You don't have access to any tenant. Please contact your administrator.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Special layout for Super Admin - No overlapping headers
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Proper Vertical Sidebar */}
          <div className="w-64 flex-shrink-0 bg-white shadow-lg border-r border-gray-200">
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Super Admin</h2>
                    <p className="text-xs text-gray-500">System Control</p>
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                <a
                  href="/super-admin"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/super-admin'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <HomeIcon className="w-5 h-5 mr-3" />
                  Dashboard
                </a>
                <a
                  href="/super-admin/tenants"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/super-admin/tenants'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <UserGroupIcon className="w-5 h-5 mr-3" />
                  Tenants
                </a>
                <a
                  href="/super-admin/users"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/super-admin/users'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <UsersIcon className="w-5 h-5 mr-3" />
                  Users
                </a>
                <a
                  href="/super-admin/reports"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/super-admin/reports'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChartBarIcon className="w-5 h-5 mr-3" />
                  Reports
                </a>
                <a
                  href="/super-admin/analytics"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === '/super-admin/analytics'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChartPieIcon className="w-5 h-5 mr-3" />
                  Analytics
                </a>
              </nav>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    );
  }

  // Regular tenant layout
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <TenantNavigation variant="sidebar" />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default TenantLayout;