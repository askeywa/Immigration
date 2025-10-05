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
  const [isRehydrated, setIsRehydrated] = React.useState(false);
  
  // CRITICAL: Wait for Zustand to rehydrate from sessionStorage
  React.useEffect(() => {
    // Check if we have auth data in sessionStorage
    const checkRehydration = () => {
      try {
        const authData = sessionStorage.getItem('auth-storage');
        if (!authData) {
          // No auth data, consider hydrated (user is not logged in)
          setIsRehydrated(true);
          console.log('✅ App.tsx: No auth data in sessionStorage, user not logged in');
          return;
        }
        
        // Auth data exists in sessionStorage
        const parsed = JSON.parse(authData);
        const hasAuthInStorage = parsed?.state?.isAuthenticated === true;
        
        // Check if Zustand store matches sessionStorage
        if (hasAuthInStorage && isAuthenticated) {
          console.log('✅ App.tsx: Zustand store matches sessionStorage, fully hydrated');
          setIsRehydrated(true);
        } else if (hasAuthInStorage && !isAuthenticated) {
          console.log('⏳ App.tsx: Auth data in sessionStorage but not in Zustand yet, waiting...');
          // Wait a bit more for Zustand to catch up
          setTimeout(checkRehydration, 50);
        } else {
          // No auth in storage, we're good
          console.log('✅ App.tsx: No auth required, hydrated');
          setIsRehydrated(true);
        }
      } catch (error) {
        console.error('❌ App.tsx: Error checking rehydration:', error);
        setIsRehydrated(true); // Fail open to prevent blocking
      }
    };
    
    checkRehydration();
  }, [isAuthenticated]);
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔍 App.tsx State:', {
      isAuthenticated,
      userRole: user?.role,
      tenantExists: !!tenant,
      tenantName: tenant?.name,
      isRehydrated,
      currentPath: window.location.pathname
    });
  }, [isAuthenticated, user, tenant, isRehydrated]);
  
  // Show loading while rehydrating
  if (!isRehydrated) {
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
                    <>
                      {/* Redirect /login to appropriate dashboard if already authenticated */}
                      <Route path="/login" element={
                        <Navigate 
                          to={
                            user?.role === 'super_admin' 
                              ? '/super-admin' 
                              : (user?.role as string) === 'tenant_admin' || user?.role === 'admin'
                                ? '/tenant/dashboard'
                                : '/dashboard'
                          } 
                          replace 
                        />
                      } />
                      <Route path="*" element={
                        <LogoProvider>
                          <TenantRouter />
                        </LogoProvider>
                      } />
                    </>
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
