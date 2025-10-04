// frontend/src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ToastProvider } from '@/contexts/ToastContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DarkModeProvider } from '@/contexts/DarkModeContext';
import { LogoProvider } from '@/contexts/LogoContext';
import { CSSInjectionProvider } from '@/contexts/CSSInjectionContext';
import { TenantRouter } from '@/components/tenant/TenantRouter';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import SessionSecurity from '@/components/security/SessionSecurity';

// Lazy-loaded routes
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const TenantSelection = lazy(() => import('@/pages/tenant/TenantSelection'));
const AuthCallback = lazy(() => import('@/pages/auth/AuthCallback'));

// Custom redirect component that preserves the port
const TenantSelectionRedirect: React.FC = () => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    console.log('🔍 Redirecting to tenant-selection, current location:', window.location.href);
    navigate('/tenant-selection', { replace: true });
  }, [navigate]);
  
  return <div className="p-4 text-sm text-gray-500">Redirecting to tenant selection...</div>;
};

function App() {
  const { isAuthenticated, user, tenant } = useAuthStore();
  
  // Debug logging to understand redirect issue
  console.log('🔍 App.tsx Debug:', {
    isAuthenticated,
    userRole: user?.role,
    tenantExists: !!tenant,
    tenantName: tenant?.name,
    shouldRedirectToTenantSelection: !tenant && user?.role !== 'super_admin',
    currentUrl: window.location.href,
    currentHost: window.location.host,
    currentPort: window.location.port
  });
  
  // Add a small delay to allow auth store to rehydrate properly
  const [isRehydrating, setIsRehydrating] = React.useState(true);
  
  React.useEffect(() => {
    // Give the auth store time to rehydrate from sessionStorage
    const timer = setTimeout(() => {
      setIsRehydrating(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isRehydrating) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <ToastProvider>
          <TenantProvider>
            <ThemeProvider>
              <CSSInjectionProvider>
                <SessionSecurity>
                  <Suspense fallback={
                    <div className="flex justify-center items-center min-h-screen">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                  }>
                    <Routes>
                    {!isAuthenticated ? (
                      <>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/auth-callback" element={<AuthCallback />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                      </>
                    ) : !tenant && user?.role !== 'super_admin' ? (
                      <>
                        <Route path="/tenant-selection" element={<TenantSelection />} />
                        <Route path="*" element={<TenantSelectionRedirect />} />
                      </>
                    ) : (
                      <Route path="*" element={
                        <LogoProvider>
                          <TenantRouter />
                        </LogoProvider>
                      } />
                    )}
                    </Routes>
                  </Suspense>
                </SessionSecurity>
              </CSSInjectionProvider>
            </ThemeProvider>
          </TenantProvider>
        </ToastProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}

export default App;
