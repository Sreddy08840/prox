import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { protect } from '../middlewares/auth';
import {
  createConversation,
  getConversations,
  getConversation,
  postMessage,
  summarizeConversation,
} from '../controllers/conversationController';

const router = Router();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const leadIdParamsSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('Invalid lead ID format'),
  }),
});

const createConversationSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('Invalid lead ID format'),
  }),
  body: z.object({
    subject: z
      .string({ required_error: 'Subject is required' })
      .min(1, 'Subject cannot be empty'),
  }),
});

const uuidIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid conversation ID format'),
  }),
});

const postMessageSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid conversation ID format'),
  }),
  body: z.object({
    content: z
      .string({ required_error: 'Content is required' })
      .min(1, 'Content cannot be empty'),
    senderType: z.enum(['USER', 'LEAD', 'AI'], {
      required_error: 'Sender type is required',
    }),
    attachments: z
      .array(
        z.object({
          name: z.string(),
          size: z.number().optional(),
          url: z.string().url('Invalid URL format'),
        }),
      )
      .optional()
      .nullable(),
  }),
});

// ==========================================
// ROUTES DEFINITIONS
// ==========================================

// Mapped under /leads/:leadId/conversations
router.post('/leads/:leadId/conversations', protect, validate(createConversationSchema), createConversation);
router.get('/leads/:leadId/conversations', protect, validate(leadIdParamsSchema), getConversations);

// Mapped under /conversations/:id
router.get('/conversations/:id', protect, validate(uuidIdParamsSchema), getConversation);
router.post('/conversations/:id/messages', protect, validate(postMessageSchema), postMessage);
router.post('/conversations/:id/summarize', protect, validate(uuidIdParamsSchema), summarizeConversation);

export default router;
