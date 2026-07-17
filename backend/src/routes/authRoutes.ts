import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  acceptInvitation,
  bookDemo,
} from '../controllers/authController';

const router = Router();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const registerSchema = z.object({
  body: z.object({
    organizationName: z
      .string({ required_error: 'Organization name is required' })
      .min(2, 'Organization name must be at least 2 characters'),
    organizationSlug: z
      .string({ required_error: 'Organization URL slug identifier is required' })
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes'),
    email: z
      .string({ required_error: 'Email address is required' })
      .email('Invalid email address format'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address format'),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address format'),
  }),
});

const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string({ required_error: 'Reset token is required' }),
  }),
  body: z.object({
    password: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters long'),
  }),
});

const acceptInvitationSchema = z.object({
  params: z.object({
    token: z.string({ required_error: 'Invitation token is required' }),
  }),
  body: z.object({
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

const bookDemoSchema = z.object({
  body: z.object({
    fullName: z.string({ required_error: 'Full name is required' }).min(1, 'Full name cannot be empty'),
    companyName: z.string({ required_error: 'Company name is required' }).min(1, 'Company name cannot be empty'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address format'),
    phone: z.string({ required_error: 'Phone number is required' }).min(1, 'Phone number cannot be empty'),
    country: z.string({ required_error: 'Country is required' }).min(1, 'Country cannot be empty'),
    orgSize: z.string({ required_error: 'Organization size is required' }).min(1, 'Organization size cannot be empty'),
    role: z.string({ required_error: 'Role is required' }).min(1, 'Role cannot be empty'),
    projects: z.string({ required_error: 'Projects count is required' }).min(1, 'Projects count cannot be empty'),
    preferredDate: z.string({ required_error: 'Preferred date is required' }).min(1, 'Preferred date cannot be empty'),
    preferredTime: z.string({ required_error: 'Preferred time is required' }).min(1, 'Preferred time cannot be empty'),
    message: z.string().optional().nullable(),
  }),
});

// ==========================================
// ROUTES DEFINITIONS
// ==========================================

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);
router.post('/accept-invitation/:token', validate(acceptInvitationSchema), acceptInvitation);
router.post('/book-demo', validate(bookDemoSchema), bookDemo);

export default router;

