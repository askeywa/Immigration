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
router.get('/tenants/:id', asyncHandler(TenantController.getTenantById));
router.get('/tenants/:id/users', asyncHandler(TenantController.getTenantUsers));
router.put('/tenants/:id', asyncHandler(TenantController.updateTenant));
router.delete('/tenants/:id', asyncHandler(TenantController.deleteTenant));

// Super Admin User Management Routes
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Super Admin Reports Routes
router.get('/reports', getSystemReports);
router.get('/reports/export', exportSystemReport);

// Super Admin Analytics Routes
router.get('/analytics', getSystemAnalytics);
router.get('/analytics/tenant/:tenantId', asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  res.json({
    success: true,
    data: {
      tenantId,
      metrics: {
        totalUsers: 0,
        activeUsers: 0,
        storageUsed: '0 MB',
        apiCalls: 0,
        bandwidthUsed: '0 GB'
      }
    }
  });
}));

// Super Admin Health Routes
router.get('/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    }
  });
}));

export default router;
