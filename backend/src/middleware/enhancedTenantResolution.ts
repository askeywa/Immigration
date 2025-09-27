// backend/src/middleware/enhancedTenantResolution.ts
import { Request, Response, NextFunction } from 'express';
import { TenantRequest } from './tenantResolution';
import { TenantResolutionService } from '../services/tenantResolutionService';
import { AppError, ValidationError } from '../utils/errors';
import { log } from '../utils/logger';

/**
 * Enhanced tenant resolution middleware with comprehensive security controls
 */
export const enhancedTenantResolution = () => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Resolve tenant using the enhanced service
      const resolution = await TenantResolutionService.resolveTenant(req);
      
      // Set tenant context on request
      req.tenant = resolution.tenant;
      req.tenantId = resolution.tenantId;
      req.isSuperAdmin = resolution.isSuperAdmin;
      req.tenantDomain = resolution.domainInfo.host;
      
      // Set tenant context headers for frontend
      if (resolution.tenant) {
        res.set('X-Tenant-ID', (resolution.tenant._id as any).toString());
        res.set('X-Tenant-Name', resolution.tenant.name);
        res.set('X-Tenant-Domain', resolution.tenant.domain);
        res.set('X-Resolution-Method', resolution.resolutionMethod);
        res.set('X-Cache-Hit', resolution.cacheHit.toString());
        res.set('X-Resolution-Time', resolution.resolutionTime.toString());
      } else if (resolution.isSuperAdmin) {
        res.set('X-Is-Super-Admin', 'true');
        res.set('X-Resolution-Method', 'super_admin');
      } else if (resolution.isApiDomain) {
        res.set('X-Is-API-Domain', 'true');
        res.set('X-Resolution-Method', 'api');
      }

      // Log resolution details for monitoring
      if (resolution.resolutionTime > 1000) { // Log slow resolutions
        log.warn('Slow tenant resolution detected:', {
          host: resolution.domainInfo.host,
          resolutionTime: resolution.resolutionTime,
          method: resolution.resolutionMethod,
          cacheHit: resolution.cacheHit
        });
      }

      next();
    } catch (error) {
      log.error('Enhanced tenant resolution failed:', { 
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
        host: req.get('host')
      });
      
      next(new ValidationError(
        'Failed to resolve tenant',
        'domain',
        req.get('host') || 'unknown'
      ));
    }
  };
};

/**
 * Tenant validation middleware with comprehensive checks
 */
export const enhancedTenantValidation = () => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Super admins bypass tenant validation
      if (req.isSuperAdmin) {
        return next();
      }

      // API domains bypass tenant validation
      if (req.tenantDomain && req.tenantDomain.includes('api.')) {
        return next();
      }

      // Ensure tenant is resolved
      if (!req.tenant || !req.tenantId) {
        return next(new ValidationError(
          'Tenant access required',
          'tenant',
          req.tenantDomain || 'unknown'
        ));
      }

      // Validate tenant status
      if (!req.tenant.isActive()) {
        return next(new ValidationError(
          'Tenant account is suspended',
          'tenant',
          req.tenantDomain || 'unknown'
        ));
      }

      // Check tenant trial expiration
      if (req.tenant.isTrialExpired()) {
        return next(new ValidationError(
          'Tenant trial period has expired',
          'tenant',
          req.tenantDomain || 'unknown'
        ));
      }

      // Validate tenant domain security
      const domainValidation = TenantResolutionService.validateDomainFormat(req.tenantDomain || '');
      if (!domainValidation.isValid) {
        log.warn('Invalid tenant domain format detected:', {
          tenantId: req.tenantId,
          domain: req.tenantDomain,
          errors: domainValidation.errors
        });
      }

      next();
    } catch (error) {
      log.error('Enhanced tenant validation failed:', { 
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
        tenantId: req.tenantId
      });
      
      next(error);
    }
  };
};

/**
 * Domain security middleware
 */
