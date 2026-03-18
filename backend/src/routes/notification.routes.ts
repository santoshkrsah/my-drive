import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationController.list);
router.get('/unread-count', NotificationController.unreadCount);
router.put('/read-all', NotificationController.markAllAsRead);
router.put('/:id/read', NotificationController.markAsRead);
router.delete('/delete-all', NotificationController.deleteAll);
router.delete('/:id', NotificationController.deleteOne);

export default router;
