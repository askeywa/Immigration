// backend/src/config/config.ts
export const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/immigration-app',
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
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5175',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500', 10), // 500 requests per 15 minutes (reasonable for development)
    
    // Domain Configuration
    superAdminDomain: process.env.SUPER_ADMIN_DOMAIN || 'www.sehwagimmigration.com',
    tenantDomainPrefix: process.env.TENANT_DOMAIN_PREFIX || 'portal',
    apiDomain: process.env.API_BASE_URL || 'api.sehwagimmigration.com',
    
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

