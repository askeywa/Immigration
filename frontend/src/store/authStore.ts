// frontend/src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, User, Tenant, Subscription } from '@/types/auth.types';
import { authService } from '@/services/auth.service';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      subscription: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string, tenantDomain?: string) => {
        try {
          console.log('🔍 AuthStore: Calling authService.login...');
          const response = await authService.login(email, password, tenantDomain);
          console.log('🔍 AuthStore: Response received:', response);
          console.log('🔍 AuthStore: Setting user data:', {
            user: response.data.user,
            tenant: response.data.tenant?.name,
            subscription: response.data.subscription?.status,
            token: response.data.token
          });
          
          // Set initial state immediately (don't wait for permissions)
          set({
            user: { ...response.data.user, permissions: [] },
            tenant: response.data.tenant || null,
            subscription: response.data.subscription || null,
            token: response.data.token,
            isAuthenticated: true,
          });
          console.log('✅ AuthStore: Login successful, state updated');
          
          // Load user permissions asynchronously (non-blocking)
          setTimeout(async () => {
            try {
              const permissions = await authService.getUserPermissions();
              const currentState = get();
              if (currentState.user) {
                set({
                  user: { ...currentState.user, permissions }
                });
                console.log('✅ AuthStore: Permissions loaded asynchronously');
              }
            } catch (error) {
              console.warn('⚠️ AuthStore: Failed to load permissions (non-blocking):', error);
            }
          }, 100);
        } catch (error) {
          console.error('❌ AuthStore: Login failed:', error);
          throw error;
        }
      },

      register: async (userData: { firstName: string; lastName: string; email: string; password: string; companyName?: string; domain?: string; tenantId?: string }) => {
        try {
          console.log('🔍 AuthStore: Calling authService.register...');
          const response = await authService.register(userData);
          console.log('🔍 AuthStore: Registration response received:', response);
          console.log('🔍 AuthStore: Setting user data after registration:', {
            user: response.data.user,
            tenant: response.data.tenant?.name,
            subscription: response.data.subscription?.status,
            token: response.data.token
          });
          
          // Set initial state immediately (don't wait for permissions)
          set({
            user: { ...response.data.user, permissions: [] },
            tenant: response.data.tenant || null,
            subscription: response.data.subscription || null,
            token: response.data.token,
            isAuthenticated: true,
          });
          console.log('✅ AuthStore: Registration successful, state updated');
          
          // Load user permissions asynchronously (non-blocking)
          setTimeout(async () => {
            try {
              const permissions = await authService.getUserPermissions();
              const currentState = get();
              if (currentState.user) {
                set({
                  user: { ...currentState.user, permissions }
                });
                console.log('✅ AuthStore: Permissions loaded asynchronously after registration');
              }
            } catch (error) {
              console.warn('⚠️ AuthStore: Failed to load permissions after registration (non-blocking):', error);
            }
          }, 100);
        } catch (error) {
          console.error('❌ AuthStore: Registration failed:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          tenant: null,
          subscription: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setTenant: (tenant: Tenant | null) => {
        set({ tenant });
      },

      setSubscription: (subscription: Subscription | null) => {
        set({ subscription });
      },

      switchTenant: async (tenantId: string) => {
        try {
          console.log('🔍 AuthStore: Switching to tenant:', tenantId);
          const response = await authService.switchTenant(tenantId);
          
          // Set initial state immediately (don't wait for permissions)
          set({
            user: { ...response.data.user, permissions: [] },
            tenant: response.data.tenant || null,
            subscription: response.data.subscription || null,
            token: response.data.token,
          });
          console.log('✅ AuthStore: Tenant switched successfully');
          
          // Load user permissions asynchronously (non-blocking)
          setTimeout(async () => {
            try {
              const permissions = await authService.getUserPermissions();
              const currentState = get();
              if (currentState.user) {
                set({
                  user: { ...currentState.user, permissions }
                });
                console.log('✅ AuthStore: Permissions loaded asynchronously after tenant switch');
              }
            } catch (error) {
              console.warn('⚠️ AuthStore: Failed to load permissions after tenant switch (non-blocking):', error);
            }
          }, 100);
        } catch (error) {
          console.error('❌ AuthStore: Failed to switch tenant:', error);
          throw error;
        }
      },

      hasPermission: (permission: string): boolean => {
        const { user } = get();
        if (!user || !user.permissions) return false;
        
        // Super admin has all permissions
        if (user.role === 'super_admin') return true;
        
        return user.permissions.includes(permission);
      },

      isSuperAdmin: (): boolean => {
        const { user } = get();
        return user?.role === 'super_admin' || false;
      },

      isTenantAdmin: (): boolean => {
        const { user } = get();
        return user?.role === 'admin' || user?.role === 'super_admin' || false;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        subscription: state.subscription,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);