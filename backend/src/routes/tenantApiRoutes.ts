import { Router } from 'express';
import { TenantApiController } from '../controllers/tenantApiController';
import { resolveTenant } from '../middleware/tenantResolution';
import { authRateLimit } from '../middleware/rateLimiting';
import { validateLoginMiddleware, validateRegister, validateLoginDebug } from '../middleware/validation';

const router = Router();

/**
 * Tenant-specific API routes
 * These routes are designed to be used by tenant websites
 * and can be shared with tenant development teams
 */

// Tenant authentication routes
router.post('/tenant/auth/login', 
  authRateLimit,
  resolveTenant,
  ...validateLoginMiddleware,  // Use the new combined middleware
  TenantApiController.tenantLogin
);

router.post('/tenant/auth/register',
  authRateLimit,
  resolveTenant,
  ...validateRegister,
  TenantApiController.tenantRegister
);

// Tenant information routes
router.get('/tenant/info',
  resolveTenant,
  TenantApiController.getTenantInfo
);

// Widget configuration for tenant integration
router.get('/tenant/widget/config',
  resolveTenant,
  TenantApiController.getWidgetConfig
);

export default router;
