import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { protect } from '../middlewares/auth';
import { analyzeLead, getLeadInsight, updateLeadInsight, generateCopilotDraft } from '../controllers/aiController';

const router = Router();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const leadIdParamsSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('Invalid lead ID format'),
  }),
});

const updateLeadInsightSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('Invalid lead ID format'),
  }),
  body: z.object({
    leadScore: z.enum(['HOT', 'WARM', 'COLD']).optional(),
    reasoning: z.string().optional(),
    budget: z.number().min(0).optional().nullable(),
    preferredUnit: z.string().optional().nullable(),
    timeline: z.string().optional().nullable(),
    financingStatus: z.string().optional().nullable(),
  }),
});

// ==========================================
// ROUTES DEFINITIONS
// ==========================================

router.post('/:leadId/analyze', protect, validate(leadIdParamsSchema), analyzeLead);
router.get('/:leadId/insight', protect, validate(leadIdParamsSchema), getLeadInsight);
router.put('/:leadId/insight', protect, validate(updateLeadInsightSchema), updateLeadInsight);
router.post('/:leadId/copilot-draft', protect, validate(leadIdParamsSchema), generateCopilotDraft);

export default router;
