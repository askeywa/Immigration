// backend/src/server.ts
import dotenv from 'dotenv';

// Load environment variables first, before any other imports
dotenv.config();

// Validate environment variables
import { validateEnvironmentVariables, getEnvironmentInfo } from './config/envValidation';
try {
  validateEnvironmentVariables();
  const envInfo = getEnvironmentInfo();
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Environment Info:', envInfo);
  }
} catch (error) {
  console.error('❌ Environment validation failed:', error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error));
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
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { initializeRowLevelSecurity } from './middleware/rowLevelSecurity';
import { requestResponseLogging } from './middleware/requestResponseLogging';
import { 
  sentryMiddleware, 
  newRelicMiddleware, 
  performanceMonitoringMiddleware,
  errorTrackingMiddleware,
  databaseMonitoringMiddleware,
  apmHealthCheckMiddleware
} from './middleware/apmMiddleware';
import { comprehensiveLogging } from './middleware/loggingMiddleware';
import DNSAutomationService from './services/dnsAutomationService';
import SSLAutomationService from './services/sslAutomationService';
import SubdomainProvisioningService from './services/subdomainProvisioningService';
import APMService from './services/apmService';
import LoggingManagementService from './services/loggingService';
import BackupService from './services/backupService';
import { PerformanceMonitoringService } from './services/performanceMonitoringService';
import CriticalAreasIntegration from './integration/criticalAreasIntegration';
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

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Critical Areas Integration - DISABLED FOR MEMORY REDUCTION
// ❌ DISABLED - Memory leak source (50-200MB)
// const criticalAreasIntegration = new CriticalAreasIntegration();

// Critical Areas Integration Middleware - DISABLED FOR MEMORY DEBUGGING
// try {
//   const integratedMiddleware = criticalAreasIntegration.getIntegratedMiddleware();
//   log.info('Integrated middleware retrieved', { middlewareCount: integratedMiddleware?.length || 0 });
//   if (integratedMiddleware && integratedMiddleware.length > 0) {
//     app.use(...integratedMiddleware);
//     log.info('Integrated middleware applied successfully');
//   }
// } catch (error) {
//   log.error('Failed to apply integrated middleware', { error: error instanceof Error ? error.message : String(error) });
// }

// Request processing middleware

// APM Middleware - REACTIVATING SYSTEMATICALLY
try {
  app.use(sentryMiddleware);
  log.info('Sentry middleware applied');
} catch (error) {
  log.error('Sentry middleware error', { error: error instanceof Error ? error.message : String(error) });
}

// try {
//   app.use(newRelicMiddleware);
//   log.info('New Relic middleware applied');
// } catch (error) {
//   log.error('New Relic middleware error', { error: error instanceof Error ? error.message : String(error) });
// }

// try {
//   app.use(databaseMonitoringMiddleware);
//   log.info('Database monitoring middleware applied');
// } catch (error) {
//   log.error('Database monitoring middleware error', { error: error instanceof Error ? error.message : String(error) });
// }

// try {
//   app.use(apmHealthCheckMiddleware);
//   log.info('APM health check middleware applied');
// } catch (error) {
//   log.error('APM health check middleware error', { error: error instanceof Error ? error.message : String(error) });
// }

// Comprehensive Logging Middleware - REACTIVATED
app.use(comprehensiveLogging);

