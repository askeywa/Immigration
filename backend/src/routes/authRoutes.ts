
// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { 
  login, 
  register, 
  getUserPermissions, 
  getUserTenants, 
  switchTenant, 
  refreshToken 
} from '../controllers/authController';
import { validateLogin, validateRegister, validateLoginMiddleware, validateLoginDebug } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { resolveTenantEnhanced as resolveTenant } from '../middleware/enhancedTenantResolution';
import { rowLevelSecurity } from '../middleware/rowLevelSecurity';
import { authRateLimit, globalRateLimit } from '../middleware/rateLimiting';

const router = Router();

// Public routes with tenant resolution and rate limiting
router.post('/login', authRateLimit, resolveTenant, rowLevelSecurity, ...validateLoginDebug, login);
router.post('/register', authRateLimit, resolveTenant, rowLevelSecurity, ...validateRegister, register);

// Protected routes with authentication and rate limiting
router.get('/permissions', globalRateLimit, resolveTenant, rowLevelSecurity, authenticate, getUserPermissions);
router.get('/tenants', globalRateLimit, resolveTenant, rowLevelSecurity, authenticate, getUserTenants);
router.post('/switch-tenant', globalRateLimit, resolveTenant, rowLevelSecurity, authenticate, switchTenant);
router.post('/refresh', globalRateLimit, resolveTenant, rowLevelSecurity, authenticate, refreshToken);

export default router;
