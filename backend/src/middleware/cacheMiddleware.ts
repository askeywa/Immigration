// backend/src/middleware/cacheMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { localCache } from '../services/localCacheService';
import { log } from '../utils/logger';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
}

/**
 * Cache middleware for API responses
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    console.log('🔍 Cache middleware called for:', req.url);
    
    // Skip cache if specified
    if (skipCache(req)) {
      console.log('🚫 Cache skipped for:', req.url);
      return next();
    }

    const cacheKey = keyGenerator(req);
    console.log('🔑 Generated cache key:', cacheKey);
    
    // Check cache first
    const cachedResponse = localCache.get(cacheKey);
    if (cachedResponse) {
      console.log('✅ CACHE HIT:', req.url, 'Key:', cacheKey.substring(0, 50) + '...');
      log.debug('Cache hit', { 
        method: req.method, 
        url: req.url, 
        cacheKey 
      });
      
      return res.json(cachedResponse);
    }
    
    console.log('❌ CACHE MISS:', req.url, 'Key:', cacheKey.substring(0, 50) + '...');

    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = function(body: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        localCache.set(cacheKey, body, ttl);
        console.log('💾 CACHE SET:', req.url, 'TTL:', ttl + 'ms');
        log.debug('Cache set', { 
          method: req.method, 
          url: req.url, 
          cacheKey,
          ttl 
        });
      } else {
        console.log('⚠️ NOT CACHING:', req.url, 'Status:', res.statusCode);
      }
      
      return originalJson(body);
    };

    next();
  };
}

/**
 * Default cache key generator
 */
function defaultKeyGenerator(req: Request): string {
  const { method, url, query, body } = req;
  const user = (req as any).user;
  const tenant = (req as any).tenant;
  
  // Include user and tenant context in cache key
  const context = {
    userId: user?._id,
    tenantId: tenant?._id,
    method,
    url,
    query,
    body: method === 'POST' || method === 'PUT' ? body : undefined
  };
  
  return `cache:${Buffer.from(JSON.stringify(context)).toString('base64')}`;
}

/**
 * Cache middleware for tenant-specific routes
 */
export function tenantCacheMiddleware(ttl: number = 5 * 60 * 1000) {
  return cacheMiddleware({
    ttl,
    keyGenerator: (req: Request) => {
      const tenant = (req as any).tenant;
      const user = (req as any).user;
      const { method, url, query } = req;
      
      console.log('🔑 Cache key generation:');
      console.log('  - tenant._id:', tenant?._id);
      console.log('  - user._id:', user?._id);
      console.log('  - method:', method);
      console.log('  - url:', url);
      console.log('  - query:', query);
      
      const cacheKey = `tenant:${tenant?._id}:user:${user?._id}:${method}:${url}:${JSON.stringify(query)}`;
      console.log('  - Generated key:', cacheKey);
      
      return cacheKey;
    }
  });
}

/**
 * Cache middleware for user-specific routes
 */
export function userCacheMiddleware(ttl: number = 3 * 60 * 1000) {
  return cacheMiddleware({
    ttl,
    keyGenerator: (req: Request) => {
      const user = (req as any).user;
      const { method, url, query } = req;
      
      return `user:${user?._id}:${method}:${url}:${JSON.stringify(query)}`;
    }
  });
}

/**
 * Clear cache for specific patterns
 */
export function clearCachePattern(pattern: string): void {
  const stats = localCache.getStats();
  let clearedCount = 0;
  
  stats.keys.forEach(key => {
    if (key.includes(pattern)) {
      localCache.delete(key);
      clearedCount++;
    }
  });
  
  log.info('Cache cleared for pattern', { pattern, clearedCount });
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  localCache.clear();
  log.info('All cache cleared');
}
