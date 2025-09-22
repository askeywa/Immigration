// frontend/src/components/tenant/TenantRouter.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuthStore } from '@/store/authStore';
import { TenantLayout } from './TenantLayout';
import { log } from '@/utils/logger';

// Lazy-loaded tenant-specific components
const TenantDashboard = React.lazy(() => import('@/pages/tenant/TenantAdminDashboard'));
const TenantUsers = React.lazy(() => import('@/pages/tenant/TenantUsers'));
const TenantProfiles = React.lazy(() => import('@/pages/tenant/TenantProfiles'));
const TenantReports = React.lazy(() => import('@/pages/tenant/TenantReports'));
const TenantSettings = React.lazy(() => import('@/pages/tenant/TenantSettings'));
const TenantBranding = React.lazy(() => import('@/pages/tenant/BrandingCustomization'));
const TenantAnalytics = React.lazy(() => import('@/pages/tenant/TenantAnalytics'));

// Super admin components
const SuperAdminDashboard = React.lazy(() => import('@/pages/super-admin/SuperAdminDashboard'));
const SuperAdminTenants = React.lazy(() => import('@/pages/super-admin/SuperAdminTenants'));
const SuperAdminUsers = React.lazy(() => import('@/pages/super-admin/SuperAdminUsers'));
const SuperAdminReports = React.lazy(() => import('@/pages/super-admin/SuperAdminReports'));
const SuperAdminAnalytics = React.lazy(() => import('@/pages/super-admin/SuperAdminAnalytics'));

// Regular user components
const UserDashboard = React.lazy(() => import('@/pages/user/UserDashboard'));
const ProfileAssessment = React.lazy(() => import('@/pages/user/ProfileAssessment'));
const CrsScore = React.lazy(() => import('@/pages/user/CrsScore'));
const DocumentsChecklist = React.lazy(() => import('@/pages/user/DocumentsChecklist'));
const AdditionalInfo = React.lazy(() => import('@/pages/user/AdditionalInfo'));
const DocumentsUpload = React.lazy(() => import('@/pages/user/DocumentsUpload'));

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

