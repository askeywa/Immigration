// Frontend API Configuration
export const apiConfig = {
  // Base API URL - uses environment variables
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  
  // Super Admin API URL
  superAdminApiUrl: import.meta.env.VITE_SUPER_ADMIN_API_URL || 'http://localhost:5000',
  
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
    
    // For production, determine API URL based on domain
    if (domain) {
      const template = import.meta.env.VITE_TENANT_API_URL_TEMPLATE || 'https://{domain}';
      return template.replace('{domain}', domain);
    }
    
    // Fallback to EC2 IP for production
    const ec2Ip = import.meta.env.VITE_EC2_PUBLIC_IP || '52.15.148.97';
    return `https://${ec2Ip}:5000`;
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
    
    // For production, use EC2 IP or domain
    const ec2Ip = import.meta.env.VITE_EC2_PUBLIC_IP || '52.15.148.97';
    return `https://${ec2Ip}:5000/api`;
  }
};

export default apiConfig;
