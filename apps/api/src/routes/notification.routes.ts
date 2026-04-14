const Router = require('express').Router;
import { requireAuth } from '../middleware/auth.middleware';
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller';

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);

notificationRoutes.get('/', getNotifications);
notificationRoutes.post('/:id/read', markRead);
notificationRoutes.post('/read-all', markAllRead);
