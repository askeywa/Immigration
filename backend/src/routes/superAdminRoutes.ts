// backend/src/routes/superAdminRoutes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getAllUsers, deleteUser } from '../controllers/userController';
import { getSystemReports, exportSystemReport, getSystemAnalytics } from '../controllers/reportController';
import { TenantController } from '../controllers/tenantController';
import { superAdminCacheMiddleware } from '../middleware/cacheMiddleware';
import { PerformanceController } from '../controllers/performanceController';

const router = Router();

// All routes require super admin authentication
router.use(authenticate);
router.use(authorize('super_admin'));

// Cache middleware for GET requests (5 minute cache)
const cacheFor5Min = superAdminCacheMiddleware(5 * 60 * 1000);

// Super Admin Tenant Management Routes (with caching)
router.get('/tenants', cacheFor5Min, asyncHandler(TenantController.getAllTenants));
router.get('/tenants/:id', cacheFor5Min, asyncHandler(TenantController.getTenantById));
router.get('/tenants/:id/users', cacheFor5Min, asyncHandler(TenantController.getTenantUsers));
router.put('/tenants/:id', asyncHandler(TenantController.updateTenant));
router.delete('/tenants/:id', asyncHandler(TenantController.deleteTenant));

// Super Admin User Management Routes (with caching)
router.get('/users', cacheFor5Min, getAllUsers);
router.delete('/users/:id', deleteUser);

// Super Admin Reports Routes (with caching)
router.get('/reports', cacheFor5Min, getSystemReports);
router.get('/reports/export', exportSystemReport);

// Super Admin Analytics Routes (with caching)
router.get('/analytics', cacheFor5Min, getSystemAnalytics);
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

// Performance monitoring routes
router.get('/performance/metrics', asyncHandler(PerformanceController.getPerformanceMetrics));
router.get('/performance/cache', asyncHandler(PerformanceController.getCacheAnalytics));
router.get('/performance/history', asyncHandler(PerformanceController.getApiPerformanceHistory));
router.post('/performance/clear-cache', asyncHandler(PerformanceController.clearAllCaches));

export default router;
