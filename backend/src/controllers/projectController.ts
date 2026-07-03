import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ProjectStatus, Prisma } from '@prisma/client';

class ProjectError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ProjectError.prototype);
  }
}

/**
 * Create a new real estate project
 */
export const createProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new ProjectError('User is not associated with an organization', 400);
    }

    const { name, description, address, city, status, launchDate } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        address,
        city,
        status: status as ProjectStatus,
        launchDate: launchDate ? new Date(launchDate) : null,
        organizationId: orgId,
      },
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List projects with pagination, sorting, filtering, and text search
 */
export const getProjects = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new ProjectError('User is not associated with an organization', 400);
    }

    // Query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    // Build filter query
    const where: Prisma.ProjectWhereInput = {
      organizationId: orgId,
      deletedAt: null,
    };

    if (status) {
      where.status = status as ProjectStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.project.count({ where });

    // Fetch projects
    const projects = await prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        _count: {
          select: {
            units: true,
            unitTypes: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get details of a single project by ID
 */
export const getProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new ProjectError('User is not associated with an organization', 400);
    }

    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            units: true,
            unitTypes: true,
          },
        },
      },
    });

    if (!project) {
      throw new ProjectError('Project not found or is outside your organization', 404);
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project details
 */
export const updateProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new ProjectError('User is not associated with an organization', 400);
    }

    const { id } = req.params;
    const { name, description, address, city, status, launchDate } = req.body;

    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new ProjectError('Project not found or is outside your organization', 404);
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        address,
        city,
        status: status as ProjectStatus,
        launchDate: launchDate ? new Date(launchDate) : null,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a project
 */
export const deleteProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new ProjectError('User is not associated with an organization', 400);
    }

    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new ProjectError('Project not found or is outside your organization', 404);
    }

    // Perform soft delete by setting deletedAt
    await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Project soft deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
