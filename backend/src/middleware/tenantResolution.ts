// backend/src/middleware/tenantResolution.ts
import { Request, Response, NextFunction } from 'express';
import { Tenant, ITenant } from '../models/Tenant';
import { ValidationError } from '../utils/errors';
import { config } from '../config/config';

export interface TenantRequest extends Request {
  tenant?: ITenant;
  tenantId?: string;
  isSuperAdmin?: boolean;
  tenantDomain?: string | null;
  sessionData?: any;
  user?: any; // Add user property for authentication
  tenantValidation?: any; // Add tenant validation result
  requestId?: string; // Add requestId for performance monitoring
  correlationId?: string; // Add correlationId for tracing
  traceId?: string; // Add traceId for distributed tracing
  rateLimit?: any; // Add rateLimit for rate limiting context
}

/**
 * Domain-based tenant resolution middleware
 * 
 * This middleware extracts tenant information from the request domain/subdomain
 * and adds it to the request object for use throughout the application.
 * 
 * Domain patterns supported:
 * - Super Admin: ibuyscrap.ca, www.ibuyscrap.ca, localhost
 * - Tenant: Any domain registered in the database
 * - API: api.sehwagimmigration.com
 * 
 * @param req Express request object
 * @param res Express response object  
 * @param next Express next function
 */
export const resolveTenant = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const host = (req as any).get('host') || (req as any).get('x-forwarded-host') || '';
    const protocol = (req as any).get('x-forwarded-proto') || (req as any).protocol || 'http';
    
    // Remove port if present
    const domain = host.split(':')[0].toLowerCase();
    
    // Debug logging for domain resolution
    console.log('🔍 Tenant Resolution Debug:', {
      host,
      domain,
      allowedSuperAdminDomains: config.allowedSuperAdminDomains,
      protocol
    });
    
    // Check for super admin domain (including localhost for development)
    // Use dynamic domain list from environment variables
    const isSuperAdminDomain = config.allowedSuperAdminDomains.some(allowedDomain => {
      if (allowedDomain === 'localhost') {
        return domain === 'localhost' || domain.startsWith('localhost:');
      }
      return domain === allowedDomain;
    });
    
    console.log('🔍 Super Admin Domain Check:', {
      domain,
      isSuperAdminDomain,
      allowedDomains: config.allowedSuperAdminDomains
    });
    
    if (isSuperAdminDomain) {
      console.log('✅ Super Admin Domain Detected:', domain);
      (req as any).tenant = undefined;
      (req as any).tenantId = undefined;
      (req as any).isSuperAdmin = true;
      return next();
    }
    
    // Check if domain belongs to any registered tenant
    const tenant = await resolveTenantByDomain(domain);
    
    if (tenant) {
      // This is a registered tenant domain
      // Check if tenant is active
      if (!tenant.isActive()) {
        return next(new ValidationError(
          'Tenant account is suspended',
          'domain',
          domain
        ));
      }
      
      // Add tenant information to request
      (req as any).tenant = tenant;
      (req as any).tenantId = (tenant._id as any).toString();
      (req as any).isSuperAdmin = false;
      
      // Add tenant context to response headers for debugging
      (res as any).set('X-Tenant-ID', (tenant._id as any).toString());
      (res as any).set('X-Tenant-Name', tenant.name);
      
      return next();
    }
    
    // Check for API domain
    if (domain === 'api.sehwagimmigration.com' || domain === config.apiDomain) {
      return next();
    }
    
    // No valid domain pattern found
    console.log('❌ No valid domain pattern found:', {
      domain,
      host,
      allowedSuperAdminDomains: config.allowedSuperAdminDomains
    });
    return next(new ValidationError(
      'Invalid domain format',
      'domain',
      host
    ));
    
  } catch (error) {
    console.error('Tenant resolution error:', error);
    return next(new ValidationError(
      'Failed to resolve tenant',
      'domain',
      (req as any).get('host') || 'unknown'
    ));
  }
};

/**
 * Parse domain to extract tenant information
 * 
 * @param host The host header from the request
 * @returns Object containing domain parsing results
 */
