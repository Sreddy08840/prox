import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { LeaseStatus, Prisma } from '@prisma/client';

class TenantError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, TenantError.prototype);
  }
}

/**
 * Register a new tenant profile
 */
export const createTenant = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new TenantError('User is not associated with an organization', 400);
    }

    const { firstName, lastName, email, phone } = req.body;

    const tenant = await prisma.tenant.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        organizationId: orgId,
      },
    });

    res.status(201).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List tenants with search, status filtering, and pagination
 */
export const getTenants = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new TenantError('User is not associated with an organization', 400);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const status = req.query.status as string; // 'ACTIVE', 'INACTIVE', 'UPCOMING'
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const now = new Date();

    const where: Prisma.TenantWhereInput = {
      organizationId: orgId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'ACTIVE') {
      where.leases = {
        some: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now },
        },
      };
    } else if (status === 'UPCOMING') {
      where.leases = {
        some: {
          status: 'ACTIVE',
          startDate: { gt: now },
        },
      };
    } else if (status === 'INACTIVE') {
      where.leases = {
        none: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now },
        },
      };
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          leases: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
              unit: {
                select: {
                  id: true,
                  unitNumber: true,
                  project: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.tenant.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        tenants,
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
 * Retrieve a specific tenant profile with complete lease history
 */
export const getTenant = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new TenantError('User is not associated with an organization', 400);
    }

    const { id } = req.params;

    const tenant = await prisma.tenant.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: {
        leases: {
          where: { deletedAt: null },
          orderBy: { startDate: 'desc' },
          include: {
            unit: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new TenantError('Tenant profile not found', 404);
    }

    res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update tenant contact details
 */
export const updateTenant = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new TenantError('User is not associated with an organization', 400);
    }

    const { id } = req.params;
    const { firstName, lastName, email, phone } = req.body;

    const tenant = await prisma.tenant.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!tenant) {
      throw new TenantError('Tenant profile not found', 404);
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: email !== undefined ? email : tenant.email,
        phone: phone !== undefined ? phone : tenant.phone,
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a tenant profile
 */
export const deleteTenant = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new TenantError('User is not associated with an organization', 400);
    }

    const { id } = req.params;

    const tenant = await prisma.tenant.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!tenant) {
      throw new TenantError('Tenant profile not found', 404);
    }

    await prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'Tenant profile successfully deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start and assign a lease to a tenant for a unit
 */
export const createLease = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new TenantError('User is not associated with an organization', 400);
    }

    const { id: tenantId } = req.params;
    const { unitId, startDate, endDate, rentAmount, depositAmount, notes } = req.body;

    // Verify tenant
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, organizationId: orgId, deletedAt: null },
    });
    if (!tenant) {
      throw new TenantError('Tenant profile not found', 404);
    }

    // Verify unit exists and belongs to the organization
    const unit = await prisma.unit.findFirst({
      where: { id: unitId, deletedAt: null, project: { organizationId: orgId } },
    });
    if (!unit) {
      throw new TenantError('Target unit not found', 404);
    }

    if (unit.status === 'SOLD') {
      throw new TenantError('Cannot lease a unit that has been sold', 400);
    }

    // Run lease registration and unit status update in a transaction
    const [lease] = await prisma.$transaction([
      prisma.lease.create({
        data: {
          tenantId,
          unitId,
          organizationId: orgId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          rentAmount: new Prisma.Decimal(rentAmount),
          depositAmount: depositAmount ? new Prisma.Decimal(depositAmount) : null,
          status: 'ACTIVE' as LeaseStatus,
          notes: notes || null,
        },
        include: {
          unit: true,
        },
      }),
      prisma.unit.update({
        where: { id: unitId },
        data: { status: 'RENTED' },
      }),
    ]);

    res.status(201).json({
      success: true,
      data: lease,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate an active lease
 */
export const terminateLease = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new TenantError('User is not associated with an organization', 400);
    }

    const { id: leaseId } = req.params;

    // Find lease
    const lease = await prisma.lease.findFirst({
      where: { id: leaseId, organizationId: orgId, deletedAt: null },
    });
    if (!lease) {
      throw new TenantError('Lease record not found', 404);
    }

    // Update lease status to TERMINATED and restore unit to AVAILABLE
    const [updatedLease] = await prisma.$transaction([
      prisma.lease.update({
        where: { id: leaseId },
        data: { status: 'TERMINATED' as LeaseStatus },
      }),
      prisma.unit.update({
        where: { id: lease.unitId },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: updatedLease,
    });
  } catch (error) {
    next(error);
  }
};
