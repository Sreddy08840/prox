import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  verifyWebhook,
  handleWebhook,
  sendMessage,
  simulateSandbox,
} from '../controllers/whatsappController';

const router = Router();

// Meta Webhook Verification and Notifications API
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);

// Outbound Message sender API
router.post('/send', protect, sendMessage);

// WhatsApp sandbox simulation route
router.post('/simulate-sandbox', simulateSandbox);

export default router;