function parseDomain(host: string): {
  tenantDomain: string | null;
  isSuperAdmin: boolean;
  isApiDomain: boolean;
} {
  if (!host) {
    return {
      tenantDomain: null,
      isSuperAdmin: false,
      isApiDomain: false
    };
  }
  
  // Remove port if present
  const domain = host.split(':')[0].toLowerCase();
  
  // Check for super admin domain (including localhost for development)
  // Use dynamic domain list from environment variables
  const isSuperAdminDomain = config.allowedSuperAdminDomains.some(allowedDomain => {
    if (allowedDomain === 'localhost') {
      return domain === 'localhost' || domain.startsWith('localhost:');
    }
    return domain === allowedDomain;
  });
  
  if (isSuperAdminDomain) {
    return {
      tenantDomain: null,
      isSuperAdmin: true,
      isApiDomain: false
    };
  }
  
  // Check for API domain
  if (domain === 'api.sehwagimmigration.com' || domain === config.apiDomain) {
    return {
      tenantDomain: null,
      isSuperAdmin: false,
      isApiDomain: true
    };
  }
  
  return {
    tenantDomain: null,
    isSuperAdmin: false,
    isApiDomain: false
  };
}

/**
 * Validate tenant name format
 * 
 * @param tenantName The tenant name to validate
 * @returns True if valid, false otherwise
 */
function isValidTenantName(tenantName: string): boolean {
  // Tenant name should be 3-50 characters, alphanumeric and hyphens only
  const tenantNamePattern = /^[a-z0-9-]{3,50}$/;
  return tenantNamePattern.test(tenantName);
}

/**
 * Resolve tenant by domain
 * 
 * @param domain The domain to resolve
 * @returns Tenant object or null if not found
 */
async function resolveTenantByDomain(domain: string): Promise<ITenant | null> {
  try {
    // Find tenant by exact domain match
    const tenant = await Tenant.findOne({ 
      domain: domain,
      status: { $in: ['active', 'trial'] }
    }).lean();
    
    if (tenant) {
      return tenant as ITenant;
    }
    
    // If not found by exact domain, try to find by subdomain pattern
    // This handles cases where the tenant domain is stored as just the tenant name
    const tenantPrefix = config.tenantDomainPrefix || 'portal';
    const subdomainPattern = new RegExp(`^${tenantPrefix}\\.(.+)\\.sehwagimmigration\\.com$`);
    const match = domain.match(subdomainPattern);
    
    if (match) {
      const tenantName = match[1];
      
      // Try to find tenant by name (for backwards compatibility)
      const subdomainTenant = await Tenant.findOne({
        $or: [
          { domain: tenantName },
          { name: { $regex: new RegExp(tenantName, 'i') } }
        ],
        status: { $in: ['active', 'trial'] }
      }).lean();
      
      if (subdomainTenant) {
        return subdomainTenant as ITenant;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error resolving tenant by domain:', error);
    return null;
  }
}

/**
 * Middleware to validate tenant access for specific routes
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const validateTenantAccess = (req: TenantRequest, res: Response, next: NextFunction) => {
  // Super admins have access to everything
  if ((req as any).isSuperAdmin) {
    return next();
  }
  
  // API routes don't need tenant validation
  if ((req as any).tenantDomain && (req as any).tenantDomain.includes('api.')) {
    return next();
  }
  
  // Ensure tenant is resolved
  if (!(req as any).tenant || !(req as any).tenantId) {
    return next(new ValidationError(
      'Tenant access required',
      'tenant',
      (req as any).tenantDomain || 'unknown'
    ));
  }
  
  next();
};

/**
 * Middleware to ensure super admin access
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const requireSuperAdmin = (req: TenantRequest, res: Response, next: NextFunction) => {
  if (!(req as any).isSuperAdmin) {
    return next(new ValidationError(
      'Super admin access required',
      'role',
      (req as any).user?.role || 'unknown'
    ));
  }
  
  next();
};

/**
 * Utility function to get tenant context from request
 * 
 * @param req Express request object
 * @returns Tenant context object
 */
export const getTenantContext = (req: TenantRequest) => {
  return {
    tenant: (req as any).tenant,
    tenantId: (req as any).tenantId,
    isSuperAdmin: (req as any).isSuperAdmin,
    tenantDomain: (req as any).tenantDomain
  };
};

/**
 * Utility function to check if request is from a specific tenant
 * 
 * @param req Express request object
 * @param tenantId The tenant ID to check against
 * @returns True if request is from the specified tenant
 */
export const isFromTenant = (req: TenantRequest, tenantId: string): boolean => {
  return (req as any).tenantId === tenantId || ((req as any).isSuperAdmin === true);
};

export default {
  resolveTenant,
  validateTenantAccess,
  requireSuperAdmin,
  getTenantContext,
  isFromTenant
};