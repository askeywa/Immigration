// backend/src/middleware/enhancedTenantResolution.ts
import { Request, Response, NextFunction } from 'express';
import { Tenant, ITenant } from '../models/Tenant';
import { ValidationError } from '../utils/errors';
import { config } from '../config/config';
import { log } from '../utils/logger';

export interface TenantRequest extends Request {
  tenant?: ITenant;
  tenantId?: string;
  isSuperAdmin?: boolean;
  tenantDomain?: string | null;
  sessionData?: any;
  user?: any;
  tenantValidation?: any;
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  rateLimit?: any;
}

// In-memory cache for tenant lookups (with TTL)
const tenantCache = new Map<string, { tenant: ITenant; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Enhanced domain-based tenant resolution middleware with multi-domain support
 */
export const resolveTenantEnhanced = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    // Extract domain from multiple possible sources
    const xTenantDomain = req.get('x-tenant-domain');
    const xOriginalHost = req.get('x-original-host');
    const host = req.get('host') || req.get('x-forwarded-host') || '';
    
    // Priority order: x-tenant-domain > x-original-host > host
    const rawDomain = (xTenantDomain || xOriginalHost || host).split(':')[0].toLowerCase();
    
    log.info('Enhanced Tenant Resolution Started', {
      rawDomain,
      xTenantDomain,
      xOriginalHost,
      host,
      path: req.path,
      method: req.method,
    });

    // Step 1: Check if this is a super admin domain
    const isSuperAdminDomain = config.allowedSuperAdminDomains.some(allowedDomain => {
      if (allowedDomain === 'localhost') {
        return rawDomain === 'localhost' || rawDomain.startsWith('localhost');
      }
      return rawDomain === allowedDomain;
    });

    if (isSuperAdminDomain) {
      log.info('Super Admin Domain Detected', { domain: rawDomain });
      req.tenant = undefined;
      req.tenantId = undefined;
      req.isSuperAdmin = true;
      req.tenantDomain = null;
      return next();
    }

    // Step 2: Check cache first
    const cacheKey = `tenant:${rawDomain}`;
    const cached = tenantCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      log.info('Tenant Cache Hit', { domain: rawDomain, tenantId: cached.tenant._id });
      req.tenant = cached.tenant;
      req.tenantId = cached.tenant._id.toString();
      req.isSuperAdmin = false;
      req.tenantDomain = rawDomain;
      
      res.set('X-Tenant-ID', cached.tenant._id.toString());
      res.set('X-Tenant-Name', cached.tenant.name);
      res.set('X-Tenant-Domain', rawDomain);
      return next();
    }

    // Step 3: Query database for tenant with this domain
    // Check BOTH primary domain AND customDomains array
    const tenant = await Tenant.findOne({
      $or: [
        { domain: rawDomain },
        { customDomains: rawDomain }
      ],
      status: { $in: ['active', 'trial'] }
    }).lean();

    if (!tenant) {
      log.warn('Tenant Not Found', { domain: rawDomain });
      return next(new ValidationError(
        'No tenant found for this domain. Please verify the domain is correctly configured.',
        'domain',
        rawDomain
      ));
    }

    // Step 4: Verify tenant has active status
    if (tenant.status !== 'active' && tenant.status !== 'trial') {
      log.warn('Tenant Inactive', { 
        domain: rawDomain, 
        tenantId: tenant._id, 
        status: tenant.status 
      });
      return next(new ValidationError(
        'Tenant account is suspended or inactive',
        'domain',
        rawDomain
      ));
    }

    // Step 5: Cache the result
    tenantCache.set(cacheKey, {
      tenant: tenant as unknown as ITenant,
      timestamp: Date.now()
    });

    // Clean cache if it gets too large (prevent memory leaks)
    if (tenantCache.size > 100) {
      const entries = Array.from(tenantCache.entries());
      const oldestEntry = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      tenantCache.delete(oldestEntry[0]);
    }

    log.info('Tenant Resolved Successfully', {
      domain: rawDomain,
      tenantId: tenant._id,
      tenantName: tenant.name,
      matchedOn: tenant.domain === rawDomain ? 'primary' : 'custom'
    });

    // Step 6: Set tenant context
    req.tenant = tenant as unknown as ITenant;
    req.tenantId = tenant._id.toString();
    req.isSuperAdmin = false;
    req.tenantDomain = rawDomain;

    // Set response headers for debugging
    res.set('X-Tenant-ID', tenant._id.toString());
    res.set('X-Tenant-Name', tenant.name);
    res.set('X-Tenant-Domain', rawDomain);
    res.set('X-Domain-Match-Type', tenant.domain === rawDomain ? 'primary' : 'custom');

    next();
  } catch (error) {
    log.error('Tenant Resolution Error', {
      error: error instanceof Error ? error.message : String(error),
      domain: req.get('host'),
    });
    return next(new ValidationError(
      'Failed to resolve tenant',
      'domain',
      req.get('host') || 'unknown'
    ));
  }
};

/**
 * Utility to clear tenant cache (useful for admin operations)
 */
export const clearTenantCache = (domain?: string): void => {
  if (domain) {
    const cacheKey = `tenant:${domain.toLowerCase()}`;
    tenantCache.delete(cacheKey);
    log.info('Tenant Cache Cleared', { domain });
  } else {
    tenantCache.clear();
    log.info('All Tenant Cache Cleared');
  }
};

export default resolveTenantEnhanced;