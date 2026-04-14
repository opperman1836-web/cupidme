import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import {
  getUsers, toggleUserActive, getReports, resolveReport,
  getPendingVenues, approveVenue, approveVerification,
  getPaymentsOverview,
} from '../controllers/admin.controller';

export const adminRoutes = Router();

adminRoutes.use(requireAuth);
adminRoutes.use(requireRole('admin'));

adminRoutes.get('/users', getUsers);
adminRoutes.patch('/users/:userId/active', toggleUserActive);
adminRoutes.get('/reports', getReports);
adminRoutes.patch('/reports/:reportId', resolveReport);
adminRoutes.get('/venues/pending', getPendingVenues);
adminRoutes.patch('/venues/:venueId/approve', approveVenue);
adminRoutes.patch('/verifications/:verificationId', approveVerification);
adminRoutes.get('/payments', getPaymentsOverview);
