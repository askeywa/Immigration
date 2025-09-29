// backend/src/server.ts
// Load New Relic FIRST before any other modules
import 'newrelic';

import dotenv from 'dotenv';

// Load environment variables first, before any other imports
// Look for .env file in the current directory (backend/)
dotenv.config({ path: './.env' });

// Validate environment variables
import { validateEnvironmentVariables, getEnvironmentInfo } from './config/envValidation';
try {
  validateEnvironmentVariables();
  const envInfo = getEnvironmentInfo();
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Environment Info:', envInfo);
  }
} catch (error) {
  console.error('❌ Environment validation failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// Debug: Check if environment variables are loaded
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment check:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***LOADED***' : 'NOT LOADED');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDatabase, disconnectDatabase, isDatabaseConnected, getDatabaseInfo } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { initializeRowLevelSecurity } from './middleware/rowLevelSecurity';
import { requestResponseLogging } from './middleware/requestResponseLogging';
import { 
  sentryMiddleware, 
  errorTrackingMiddleware,
} from './middleware/apmMiddleware';
import { comprehensiveLogging } from './middleware/loggingMiddleware';
import { PerformanceMonitoringService } from './services/performanceMonitoringService';
import mongoose from 'mongoose';
import { log } from './utils/logger';
import { NotificationService } from './services/notificationService';
import { RateLimitService } from './services/rateLimitService';
import { SessionService } from './services/sessionService';
import { SecurityService } from './services/securityService';
import { DataIsolationService } from './services/dataIsolationService';
import { ImpersonationService } from './services/impersonationService';
import { TenantResolutionService } from './services/tenantResolutionService';
import { DatabaseMigrationService } from './services/databaseMigrationService';
import { sessionManagement, sessionActivityTracking, sessionSecurityPolicy } from './middleware/sessionManagement';
import { 
  securityHeaders, 
  corsSecurity, 
  mongoSanitization, 
  xssProtection, 
  parameterPollutionProtection,
  csrfProtection,
  inputValidation,
  requestSizeLimit,
  securityMonitoring,
  tenantSecurityValidation,
  contentTypeValidation
} from './middleware/securityHardening';
import { 
  bulletproofTenantIsolation,
  databaseQueryIsolation,
  resourceAccessValidation,
  tenantIdEnforcement,
  queryValidation,
  crossTenantAccessPrevention,
  dataIsolationMonitoring,
  comprehensiveDataIsolation
} from './middleware/dataIsolation';
import { 
  comprehensiveImpersonation
} from './middleware/impersonation';
import { 
  comprehensiveTenantResolution
} from './middleware/enhancedTenantResolution';
import { sanitizeRequest } from './utils/sanitization';
import { LightweightMonitoring } from './utils/lightweightMonitoring';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import profileRoutes from './routes/profileRoutes';
import drawRoutes from './routes/drawRoutes';
import fileRoutes from './routes/fileRoutes';
import tenantRoutes from './routes/tenantRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import healthRoutes from './routes/healthRoutes';
import mfaRoutes from './routes/mfaRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';
import tenantValidationRoutes from './routes/tenantValidationRoutes';
import requestLoggingRoutes from './routes/requestLoggingRoutes';
import logoRoutes from './routes/logoRoutes';
import tenantActivityRoutes from './routes/tenantActivityRoutes';
import performanceMonitoringRoutes from './routes/performanceMonitoringRoutes';
import dnsAutomationRoutes from './routes/dnsAutomationRoutes';
import sslAutomationRoutes from './routes/sslAutomationRoutes';
import subdomainProvisioningRoutes from './routes/subdomainProvisioningRoutes';
import loggingRoutes from './routes/loggingRoutes';
import backupRoutes from './routes/backupRoutes';
import indexingRoutes from './routes/indexingRoutes';
import enhancedAuditRoutes from './routes/enhancedAuditRoutes';
import rateLimitRoutes from './routes/rateLimitRoutes';
import sessionRoutes from './routes/sessionRoutes';
import securityRoutes from './routes/securityRoutes';
import dataIsolationRoutes from './routes/dataIsolationRoutes';
import impersonationRoutes from './routes/impersonationRoutes';
import tenantResolutionRoutes from './routes/tenantResolutionRoutes';
import databaseMigrationRoutes from './routes/databaseMigrationRoutes';
import themeRoutes from './routes/themeRoutes';
import superAdminRoutes from './routes/superAdminRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// APM Middleware
try {
  app.use(sentryMiddleware);
  log.info('Sentry middleware applied');
} catch (error) {
  log.error('Sentry middleware error', { error: error instanceof Error ? error.message : String(error) });
}

// Comprehensive Logging Middleware
app.use(comprehensiveLogging);

// Security middleware (order is important!)
app.use(securityHeaders());
app.use(corsSecurity());

// Trust proxy for rate limiting with X-Forwarded-For headers
// This is essential for proper rate limiting behind a reverse proxy (Nginx)
app.set('trust proxy', 1);

app.use(requestSizeLimit('10mb'));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  skip: (req: any) => {
    // Skip rate limiting for health checks
    return (req as any).url === '/api/health' || (req as any).url.startsWith('/api/health');
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware (must be after body parsing)
app.use(sanitizeRequest);

// Request/Response logging middleware
app.use(requestResponseLogging);

// Performance monitoring middleware
app.use(PerformanceMonitoringService.createMonitoringMiddleware());

// Security hardening middleware
app.use(mongoSanitization());
app.use(xssProtection());
app.use(parameterPollutionProtection());
app.use(contentTypeValidation());
app.use(securityMonitoring());

// Performance middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Basic health check route (no database dependency)
app.get('/api/health', (req: any, res: any) => {
  const dbInfo = getDatabaseInfo();
  (res as any).status(200).json({
    status: 'OK',
    message: 'Immigration Portal API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: isDatabaseConnected(),
      readyState: dbInfo.readyState,
      host: dbInfo.host,
      port: dbInfo.port,
      name: dbInfo.name
    }
  });
});

// Enhanced health check route
app.get('/api/health/detailed', async (req: any, res: any) => {
  try {
    const dbInfo = getDatabaseInfo();
    const isDbConnected = isDatabaseConnected();
    
    // Try to ping database if connected
    let dbPing = false;
    if (isDbConnected) {
      try {
        await mongoose.connection.db?.admin().ping();
        dbPing = true;
      } catch (error) {
        log.warn('Database ping failed', { error: error instanceof Error ? error.message : String(error) });
      }
    }

    (res as any).status(200).json({
      status: isDbConnected && dbPing ? 'OK' : 'PARTIAL',
      message: 'Immigration Portal API Health Check',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: isDbConnected,
        pingSuccess: dbPing,
        readyState: dbInfo.readyState,
        readyStateDescription: getReadyStateDescription(dbInfo.readyState),
        host: dbInfo.host,
        port: dbInfo.port,
        name: dbInfo.name
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      uptime: Math.round(process.uptime())
    });
  } catch (error) {
    (res as any).status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Function to get readable description of mongoose ready state
function getReadyStateDescription(state: number): string {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
}

// Health check routes (no authentication required)
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/draw', drawRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/audit-logs', enhancedAuditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/tenant-validation', tenantValidationRoutes);
app.use('/api/request-logging', requestLoggingRoutes);
app.use('/api/performance-monitoring', performanceMonitoringRoutes);
app.use('/api/dns', dnsAutomationRoutes);
app.use('/api/ssl', sslAutomationRoutes);
app.use('/api/subdomains', subdomainProvisioningRoutes);
app.use('/api/logging', loggingRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/database', indexingRoutes);
app.use('/api/rate-limits', rateLimitRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/data-isolation', dataIsolationRoutes);
app.use('/api/impersonation', impersonationRoutes);
app.use('/api/tenant-resolution', tenantResolutionRoutes);
app.use('/api/database-migration', databaseMigrationRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/logos', logoRoutes);
app.use('/api/tenant', tenantActivityRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Tenant-specific API routes (for tenant website integration)
import tenantApiRoutes from './routes/tenantApiRoutes';
app.use('/api/v1', tenantApiRoutes);

// 404 handler
app.use('*', (req: any, res: any) => {
  (res as any).status(404).json({
    status: 'error',
    message: `Route ${(req as any).originalUrl} not found`
  });
});

// Error tracking middleware (before error handler)
app.use(errorTrackingMiddleware);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize services with proper error handling
const initializeServices = async () => {
  const services = [
    {
      name: 'Rate Limiting Service',
      init: () => RateLimitService.initialize(),
      critical: false
    },
    {
      name: 'Session Management Service',
      init: () => SessionService.initialize(),
      critical: false
    },
    {
      name: 'Security Service',
      init: () => SecurityService.initialize(),
      critical: false
    },
    {
      name: 'Data Isolation Service',
      init: () => DataIsolationService.initialize(),
      critical: false
    },
    {
      name: 'Impersonation Service',
      init: () => ImpersonationService.initialize(),
      critical: false
    },
    {
      name: 'Tenant Resolution Service',
      init: () => TenantResolutionService.initialize(),
      critical: false
    },
    {
      name: 'Database Migration Service',
      init: () => DatabaseMigrationService.initialize(),
      critical: false
    }
  ];

  for (const service of services) {
    try {
      await service.init();
      log.info(`✅ ${service.name} initialized`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (service.critical) {
        log.error(`❌ ${service.name} failed to initialize (CRITICAL)`, { error: errorMessage });
        throw error;
      } else {
        log.warn(`⚠️  ${service.name} failed to initialize (non-critical)`, { error: errorMessage });
      }
    }
  }
};

// Database connection and server startup
const startServer = async () => {
  try {
    log.info('🚀 Starting Immigration Portal Server...', {
      environment: process.env.NODE_ENV,
      port: PORT,
      nodeVersion: process.version
    });

    // Connect to MongoDB with better error handling
    try {
      await connectDatabase();
      log.info('✅ Database connected successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('❌ Database connection failed', { error: errorMessage });
      
      // In production, we must have a database connection
      if (process.env.NODE_ENV === 'production') {
        throw error;
      } else {
        log.warn('⚠️  Continuing without database in development mode');
      }
    }

    // Initialize Row-Level Security system
    initializeRowLevelSecurity();
    
    // Initialize services
    await initializeServices();
    
    // Initialize Performance Monitoring Service
    try {
      PerformanceMonitoringService.initialize();
      log.info('✅ Performance Monitoring Service initialized (memory optimized)');
    } catch (error) {
      log.error('❌ Performance Monitoring Service failed to initialize', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      log.warn('⚠️  Continuing without performance monitoring - service will be unavailable');
    }
    
    // Initialize Lightweight Monitoring
    LightweightMonitoring.initialize();
    log.info('✅ Lightweight Monitoring initialized');
    
    // Configure session middleware
    try {
      app.use(SessionService.createSessionMiddleware() as any);
      app.use(sessionActivityTracking());
      app.use(sessionSecurityPolicy());
      log.info('✅ Session middleware configured');
    } catch (error) {
      log.warn('⚠️  Session middleware configuration skipped', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
    
    // Configure comprehensive tenant resolution middleware
    try {
      app.use(comprehensiveTenantResolution());
      log.info('✅ Tenant resolution middleware configured');
    } catch (error) {
      log.warn('⚠️  Tenant resolution middleware configuration skipped', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
    
    // Configure comprehensive data isolation middleware
    try {
      app.use(comprehensiveDataIsolation());
      log.info('✅ Data isolation middleware configured');
    } catch (error) {
      log.warn('⚠️  Data isolation middleware configuration skipped', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
    
    // Configure comprehensive impersonation middleware
    try {
      app.use(comprehensiveImpersonation());
      log.info('✅ Impersonation middleware configured');
    } catch (error) {
      log.warn('⚠️  Impersonation middleware configuration skipped', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    // Start the server
    const server = app.listen(PORT, () => {
      log.info(`🚀 Server running on port ${PORT}`, {
        port: PORT,
        apiDocs: `http://localhost:${PORT}/api/health`,
        environment: process.env.NODE_ENV || 'development',
        database: {
          connected: isDatabaseConnected(),
          info: getDatabaseInfo()
        }
      });
      
      // Start automated notification checks only if database is connected
      if (isDatabaseConnected()) {
        try {
          NotificationService.startAutomatedChecks();
          log.info('✅ Notification service automated checks started');
        } catch (error) {
          log.warn('⚠️  Failed to start notification automated checks', { 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      log.info(`👋 ${signal} received. Shutting down gracefully...`, { signal });
      
      // Close server gracefully
      server.close(async () => {
        log.info('✅ Server closed');
        
        // Close database connection if connected
        if (isDatabaseConnected()) {
          try {
            await disconnectDatabase();
            log.info('✅ Database connection closed');
          } catch (error) {
            log.error('❌ Error closing database connection', { 
              error: error instanceof Error ? error.message : String(error) 
            });
          }
        }
        
        process.exit(0);
      });
      
      // Force close after 15 seconds
      setTimeout(() => {
        log.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 15000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    log.error('❌ Failed to start server', { 
      error: errorMessage,
      stack: errorStack,
      environment: process.env.NODE_ENV
    });
    
    console.error('❌ Failed to start server:', errorMessage);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  const errorMessage = reason instanceof Error ? reason.message : String(reason);
  const errorStack = reason instanceof Error ? reason.stack : undefined;
  
  log.error('❌ Unhandled Promise Rejection:', { 
    error: {
      name: 'UnhandledPromiseRejection',
      message: errorMessage,
      stack: errorStack
    }
  });
  
  // In production, log the error but don't crash immediately
  if (process.env.NODE_ENV === 'production') {
    log.warn('⚠️  Continuing despite unhandled promise rejection in production');
  } else {
    // In development, we might want to crash to catch issues early
    console.error('Unhandled Promise Rejection:', reason);
    // Uncomment the line below if you want to crash on unhandled rejections in dev
    // process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  log.error('❌ Uncaught Exception:', { 
    error: error.message, 
    stack: error.stack,
    name: error.name
  });
  
  // Log the error and exit gracefully
  console.error('Uncaught Exception:', error);
  
  // Give some time for logging before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle process warnings
process.on('warning', (warning) => {
  log.warn('⚠️  Process Warning:', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

// Start the server
startServer();

export default app;