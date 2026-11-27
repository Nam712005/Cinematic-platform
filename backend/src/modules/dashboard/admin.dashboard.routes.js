import { Router } from 'express';
import * as controller from './dashboard.controller.js';

const router = Router();

// UI15 Dashboard & Activity Logs
router.get('/dashboard', controller.getDashboard);
router.get('/activity-logs', controller.getActivityLogs);

// UI24 Reports & Analytics
router.get('/reports', controller.getReports);

// Admin Topbar Notifications
router.get('/notifications', controller.listNotifications);
router.patch('/notifications/read-all', controller.markAllRead);
router.patch('/notifications/:id/read', controller.markRead);

export default router;
