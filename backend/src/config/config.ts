// backend/src/config/config.ts
export const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://immigration_db_user:ImmigrationDB2024@rcicdb.npymiqt.mongodb.net/?retryWrites=true&w=majority&appName=RCICDB',
    jwtSecret: (() => {
      if (!process.env.JWT_SECRET) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET must be set in production environment');
        }
        console.warn('⚠️  JWT_SECRET not set, using development secret. Set JWT_SECRET in production!');
        return 'dev-secret-change-in-production';
      }
      return process.env.JWT_SECRET;
    })(),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    // Dynamic Frontend URL Configuration
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
    superAdminFrontendUrl: process.env.SUPER_ADMIN_FRONTEND_URL || 'http://localhost:5174',
    tenantFrontendUrlTemplate: process.env.TENANT_FRONTEND_URL_TEMPLATE || 'https://{domain}',
    
    // Dynamic URL Helper Functions
    getFrontendUrl: (domain?: string) => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isSuperAdmin = domain === 'ibuyscrap.ca' || domain === 'www.ibuyscrap.ca' || domain === 'localhost';
      
      if (isDevelopment) {
        return process.env.FRONTEND_URL || 'http://localhost:5174';
      }
      
      if (isSuperAdmin) {
        return process.env.SUPER_ADMIN_FRONTEND_URL || 'https://ibuyscrap.ca';
      }
      
      if (domain) {
        const template = process.env.TENANT_FRONTEND_URL_TEMPLATE || 'https://{domain}';
        return template.replace('{domain}', domain);
      }
      
      return process.env.FRONTEND_URL || 'http://localhost:5174';
    },
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500', 10), // 500 requests per 15 minutes (reasonable for development)
    
    // Domain Configuration
    superAdminDomain: process.env.SUPER_ADMIN_DOMAIN || 'ibuyscrap.ca',
    tenantDomainPrefix: process.env.TENANT_DOMAIN_PREFIX || 'immigration-portal',
    apiDomain: process.env.API_BASE_URL || 'localhost:5000',
    
    // EC2 Instance Configuration
    ec2PublicIp: process.env.EC2_PUBLIC_IP || '52.15.148.97',
    ec2PrivateIp: process.env.EC2_PRIVATE_IP || '172.31.40.28',
    ec2PublicDns: process.env.EC2_PUBLIC_DNS || 'ec2-52-15-148-97.us-east-2.compute.amazonaws.com',
    
    // Tenant API Configuration - Using /immigration-portal/ path
    tenantApiBaseUrl: process.env.TENANT_API_BASE_URL || 'https://{domain}/immigration-portal',
    tenantApiVersion: process.env.TENANT_API_VERSION || 'v1',
    
    // Get tenant-specific API URL with /immigration-portal/ path
    getTenantApiUrl: (domain?: string) => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        return `http://localhost:5000/api/v1`;
      }
      
      if (domain) {
        // For tenant domains, use the tenant's domain with /immigration-portal/ path
        return `https://${domain}/immigration-portal/api/v1`;
      }
      
      // Fallback to EC2 IP
      const ec2Ip = process.env.EC2_PUBLIC_IP || '52.15.148.97';
      return `http://${ec2Ip}:5000/api/v1`;
    },
    
    // Get EC2-based API URL for tenant domains with /immigration-portal/ path
    getTenantApiUrlByDomain: (domain?: string) => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        return `http://localhost:5000/api/v1`;
      }
      
      if (domain) {
        // For tenant domains, use the tenant's domain with /immigration-portal/ path
        return `https://${domain}/immigration-portal/api/v1`;
      }
      
      // Fallback to EC2 IP
      const ec2Ip = process.env.EC2_PUBLIC_IP || '52.15.148.97';
      return `http://${ec2Ip}:5000/api/v1`;
    },
    
    // Allowed domains for super admin access (comma-separated)
    allowedSuperAdminDomains: (process.env.ALLOWED_SUPER_ADMIN_DOMAINS || 'ibuyscrap.ca,www.ibuyscrap.ca,localhost')
      .split(',')
      .map(domain => domain.trim())
      .filter(domain => domain.length > 0),
    
    // App Configuration
    appName: process.env.APP_NAME || 'Immigration Portal',
    
    allowStartWithoutDb: (() => {
      if (process.env.ALLOW_START_WITHOUT_DB !== undefined) {
        return process.env.ALLOW_START_WITHOUT_DB === 'true';
      }
      return (process.env.NODE_ENV !== 'production');
    })(),
    
    // Redis Configuration
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    redisEnabled: process.env.REDIS_ENABLED !== 'false' && process.env.NODE_ENV === 'production',
  };

