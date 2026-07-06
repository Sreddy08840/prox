import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { protect, restrictTo } from '../middlewares/auth';
import {
  createLead,
  getLeads,
  getLead,
  updateLead,
  deleteLead,
  logActivity,
  importCSV,
  createPublicLead,
} from '../controllers/leadController';

const router = Router();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const createLeadSchema = z.object({
  body: z.object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .min(1, 'First name cannot be empty'),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .min(1, 'Last name cannot be empty'),
    email: z
      .string()
      .email('Invalid email address format')
      .optional()
      .nullable()
      .or(z.literal('')),
    phone: z.string().optional().nullable(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST']).optional(),
    source: z.string().optional().nullable(),
    budget: z.number().min(0).optional().nullable(),
    timeline: z.string().optional().nullable(),
    financingStatus: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    assignedUserId: z.string().uuid('Invalid agent user ID format').optional().nullable(),
    preferredUnitId: z.string().uuid('Invalid unit ID format').optional().nullable(),
  }),
});

const updateLeadSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid lead ID format'),
  }),
  body: z.object({
    firstName: z
      .string()
      .min(1, 'First name cannot be empty')
      .optional(),
    lastName: z
      .string()
      .min(1, 'Last name cannot be empty')
      .optional(),
    email: z
      .string()
      .email('Invalid email address format')
      .optional()
      .nullable()
      .or(z.literal('')),
    phone: z.string().optional().nullable(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST']).optional(),
    source: z.string().optional().nullable(),
    budget: z.number().min(0).optional().nullable(),
    timeline: z.string().optional().nullable(),
    financingStatus: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    assignedUserId: z.string().uuid('Invalid agent user ID format').optional().nullable(),
    preferredUnitId: z.string().uuid('Invalid unit ID format').optional().nullable(),
  }),
});

const activityLogSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid lead ID format'),
  }),
  body: z.object({
    type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING', 'STATUS_CHANGE', 'TASK'], {
      required_error: 'Activity type is required',
    }),
    description: z
      .string({ required_error: 'Activity description comments are required' })
      .min(1, 'Comments cannot be empty'),
  }),
});

const importCSVSchema = z.object({
  body: z.object({
    csvData: z.string({ required_error: 'CSV data content is required' }),
  }),
});

const uuidIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

const createPublicLeadSchema = z.object({
  body: z.object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .min(1, 'First name cannot be empty'),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .min(1, 'Last name cannot be empty'),
    email: z
      .string()
      .email('Invalid email address format')
      .optional()
      .nullable()
      .or(z.literal('')),
    phone: z.string().optional().nullable(),
    projectId: z.string().uuid('Invalid project ID format'),
    source: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

// ==========================================
// ROUTES DEFINITIONS
// ==========================================

router.post('/public', validate(createPublicLeadSchema), createPublicLead);
router.post('/', protect, validate(createLeadSchema), createLead);
router.get('/', protect, getLeads);
router.post('/import', protect, validate(importCSVSchema), importCSV);
router.get('/:id', protect, validate(uuidIdSchema), getLead);
router.put('/:id', protect, validate(updateLeadSchema), updateLead);
router.delete('/:id', protect, restrictTo('ADMIN', 'SALES_MANAGER'), validate(uuidIdSchema), deleteLead);
router.post('/:id/activities', protect, validate(activityLogSchema), logActivity);

export default router;