// Error boundary for tenant context
const TenantErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { error } = useTenant();
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Tenant Access Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Tenant access guard
const TenantAccessGuard: React.FC<{ children: React.ReactNode; requiredRole?: 'admin' | 'user' | 'super_admin' }> = ({ 
  children, 
  requiredRole 
}) => {
  const { tenant, isSuperAdmin, isTenantAdmin, isTenantUser, isLoading } = useTenant();
  const { user } = useAuthStore();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!tenant && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Tenant Access
            </h3>
            <p className="text-sm text-gray-500">
              You don't have access to any tenant. Please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (requiredRole === 'super_admin' && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Access Denied
            </h3>
            <p className="text-sm text-red-700">
              Super admin access required for this page.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (requiredRole === 'admin' && !isTenantAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Access Denied
            </h3>
            <p className="text-sm text-red-700">
              Admin access required for this page.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (requiredRole === 'user' && !isTenantUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Access Denied
            </h3>
            <p className="text-sm text-red-700">
              User access required for this page.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Domain validation component
const DomainValidator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { domainInfo, resolveTenantFromDomain, isLoading } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const validateDomain = async () => {
      try {
        const result = await resolveTenantFromDomain();
        
        if (!result.isValid) {
          log.warn('Domain validation failed', { 
            error: result.error, 
            redirectUrl: result.redirectUrl,
            currentPath: location.pathname 
          });
          
          if (result.redirectUrl) {
            // Prevent redirect loops - don't redirect if already on target page
            const currentPath = location.pathname;
            const targetPath = result.redirectUrl.startsWith('/') ? result.redirectUrl : new URL(result.redirectUrl, window.location.origin).pathname;
            
            if (currentPath === targetPath) {
              console.log('🔍 TenantRouter: Already on target page, skipping redirect to prevent loop');
              return;
            }
            
            // Use React Router navigation to preserve the current origin
            console.log('🔍 TenantRouter: Domain validation redirect needed:', result.redirectUrl);
            const url = new URL(result.redirectUrl, window.location.origin);
            navigate(url.pathname + url.search + url.hash, { replace: true });
            return;
          }
        }
      } catch (error) {
        log.error('Domain validation error', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    if (!isLoading && !domainInfo) {
      validateDomain();
    }
  }, [domainInfo, isLoading, resolveTenantFromDomain, location.pathname]);

  return <>{children}</>;
};

// Main tenant router component
export const TenantRouter: React.FC = () => {
  const { tenant, isSuperAdmin, isTenantAdmin, isTenantUser, isLoading, domainInfo } = useTenant();
  const { user } = useAuthStore();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <TenantLayout>
      <TenantErrorBoundary>
        <DomainValidator>
          <Routes>
          {/* Super Admin Routes */}
          {isSuperAdmin && (
            <>
              <Route path="/super-admin" element={
                <TenantAccessGuard requiredRole="super_admin">
                  <SuperAdminDashboard />
                </TenantAccessGuard>
              } />
              <Route path="/super-admin/tenants" element={
                <TenantAccessGuard requiredRole="super_admin">
                  <SuperAdminTenants />
                </TenantAccessGuard>
              } />
              <Route path="/super-admin/users" element={
                <TenantAccessGuard requiredRole="super_admin">
                  <SuperAdminUsers />
                </TenantAccessGuard>
              } />
              <Route path="/super-admin/reports" element={
                <TenantAccessGuard requiredRole="super_admin">
                  <SuperAdminReports />
                </TenantAccessGuard>
              } />
              <Route path="/super-admin/analytics" element={
                <TenantAccessGuard requiredRole="super_admin">
                  <SuperAdminAnalytics />
                </TenantAccessGuard>
              } />
            </>
          )}
          
          {/* Tenant Admin Routes */}
          {isTenantAdmin && tenant && (
            <>
              <Route path="/tenant/dashboard" element={
                <TenantAccessGuard requiredRole="admin">
                  <TenantDashboard />
                </TenantAccessGuard>
              } />
              <Route path="/tenant/users" element={
                <TenantAccessGuard requiredRole="admin">
                  <TenantUsers />
                </TenantAccessGuard>
              } />
              <Route path="/tenant/profiles" element={
                <TenantAccessGuard requiredRole="admin">
                  <TenantProfiles />
                </TenantAccessGuard>
              } />
              <Route path="/tenant/reports" element={
                <TenantAccessGuard requiredRole="admin">
                  <TenantReports />
                </TenantAccessGuard>
              } />
              <Route path="/tenant/settings" element={
                <TenantAccessGuard requiredRole="admin">
                  <TenantSettings />
                </TenantAccessGuard>
              } />
              <Route path="/tenant/branding" element={
                <TenantAccessGuard requiredRole="admin">
                  <TenantBranding />
                </TenantAccessGuard>
              } />
              <Route path="/tenant/analytics" element={
                <TenantAccessGuard requiredRole="admin">
                  <TenantAnalytics />
                </TenantAccessGuard>
              } />
            </>
          )}
          
          {/* Regular User Routes */}
          {isTenantUser && (
            <>
              <Route path="/dashboard" element={
                <TenantAccessGuard requiredRole="user">
                  <UserDashboard />
                </TenantAccessGuard>
              } />
              <Route path="/profile/assessment" element={
                <TenantAccessGuard requiredRole="user">
                  <ProfileAssessment />
                </TenantAccessGuard>
              } />
              <Route path="/crs" element={
                <TenantAccessGuard requiredRole="user">
                  <CrsScore />
                </TenantAccessGuard>
              } />
              <Route path="/documents/checklist" element={
                <TenantAccessGuard requiredRole="user">
                  <DocumentsChecklist />
                </TenantAccessGuard>
              } />
              <Route path="/additional-info" element={
                <TenantAccessGuard requiredRole="user">
                  <AdditionalInfo />
                </TenantAccessGuard>
              } />
              <Route path="/documents" element={
                <TenantAccessGuard requiredRole="user">
                  <DocumentsUpload />
                </TenantAccessGuard>
              } />
            </>
          )}
          
          {/* Default redirects based on role */}
          <Route path="/" element={
            <Navigate 
              to={
                isSuperAdmin ? '/super-admin' :
                isTenantAdmin ? '/tenant/dashboard' :
                isTenantUser ? '/dashboard' :
                '/login'
              } 
              replace 
            />
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={
            <Navigate 
              to={
                isSuperAdmin ? '/super-admin' :
                isTenantAdmin ? '/tenant/dashboard' :
                isTenantUser ? '/dashboard' :
                '/login'
              } 
              replace 
            />
          } />
          </Routes>
        </DomainValidator>
      </TenantErrorBoundary>
    </TenantLayout>
  );
};

export default TenantRouter;
