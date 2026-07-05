import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { protect, restrictTo } from '../middlewares/auth';
import {
  createTenant,
  getTenants,
  getTenant,
  updateTenant,
  deleteTenant,
  createLease,
  terminateLease,
} from '../controllers/tenantController';

const router = Router();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const createTenantSchema = z.object({
  body: z.object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .min(1, 'First name cannot be empty'),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .min(1, 'Last name cannot be empty'),
    email: z.string().email('Invalid email address format').optional().nullable(),
    phone: z.string().optional().nullable(),
  }),
});

const updateTenantSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tenant ID format'),
  }),
  body: z.object({
    firstName: z.string().min(1, 'First name cannot be empty').optional(),
    lastName: z.string().min(1, 'Last name cannot be empty').optional(),
    email: z.string().email('Invalid email address format').optional().nullable(),
    phone: z.string().optional().nullable(),
  }),
});

const createLeaseSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tenant ID format'),
  }),
  body: z.object({
    unitId: z.string().uuid('Invalid unit ID format'),
    startDate: z.string({ required_error: 'Start date is required' }),
    endDate: z.string({ required_error: 'End date is required' }),
    rentAmount: z.number({ required_error: 'Rent amount is required' }).min(0, 'Rent amount must be non-negative'),
    depositAmount: z.number().min(0, 'Deposit amount must be non-negative').optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

const uuidIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

// ==========================================
// ROUTES DEFINITIONS
// ==========================================

// Tenants CRUD
router.post('/', protect, restrictTo('ADMIN', 'SALES_MANAGER'), validate(createTenantSchema), createTenant);
router.get('/', protect, getTenants);
router.get('/:id', protect, validate(uuidIdSchema), getTenant);
router.put('/:id', protect, restrictTo('ADMIN', 'SALES_MANAGER'), validate(updateTenantSchema), updateTenant);
router.delete('/:id', protect, restrictTo('ADMIN'), validate(uuidIdSchema), deleteTenant);

// Lease lifecycle operations
router.post('/:id/leases', protect, restrictTo('ADMIN', 'SALES_MANAGER'), validate(createLeaseSchema), createLease);
router.put('/leases/:id/terminate', protect, restrictTo('ADMIN', 'SALES_MANAGER'), validate(uuidIdSchema), terminateLease);

export default router;
