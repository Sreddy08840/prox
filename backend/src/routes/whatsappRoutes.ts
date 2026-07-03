import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  verifyWebhook,
  handleWebhook,
  sendMessage,
} from '../controllers/whatsappController';

const router = Router();

// Meta Webhook Verification and Notifications API
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);

// Outbound Message sender API
router.post('/send', protect, sendMessage);

export default router;
