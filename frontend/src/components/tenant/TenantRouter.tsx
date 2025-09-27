// frontend/src/components/tenant/TenantRouter.tsx
import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuthStore } from '@/store/authStore';
import { TenantLayout } from './TenantLayout';
import { log } from '@/utils/logger';

// Lazy-loaded tenant-specific components
const TenantDashboard = React.lazy(() => import('@/pages/tenant/TenantAdminDashboardFixed'));
const TenantUsers = React.lazy(() => import('@/pages/tenant/TenantUsers'));
const TenantProfiles = React.lazy(() => import('@/pages/tenant/TenantProfiles'));
const TenantReports = React.lazy(() => import('@/pages/tenant/TenantReports'));
const TenantSettings = React.lazy(() => import('@/pages/tenant/TenantSettings'));
const TenantDocuments = React.lazy(() => import('@/pages/tenant/TenantDocuments'));
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
const ProfileSettings = React.lazy(() => import('@/pages/user/ProfileSettings'));
const AccountSettings = React.lazy(() => import('@/pages/user/AccountSettings'));

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

// FIXED: Simplified tenant access guard without complex re-render logic
const TenantAccessGuard: React.FC<{ children: React.ReactNode; requiredRole?: 'admin' | 'user' | 'super_admin' }> = ({ 
  children, 
  requiredRole 
}) => {
  const { tenant, isSuperAdmin, isTenantAdmin, isTenantUser, isLoading } = useTenant();
  const { user } = useAuthStore();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // FIXED: Simplified access control logic
  const hasAccess = () => {
    if (!user) return false;
    
    if (requiredRole === 'super_admin') {
      return isSuperAdmin;
    }
    
    if (requiredRole === 'admin') {
      return isTenantAdmin && (tenant || isSuperAdmin);
    }
    
    if (requiredRole === 'user') {
      return isTenantUser && tenant;
    }
    
    // Default: any authenticated user with tenant access
    return (tenant || isSuperAdmin);
  };
  
  if (!hasAccess()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Access Denied
            </h3>
            <p className="text-sm text-red-700">
              {!tenant && !isSuperAdmin 
                ? "You don't have access to any tenant. Please contact your administrator."
                : `${requiredRole || 'Required'} access needed for this page.`
              }
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

// FIXED: Completely removed DomainValidator that was causing loops
// Domain validation is now handled in TenantContext only

// FIXED: Stable route determination
const useRouteRedirect = () => {
  const { isSuperAdmin, isTenantAdmin, isTenantUser } = useTenant();
  
  // Memoize redirect path to prevent changes
  const redirectPath = React.useMemo(() => {
    if (isSuperAdmin) return '/super-admin';
    if (isTenantAdmin) return '/tenant/dashboard';
    if (isTenantUser) return '/dashboard';
    return '/login';
  }, [isSuperAdmin, isTenantAdmin, isTenantUser]);
  
  return redirectPath;
};

// Main tenant router component
export const TenantRouter: React.FC = () => {
  const { tenant, isSuperAdmin, isTenantAdmin, isTenantUser, isLoading } = useTenant();
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectPath = useRouteRedirect();
  
  // Prevent navigation loops
  const lastRedirectPath = useRef<string>('');
  const navigationLock = useRef(false);
  
  // FIXED: Simplified loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // FIXED: One-time redirect logic without loops
  React.useEffect(() => {
    // Prevent navigation during navigation
    if (navigationLock.current) return;
    
    // Only redirect from root path to prevent loops
    if (location.pathname === '/' && redirectPath !== lastRedirectPath.current) {
      navigationLock.current = true;
      lastRedirectPath.current = redirectPath;
      
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
        navigationLock.current = false;
      }, 0);
    }
  }, [location.pathname, redirectPath, navigate]);
  
  return (
    <TenantLayout>
      <TenantErrorBoundary>
        <Routes>
          {/* Super Admin Routes - Only render if user is super admin */}
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
          
          {/* Tenant Admin Routes - Only render if user is tenant admin and has tenant */}
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
              <Route path="/tenant/documents" element={
                <TenantAccessGuard requiredRole="admin">
                  <TenantDocuments />
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
          
          {/* Regular User Routes - Only render if user is tenant user and has tenant */}
          {isTenantUser && tenant && (
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
              <Route path="/profile/settings" element={
                <TenantAccessGuard requiredRole="user">
                  <ProfileSettings />
                </TenantAccessGuard>
              } />
              <Route path="/account/settings" element={
                <TenantAccessGuard requiredRole="user">
                  <AccountSettings />
                </TenantAccessGuard>
              } />
            </>
          )}
          
          {/* FIXED: Simplified default redirect - only from root */}
          <Route path="/" element={<Navigate to={redirectPath} replace />} />
          
          {/* FIXED: Catch-all that doesn't cause loops */}
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Page Not Found</h3>
                <p className="text-sm text-gray-500 mb-4">The page you're looking for doesn't exist.</p>
                <button
                  onClick={() => navigate(redirectPath, { replace: true })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          } />
        </Routes>
      </TenantErrorBoundary>
    </TenantLayout>
  );
};

export default TenantRouter;