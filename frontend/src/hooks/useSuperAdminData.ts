// frontend/src/hooks/useSuperAdminData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { log } from '@/utils/logger';
import superAdminApi from '@/services/superAdminApi';

// Query keys for Super Admin data
export const SUPER_ADMIN_QUERY_KEYS = {
  tenants: () => ['superAdmin', 'tenants'] as const,
  tenant: (id: string) => ['superAdmin', 'tenants', id] as const,
  users: () => ['superAdmin', 'users'] as const,
  user: (id: string) => ['superAdmin', 'users', id] as const,
  reports: () => ['superAdmin', 'reports'] as const,
  analytics: () => ['superAdmin', 'analytics'] as const,
  dashboard: () => ['superAdmin', 'dashboard'] as const,
} as const;

/**
 * Hook to fetch all tenants with caching
 */
export function useSuperAdminTenants() {
  return useQuery({
    queryKey: SUPER_ADMIN_QUERY_KEYS.tenants(),
    queryFn: async () => {
      log.debug('Fetching super admin tenants');
      console.log('🔍 Frontend: Calling /super-admin/tenants');
      const response = await superAdminApi.get('/super-admin/tenants');
      console.log('🔍 Frontend: Tenants response:', response.data);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch single tenant by ID
 */
export function useSuperAdminTenant(tenantId: string | undefined) {
  return useQuery({
    queryKey: SUPER_ADMIN_QUERY_KEYS.tenant(tenantId || ''),
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');
      log.debug('Fetching tenant by ID', { tenantId });
      const response = await superAdminApi.get(`/super-admin/tenants/${tenantId}`);
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch all users with caching
 */
export function useSuperAdminUsers() {
  return useQuery({
    queryKey: SUPER_ADMIN_QUERY_KEYS.users(),
    queryFn: async () => {
      log.debug('Fetching super admin users');
      console.log('🔍 Frontend: Calling /super-admin/users');
      const response = await superAdminApi.get('/super-admin/users');
      console.log('🔍 Frontend: Users response:', response.data);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch system reports with caching
 */
export function useSuperAdminReports() {
  return useQuery({
    queryKey: SUPER_ADMIN_QUERY_KEYS.reports(),
    queryFn: async () => {
      log.debug('Fetching super admin reports');
      console.log('🔍 Frontend: Calling /super-admin/reports');
      const response = await superAdminApi.get('/super-admin/reports');
      console.log('🔍 Frontend: Reports response:', response.data);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch system analytics with caching
 */
export function useSuperAdminAnalytics() {
  return useQuery({
    queryKey: SUPER_ADMIN_QUERY_KEYS.analytics(),
    queryFn: async () => {
      log.debug('Fetching super admin analytics');
      console.log('🔍 Frontend: Calling /super-admin/analytics');
      const response = await superAdminApi.get('/super-admin/analytics');
      console.log('🔍 Frontend: Analytics response:', response.data);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch super admin dashboard data with caching
 */
export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: SUPER_ADMIN_QUERY_KEYS.dashboard(),
    queryFn: async () => {
      log.debug('Fetching super admin dashboard');
      console.log('🔍 Frontend: Calling super admin dashboard endpoints');
      
      // Fetch all required data in parallel
      const [tenantsRes, usersRes, analyticsRes, reportsRes] = await Promise.all([
        superAdminApi.get('/super-admin/tenants'),
        superAdminApi.get('/super-admin/users'),
        superAdminApi.get('/super-admin/analytics'),
        superAdminApi.get('/super-admin/reports'),
      ]);

      console.log('🔍 Frontend: Dashboard responses loaded');

      return {
        tenants: tenantsRes.data,
        users: usersRes.data,
        analytics: analyticsRes.data,
        reports: reportsRes.data,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to create a new tenant
 */
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantData: any) => {
      const response = await superAdminApi.post('/super-admin/tenants', tenantData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch tenants list
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.tenants() });
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.dashboard() });
    },
  });
}

/**
 * Hook to update a tenant
 */
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await superAdminApi.put(`/super-admin/tenants/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate specific tenant and list
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.tenant(variables.id) });
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.tenants() });
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.dashboard() });
    },
  });
}

/**
 * Hook to delete a tenant
 */
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await superAdminApi.delete(`/super-admin/tenants/${tenantId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate tenants list
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.tenants() });
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.dashboard() });
    },
  });
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await superAdminApi.delete(`/super-admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.users() });
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.dashboard() });
    },
  });
}


