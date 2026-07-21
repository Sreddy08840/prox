import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { protect, restrictTo } from '../middlewares/auth';
import {
  createUnitType,
  getUnitTypes,
  updateUnitType,
  deleteUnitType,
  createUnit,
  getUnits,
  getUnit,
  updateUnit,
  deleteUnit,
  getUnitStats,
  applyDynamicPricing,
} from '../controllers/unitController';

const router = Router();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const createLayoutSchema = z.object({
  params: z.object({
    projectId: z.string().uuid('Invalid project ID format'),
  }),
  body: z.object({
    name: z
      .string({ required_error: 'Layout configuration name is required' })
      .min(2, 'Name must be at least 2 characters'),
    bedrooms: z.number().int().min(0).optional().nullable(),
    bathrooms: z.number().min(0).optional().nullable(),
    sizeSqFt: z.number().min(0).optional().nullable(),
    basePrice: z.number().min(0).optional().nullable(),
  }),
});

const updateLayoutSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid layout ID format'),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .optional(),
    bedrooms: z.number().int().min(0).optional().nullable(),
    bathrooms: z.number().min(0).optional().nullable(),
    sizeSqFt: z.number().min(0).optional().nullable(),
    basePrice: z.number().min(0).optional().nullable(),
  }),
});

const createUnitSchema = z.object({
  params: z.object({
    projectId: z.string().uuid('Invalid project ID format'),
  }),
  body: z.object({
    unitNumber: z
      .string({ required_error: 'Unit number is required' })
      .min(1, 'Unit number cannot be empty'),
    floor: z.number().int().optional().nullable(),
    status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'MAINTENANCE'], {
      required_error: 'Status is required',
    }),
    price: z.number().min(0).optional().nullable(),
    areaSqFt: z.number().min(0).optional().nullable(),
    facing: z.string().optional().nullable(),
    unitTypeId: z.string().uuid('Invalid layout configuration selection ID'),
  }),
});

const updateUnitSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid unit ID format'),
  }),
  body: z.object({
    unitNumber: z
      .string()
      .min(1, 'Unit number cannot be empty')
      .optional(),
    floor: z.number().int().optional().nullable(),
    status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'MAINTENANCE']).optional(),
    price: z.number().min(0).optional().nullable(),
    areaSqFt: z.number().min(0).optional().nullable(),
    facing: z.string().optional().nullable(),
    unitTypeId: z.string().uuid('Invalid layout configuration selection ID').optional(),
  }),
});

const uuidIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

const projectIdParamsSchema = z.object({
  params: z.object({
    projectId: z.string().uuid('Invalid project ID format'),
  }),
});

// ==========================================
// ROUTES DEFINITIONS
// ==========================================

// Unit Layout Types
router.post('/projects/:projectId/unit-types', protect, restrictTo('ADMIN', 'SALES_MANAGER'), validate(createLayoutSchema), createUnitType);
router.get('/projects/:projectId/unit-types', protect, validate(projectIdParamsSchema), getUnitTypes);
router.put('/unit-types/:id', protect, restrictTo('ADMIN', 'SALES_MANAGER'), validate(updateLayoutSchema), updateUnitType);
router.delete('/unit-types/:id', protect, restrictTo('ADMIN'), validate(uuidIdSchema), deleteUnitType);

// Inventory Units
router.post('/projects/:projectId/units', protect, restrictTo('ADMIN', 'SALES_MANAGER'), validate(createUnitSchema), createUnit);
router.get('/projects/:projectId/units', protect, validate(projectIdParamsSchema), getUnits);
router.get('/projects/:projectId/units/stats', protect, validate(projectIdParamsSchema), getUnitStats);
router.get('/units/:id', protect, validate(uuidIdSchema), getUnit);
router.put('/units/:id', protect, restrictTo('ADMIN', 'SALES_MANAGER'), validate(updateUnitSchema), updateUnit);
router.delete('/units/:id', protect, restrictTo('ADMIN'), validate(uuidIdSchema), deleteUnit);
router.post('/apply-dynamic-pricing', protect, restrictTo('ADMIN', 'SALES_MANAGER'), applyDynamicPricing);
router.post('/units/apply-dynamic-pricing', protect, restrictTo('ADMIN', 'SALES_MANAGER'), applyDynamicPricing);

export default router;