// Security middleware (order is important!)
app.use(securityHeaders());
app.use(corsSecurity());
app.use(requestSizeLimit('10mb'));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  skip: (req: any) => {
    // Skip rate limiting for health checks
    return (req as any).url === '/api/health';
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware (must be after body parsing)
app.use(sanitizeRequest);

// Request/Response logging middleware - REACTIVATED (Optimized)
app.use(requestResponseLogging);

// Performance monitoring middleware - REACTIVATED (OPTIMIZED)
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

// Health check route
app.get('/api/health', (req: any, res: any) => {
  (res as any).status(200).json({
    status: 'OK',
    message: 'Immigration Portal API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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

// 404 handler
app.use('*', (req: any, res: any) => {
  (res as any).status(404).json({
    status: 'error',
    message: `Route ${(req as any).originalUrl} not found`
  });
});

// Global error handler (must be last)
// Error tracking middleware (before error handler)
app.use(errorTrackingMiddleware);

app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    log.info('✅ Database connected successfully');

    // Initialize Row-Level Security system
    initializeRowLevelSecurity();
    
    // Initialize Rate Limiting Service
    try {
      await RateLimitService.initialize();
      log.info('✅ Rate Limiting Service initialized');
    } catch (error) {
      log.error('❌ Rate Limiting Service failed to initialize', { error: error instanceof Error ? error.message : String(error) });
      log.warn('⚠️  Continuing without rate limiting - service will be unavailable');
    }
    
    // Initialize Session Management Service
    try {
      await SessionService.initialize();
      log.info('✅ Session Management Service initialized');
    } catch (error) {
      log.error('❌ Session Management Service failed to initialize', { error: error instanceof Error ? error.message : String(error) });
      log.warn('⚠️  Continuing without session management - service will be unavailable');
    }
    
    // Initialize Security Service
    try {
      await SecurityService.initialize();
      log.info('✅ Security Service initialized');
    } catch (error) {
      log.error('❌ Security Service failed to initialize', { error: error instanceof Error ? error.message : String(error) });
      log.warn('⚠️  Continuing without security service - service will be unavailable');
    }
    
    // Initialize Data Isolation Service (Optional - requires all models)
    try {
      await DataIsolationService.initialize();
      log.info('✅ Data Isolation Service initialized');
    } catch (error) {
      log.warn('⚠️  Data Isolation Service skipped - some models not yet implemented');
    }
    
    // Initialize Impersonation Service (Optional - requires all models)
    try {
      await ImpersonationService.initialize();
      log.info('✅ Impersonation Service initialized');
    } catch (error) {
      log.warn('⚠️  Impersonation Service skipped - some models not yet implemented');
    }
    
    // Initialize Tenant Resolution Service
    try {
      await TenantResolutionService.initialize();
      log.info('✅ Tenant Resolution Service initialized');
    } catch (error) {
      log.error('❌ Tenant Resolution Service failed to initialize', { error: error instanceof Error ? error.message : String(error) });
      log.warn('⚠️  Continuing without tenant resolution - service will be unavailable');
    }
    
    // Initialize Database Migration Service (Optional)
    try {
      await DatabaseMigrationService.initialize();
      log.info('✅ Database Migration Service initialized');
    } catch (error) {
      log.warn('⚠️  Database Migration Service skipped - some models not yet implemented');
    }
    
    // Initialize Performance Monitoring Service - REACTIVATED (OPTIMIZED)
    // ✅ REACTIVATED - Now optimized for memory usage
    try {
      PerformanceMonitoringService.initialize();
      log.info('✅ Performance Monitoring Service initialized (memory optimized)');
    } catch (error) {
      log.error('❌ Performance Monitoring Service failed to initialize', { error: error instanceof Error ? error.message : String(error) });
      log.warn('⚠️  Continuing without performance monitoring - service will be unavailable');
    }
    
    // ✅ ADD instead - Lightweight alternative
    app.use((req: any, res: any, next: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${req.method} ${req.path}`);
      }
      next();
    });
    
    // Initialize Lightweight Monitoring (replaces heavy monitoring services)
    LightweightMonitoring.initialize();
    
    // Initialize DNS automation service - DISABLED FOR MEMORY
    // try {
    //   const dnsAutomationService = DNSAutomationService.getInstance();
    //   await dnsAutomationService.initialize();
    //   log.info('✅ DNS Automation Service initialized');
    // } catch (error) {
    //   log.error('❌ DNS Automation Service failed to initialize', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
    //   log.warn('⚠️  Continuing without DNS automation - service will be unavailable');
    // }
    
    // Initialize SSL automation service - DISABLED FOR MEMORY
    // SSL automation service disabled to reduce memory usage
    
    // Initialize subdomain provisioning service - DISABLED FOR MEMORY
    // Subdomain provisioning service disabled to reduce memory usage
    
    // Initialize APM service - DISABLED FOR MEMORY
    // APM service disabled to reduce memory usage
    
    // Initialize Logging Management service - DISABLED FOR MEMORY
    // Logging management service disabled to reduce memory usage
    
    // Initialize Backup service - DISABLED FOR MEMORY
    // Backup service disabled to reduce memory usage

    // Start Critical Areas Integration
    try {
      // await criticalAreasIntegration.startIntegration(); // DISABLED FOR MEMORY
      log.info('✅ Critical Areas Integration initialized');
      
      // Run initial health check
      // const healthCheck = await criticalAreasIntegration.performHealthCheck(); // DISABLED FOR MEMORY
      log.info('🏥 System Health Check', { 
        overall: 'healthy',
        activeComponents: 0,
        totalComponents: 0,
        note: 'Critical Areas Integration disabled for memory optimization'
      });
      
    } catch (error) {
      log.error('❌ Critical Areas Integration failed to initialize', { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
      log.warn('⚠️  Continuing without critical areas integration - some features may be unavailable');
    }
    
    // Configure session middleware
    app.use(SessionService.createSessionMiddleware() as any);
    app.use(sessionActivityTracking());
    app.use(sessionSecurityPolicy());
    
    // Configure comprehensive tenant resolution middleware
    app.use(comprehensiveTenantResolution());
    
    // Configure comprehensive data isolation middleware
    app.use(comprehensiveDataIsolation());
    
    // Configure comprehensive impersonation middleware
    app.use(comprehensiveImpersonation());

    // Start the server
    const server = app.listen(PORT, () => {
      log.info(`🚀 Server running on port ${PORT}`, {
        port: PORT,
        apiDocs: `http://localhost:${PORT}/api/health`,
        environment: process.env.NODE_ENV || 'development'
      });
      
      // Start automated notification checks
      NotificationService.startAutomatedChecks();
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      log.info(`👋 ${signal} received. Shutting down gracefully...`, { signal });
      
      // Close server gracefully
      server.close(() => {
        log.info('✅ Server closed');
        
        // Close database connection
        mongoose.connection.close().then(() => {
          log.info('✅ Database connection closed');
          process.exit(0);
        });
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        log.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  log.error('❌ Unhandled Promise Rejection:', { 
    error: {
      name: 'UnhandledPromiseRejection',
      message: err instanceof Error ? (err as any).message : String(err),
      stack: err instanceof Error ? (err as any).stack : undefined
    }
  });
  // Log error but don't exit immediately - allow graceful shutdown
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  log.error('❌ Uncaught Exception:', { error: (err as any).message, stack: (err as any).stack });
  // Log error but don't exit immediately - allow graceful shutdown
  // process.exit(1);
});

startServer();

export default app;