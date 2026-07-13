import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/mark-all-read', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
