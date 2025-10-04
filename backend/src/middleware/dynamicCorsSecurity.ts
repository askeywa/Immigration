// backend/src/middleware/dynamicCorsSecurity.ts
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Tenant } from '../models/Tenant';
import { log } from '../utils/logger';

// Cache for trusted domains (refresh every 5 minutes)
let trustedDomainsCache: string[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all trusted domains from database
 */
async function fetchTrustedDomains(): Promise<string[]> {
  try {
    // Check cache first
    if (Date.now() - cacheTimestamp < CACHE_TTL && trustedDomainsCache.length > 0) {
      return trustedDomainsCache;
    }

    // Base trusted domains (super admin)
    const baseDomains = [
      'http://localhost:3000',
      'http://localhost:5174',
      'http://localhost:5173',
      'https://ibuyscrap.ca',
      'https://www.ibuyscrap.ca',
    ];

    // Fetch all active tenants
    const tenants = await Tenant.find({
      status: { $in: ['active', 'trial'] }
    }).select('domain customDomains').lean();

    // Build list of all trusted domains
    const tenantDomains = tenants.flatMap(tenant => {
      const domains = [tenant.domain];
      if (tenant.customDomains && Array.isArray(tenant.customDomains)) {
        domains.push(...tenant.customDomains);
      }
      return domains;
    });

    // Add protocol prefixes for CORS
    const allDomains = [
      ...baseDomains,
      ...tenantDomains.map(d => `https://${d}`),
      ...tenantDomains.map(d => `http://${d}`), // For development
    ];

    // Update cache
    trustedDomainsCache = [...new Set(allDomains)]; // Remove duplicates
    cacheTimestamp = Date.now();

    log.info('Trusted Domains Cache Updated', {
      count: trustedDomainsCache.length,
      baseDomains: baseDomains.length,
      tenantDomains: tenantDomains.length,
    });

    return trustedDomainsCache;
  } catch (error) {
    log.error('Failed to fetch trusted domains', {
      error: error instanceof Error ? error.message : String(error),
    });
    return trustedDomainsCache; // Return cached version on error
  }
}

/**
 * Dynamic CORS middleware that checks database for trusted domains
 */
export const dynamicCorsSecurity = () => {
  return cors({
    origin: async (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      try {
        // Get trusted domains from cache/database
        const trustedDomains = await fetchTrustedDomains();

        // Check if origin is trusted
        if (trustedDomains.includes(origin)) {
          log.debug('CORS: Origin Allowed', { origin });
          return callback(null, true);
        }

        // Check for localhost variations in development
        if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
          log.debug('CORS: Development Localhost Allowed', { origin });
          return callback(null, true);
        }

        // Origin not trusted
        log.warn('CORS: Origin Rejected', { origin });
        return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      } catch (error) {
        log.error('CORS: Error checking origin', {
          origin,
          error: error instanceof Error ? error.message : String(error),
        });
        return callback(new Error('CORS configuration error'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'X-Tenant-ID',
      'X-Tenant-Name',
      'X-Tenant-Domain',
      'X-Original-Host',
      'X-Is-Super-Admin',
    ],
    exposedHeaders: [
      'X-Tenant-ID',
      'X-Tenant-Name',
      'X-Tenant-Domain',
      'X-Is-Super-Admin',
      'X-Session-ID',
      'X-User-ID',
      'X-Last-Activity',
      'X-Domain-Match-Type',
    ],
    maxAge: 86400, // 24 hours
  });
};

/**
 * Manually refresh trusted domains cache
 */
export const refreshTrustedDomainsCache = async (): Promise<void> => {
  cacheTimestamp = 0; // Force cache refresh
  await fetchTrustedDomains();
  log.info('Trusted Domains Cache Manually Refreshed');
};

/**
 * Get current cached trusted domains (for debugging)
 */
export const getTrustedDomains = (): string[] => {
  return [...trustedDomainsCache];
};

