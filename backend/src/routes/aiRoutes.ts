import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { protect } from '../middlewares/auth';
import { analyzeLead, getLeadInsight } from '../controllers/aiController';

const router = Router();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const leadIdParamsSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('Invalid lead ID format'),
  }),
});

// ==========================================
// ROUTES DEFINITIONS
// ==========================================

router.post('/:leadId/analyze', protect, validate(leadIdParamsSchema), analyzeLead);
router.get('/:leadId/insight', protect, validate(leadIdParamsSchema), getLeadInsight);

export default router;
