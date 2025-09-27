// backend/src/routes/superAdminRoutes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getAllUsers, deleteUser } from '../controllers/userController';
import { getSystemReports, exportSystemReport, getSystemAnalytics } from '../controllers/reportController';

const router = Router();

// All routes require super admin authentication
router.use(authenticate);
router.use(authorize('super_admin'));

// Super Admin Tenant Management Routes (using existing tenant routes)
router.get('/tenants', asyncHandler(async (req, res) => {
  // For now, return a simple response - can be enhanced later
  res.json({
    success: true,
    data: { tenants: [] },
    message: 'Tenant management endpoint - to be implemented'
  });
}));

// Super Admin User Management Routes
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Super Admin Reports Routes
router.get('/reports', getSystemReports);
router.get('/reports/export', exportSystemReport);

// Super Admin Analytics Routes
router.get('/analytics', getSystemAnalytics);

export default router;