export const domainSecurity = () => {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const host = req.get('host') || '';
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      
      // Check for HTTPS requirement in production
      if (process.env.NODE_ENV === 'production' && protocol !== 'https') {
        log.warn('HTTP request in production environment:', {
          host,
          protocol,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }

      // Check for suspicious domain patterns
      const suspiciousPatterns = [
        /localhost/i,
        /127\.0\.0\.1/i,
        /0\.0\.0\.0/i,
        /\.local$/i,
        /\.test$/i,
        /\.dev$/i
      ];

      if (suspiciousPatterns.some((pattern: any) => pattern.test(host))) {
        log.warn('Suspicious domain pattern detected:', {
          host,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }

      // Check for domain length (potential buffer overflow attempts)
      if (host.length > 253) {
        return next(new ValidationError(
          'Domain too long',
          'domain',
          host
        ));
      }

      next();
    } catch (error) {
      log.error('Domain security middleware error:', { 
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      });
      
      next(error);
    }
  };
};

/**
 * Tenant context middleware
 */
export const tenantContext = () => {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Attach comprehensive tenant context to request
      (req as any).tenantContext = {
        tenant: req.tenant,
        tenantId: req.tenantId,
        isSuperAdmin: req.isSuperAdmin,
        tenantDomain: req.tenantDomain,
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Add tenant context helpers
      (req as any).getTenantId = () => req.tenantId;
      (req as any).isTenantAdmin = () => {
        const user = (req as any).user;
        return user && user.role === 'admin' && user.tenantId === req.tenantId;
      };
      (req as any).canAccessTenant = (targetTenantId: string) => {
        return req.isSuperAdmin || req.tenantId === targetTenantId;
      };

      next();
    } catch (error) {
      log.error('Tenant context middleware error:', { 
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      });
      
      next(error);
    }
  };
};

/**
 * Tenant monitoring middleware
 */
export const tenantMonitoring = () => {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Monitor response for tenant metrics
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Log tenant metrics
      if (req.tenantId) {
        log.info('Tenant request completed:', {
          tenantId: req.tenantId,
          tenantName: req.tenant?.name,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date()
        });
      }

      // Log slow requests
      if (duration > 5000) { // 5 seconds
        log.warn('Slow tenant request detected:', {
          tenantId: req.tenantId,
          endpoint: req.path,
          method: req.method,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
    });

    next();
  };
};

/**
 * Tenant rate limiting middleware
 */
export const tenantRateLimit = () => {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Super admins bypass rate limiting
      if (req.isSuperAdmin) {
        return next();
      }

      // API domains have different rate limiting
      if (req.tenantDomain && req.tenantDomain.includes('api.')) {
        return next();
      }

      // Check tenant-specific rate limits
      if (req.tenantId) {
        // This would integrate with the existing rate limiting service
        // For now, we'll just pass through
        // TODO: Implement tenant-specific rate limiting
      }

      next();
    } catch (error) {
      log.error('Tenant rate limit middleware error:', { 
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
      });
      
      next(error);
    }
  };
};

/**
 * Comprehensive tenant resolution middleware stack
 */
export const comprehensiveTenantResolution = () => {
  return [
    domainSecurity(),
    enhancedTenantResolution(),
    enhancedTenantValidation(),
    tenantContext(),
    tenantMonitoring(),
    tenantRateLimit()
  ];
};

/**
 * Utility functions for tenant resolution
 */
export const TenantResolutionUtils = {
  /**
   * Get tenant context from request
   */
  getTenantContext: (req: TenantRequest) => {
    return (req as any).tenantContext;
  },

  /**
   * Check if request is from super admin
   */
  isSuperAdmin: (req: TenantRequest): boolean => {
    return req.isSuperAdmin === true;
  },

  /**
   * Check if request is from specific tenant
   */
  isFromTenant: (req: TenantRequest, tenantId: string): boolean => {
    return req.tenantId === tenantId || req.isSuperAdmin === true;
  },

  /**
   * Check if request is from API domain
   */
  isApiRequest: (req: TenantRequest): boolean => {
    return req.tenantDomain?.includes('api.') === true;
  },

  /**
   * Get tenant domain info
   */
  getDomainInfo: (req: TenantRequest) => {
    const host = req.get('host') || '';
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    
    return {
      host,
      protocol,
      isHttps: protocol === 'https',
      isCustomDomain: !host.includes('sehwagimmigration.com'),
      isSubdomain: host.split('.').length > 2
    };
  },

  /**
   * Validate tenant access for specific resource
   */
  validateTenantAccess: (req: TenantRequest, resourceTenantId: string): boolean => {
    return req.isSuperAdmin === true || req.tenantId === resourceTenantId;
  },

  /**
   * Get tenant statistics
   */
  getTenantStats: () => {
    return TenantResolutionService.getStats();
  },

  /**
   * Clear tenant resolution cache
   */
  clearCache: () => {
    return TenantResolutionService.clearCache();
  },

  /**
   * Check domain availability
   */
  checkDomainAvailability: (domain: string) => {
    return TenantResolutionService.checkDomainAvailability(domain);
  },

  /**
   * Generate tenant subdomain
   */
  generateTenantSubdomain: (tenantName: string) => {
    return TenantResolutionService.generateTenantSubdomain(tenantName);
  }
};
