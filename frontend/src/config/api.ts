// Frontend API Configuration
export const apiConfig = {
  // Base API URL - uses environment variables
  baseUrl: import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5000' : 'https://ibuyscrap.ca'),
  
  // Super Admin API URL
  superAdminApiUrl: import.meta.env.VITE_SUPER_ADMIN_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5000' : 'https://ibuyscrap.ca'),
  
  // Tenant API URL template
  tenantApiUrlTemplate: import.meta.env.VITE_TENANT_API_URL_TEMPLATE || 'https://{domain}',
  
  // EC2 Configuration
  ec2PublicIp: import.meta.env.VITE_EC2_PUBLIC_IP || '52.15.148.97',
  ec2PublicDns: import.meta.env.VITE_EC2_PUBLIC_DNS || 'ec2-52-15-148-97.us-east-2.compute.amazonaws.com',
  
  // Get API URL based on environment and domain
  getApiUrl: (domain?: string) => {
    const isDevelopment = import.meta.env.MODE === 'development';
    
    if (isDevelopment) {
      return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    }
    
    // For production, use the current domain (ibuyscrap.ca) for super admin
    return 'https://ibuyscrap.ca';
  },
  
  // Get tenant-specific API URL with /immigration-portal/ path
  getTenantApiUrl: (domain: string) => {
    const isDevelopment = import.meta.env.MODE === 'development';
    
    if (isDevelopment) {
      return 'http://localhost:5000/api/v1';
    }
    
    // For production, use tenant domain with /immigration-portal/ path
    return `https://${domain}/immigration-portal/api/v1`;
  },
  
  // Get super admin API URL
  getSuperAdminApiUrl: () => {
    const isDevelopment = import.meta.env.MODE === 'development';
    
    if (isDevelopment) {
      return 'http://localhost:5000/api';
    }
    
    // For production, use the domain
    return 'https://ibuyscrap.ca/api';
  }
};

export default apiConfig;
