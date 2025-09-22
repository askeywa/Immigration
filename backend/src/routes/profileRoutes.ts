// backend/src/routes/profileRoutes.ts
import { Router } from 'express';
import { 
  getProfile, 
  getProfileProgress, 
  updateProfile, 
  getAllProfiles, 
  getProfileById 
} from '../controllers/profileController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorization';
import { resolveTenant } from '../middleware/tenantResolution';
import { rowLevelSecurity } from '../middleware/rowLevelSecurity';
import { rateLimitMiddleware, burstProtectionLimit } from '../middleware/rateLimiting';

const router = Router();

// All routes require authentication and tenant context
router.use(resolveTenant, rowLevelSecurity, authenticate);

// User profile routes with burst protection and rate limiting
router.get('/', burstProtectionLimit, rateLimitMiddleware, getProfile);
router.get('/progress', burstProtectionLimit, rateLimitMiddleware, getProfileProgress);
router.put('/', burstProtectionLimit, rateLimitMiddleware, updateProfile);

// Admin routes for managing all profiles
router.get('/all', authorize(['admin', 'super_admin']), getAllProfiles);
router.get('/:profileId', authorize(['admin', 'super_admin']), getProfileById);

export default router;