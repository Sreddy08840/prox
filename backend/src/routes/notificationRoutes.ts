import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  triggerDailySummary,
} from '../controllers/notificationController';

const router = Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markRead);
router.post('/daily-summary', protect, triggerDailySummary);

export default router;
