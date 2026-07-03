import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { protect, restrictTo } from '../middlewares/auth';
import {
  getOrganization,
  updateOrganization,
  getMembers,
  inviteMember,
  updateMemberRole,
  updateMemberStatus,
} from '../controllers/orgController';

const router = Router();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const updateOrgSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Organization name must be at least 2 characters')
      .optional(),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes')
      .optional(),
  }),
});

const inviteSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address format'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.enum(['ADMIN', 'SALES_MANAGER', 'SALES_AGENT', 'VIEWER'], {
      required_error: 'Role is required',
    }),
  }),
});

const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid member ID format'),
  }),
  body: z.object({
    role: z.enum(['ADMIN', 'SALES_MANAGER', 'SALES_AGENT', 'VIEWER'], {
      required_error: 'Role is required',
    }),
  }),
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid member ID format'),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE'], {
      required_error: 'Status is required',
    }),
  }),
});

// ==========================================
// ROUTES DEFINITIONS
// ==========================================

// Organization Profile
router.get('/me', protect, getOrganization);
router.put('/me', protect, restrictTo('ADMIN'), validate(updateOrgSchema), updateOrganization);

// Team Members Management
router.get('/me/members', protect, restrictTo('ADMIN', 'SALES_MANAGER'), getMembers);
router.post('/me/invitations', protect, restrictTo('ADMIN'), validate(inviteSchema), inviteMember);
router.put('/me/members/:id/role', protect, restrictTo('ADMIN'), validate(updateRoleSchema), updateMemberRole);
router.put('/me/members/:id/status', protect, restrictTo('ADMIN'), validate(updateStatusSchema), updateMemberStatus);

export default router;
