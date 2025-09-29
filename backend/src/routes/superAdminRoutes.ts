// backend/src/routes/superAdminRoutes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getAllUsers, deleteUser } from '../controllers/userController';
import { getSystemReports, exportSystemReport, getSystemAnalytics } from '../controllers/reportController';
import { TenantController } from '../controllers/tenantController';

const router = Router();

// All routes require super admin authentication
router.use(authenticate);
router.use(authorize('super_admin'));

// Super Admin Tenant Management Routes
router.get('/tenants', asyncHandler(TenantController.getAllTenants));

// Super Admin User Management Routes
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Super Admin Reports Routes
router.get('/reports', getSystemReports);
router.get('/reports/export', exportSystemReport);

// Super Admin Analytics Routes
router.get('/analytics', getSystemAnalytics);

export default router;
