import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { protect, restrictTo } from '../middlewares/auth';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';

const router = Router();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Project name is required' })
      .min(2, 'Project name must be at least 2 characters'),
    description: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    status: z.enum(['PLANNING', 'UNDER_CONSTRUCTION', 'COMPLETED', 'CANCELLED'], {
      required_error: 'Status is required',
    }),
    launchDate: z.string().datetime({ message: 'Invalid Date format (ISO-8601 expected)' }).optional().nullable(),
  }),
});

const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID format'),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Project name must be at least 2 characters')
      .optional(),
    description: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    status: z.enum(['PLANNING', 'UNDER_CONSTRUCTION', 'COMPLETED', 'CANCELLED']).optional(),
    launchDate: z.string().datetime({ message: 'Invalid Date format (ISO-8601 expected)' }).optional().nullable(),
  }),
});

const projectIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID format'),
  }),
});

// ==========================================
// ROUTES DEFINITIONS
// ==========================================

router.post('/', protect, restrictTo('ADMIN', 'SALES_MANAGER'), validate(createProjectSchema), createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, validate(projectIdSchema), getProject);
router.put('/:id', protect, restrictTo('ADMIN', 'SALES_MANAGER'), validate(updateProjectSchema), updateProject);
router.delete('/:id', protect, restrictTo('ADMIN'), validate(projectIdSchema), deleteProject);

export default router;
