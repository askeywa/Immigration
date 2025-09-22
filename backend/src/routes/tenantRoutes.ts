// backend/src/routes/tenantRoutes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorization';
import { resolveTenant } from '../middleware/tenantResolution';
import { rowLevelSecurity } from '../middleware/rowLevelSecurity';
import { asyncHandler } from '../middleware/errorHandler';
import { TenantController } from '../controllers/tenantController';

const router = Router();

// Apply tenant resolution and authentication to all routes
router.use(resolveTenant, rowLevelSecurity, authenticate);

// Tenant resolution endpoints (public for domain resolution)
router.get('/resolve/subdomain/:subdomain', asyncHandler(TenantController.resolveBySubdomain));
router.get('/resolve/domain/:domain', asyncHandler(TenantController.resolveByDomain));

// Get user's accessible tenants
router.get('/user-tenants', asyncHandler(TenantController.getUserTenants));

// Get current tenant info
router.get('/current', asyncHandler(TenantController.getCurrentTenant));

// Super admin routes
router.get('/', authorize(['super_admin']), asyncHandler(TenantController.getAllTenants));
router.get('/:id', authorize(['super_admin', 'admin']), asyncHandler(TenantController.getTenantById));
router.post('/', authorize(['super_admin']), asyncHandler(TenantController.createTenant));
router.put('/:id', authorize(['super_admin', 'admin']), asyncHandler(TenantController.updateTenant));
router.delete('/:id', authorize(['super_admin']), asyncHandler(TenantController.deleteTenant));

// Tenant admin routes
router.get('/:id/settings', authorize(['super_admin', 'admin']), asyncHandler(TenantController.getTenantSettings));
router.put('/:id/settings', authorize(['super_admin', 'admin']), asyncHandler(TenantController.updateTenantSettings));
router.get('/:id/users', authorize(['super_admin', 'admin']), asyncHandler(TenantController.getTenantUsers));
router.get('/:id/analytics', authorize(['super_admin', 'admin']), asyncHandler(TenantController.getTenantAnalytics));

export default router;