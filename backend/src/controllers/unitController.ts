import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { UnitStatus, Prisma } from '@prisma/client';

class InventoryError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, InventoryError.prototype);
  }
}

// ==========================================
// UNIT TYPE LAYOUTS CONTROLLERS
// ==========================================

export const createUnitType = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new InventoryError('User is not associated with an organization', 400);
    }

    const { projectId } = req.params;
    const { name, bedrooms, bathrooms, sizeSqFt, basePrice } = req.body;

    // Check project exists
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId, deletedAt: null },
    });
    if (!project) {
      throw new InventoryError('Project not found in organization', 404);
    }

    const unitType = await prisma.unitType.create({
      data: {
        name,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseFloat(bathrooms) : null,
        sizeSqFt: sizeSqFt ? parseFloat(sizeSqFt) : null,
        basePrice: basePrice ? new Prisma.Decimal(basePrice) : null,
        projectId,
        organizationId: orgId,
      },
    });

    res.status(201).json({
      success: true,
      data: unitType,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnitTypes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new InventoryError('User is not associated with an organization', 400);
    }

    const { projectId } = req.params;

    const unitTypes = await prisma.unitType.findMany({
      where: {
        projectId,
        organizationId: orgId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const enrichedUnitTypes = await Promise.all(
      unitTypes.map(async (type) => {
        const totalCount = await prisma.unit.count({
          where: { unitTypeId: type.id, deletedAt: null },
        });

        const availableCount = await prisma.unit.count({
          where: { unitTypeId: type.id, status: 'AVAILABLE', deletedAt: null },
        });

        // Count interested qualified leads
        const interestedLeadsCount = await prisma.lead.count({
          where: {
            deletedAt: null,
            status: { in: ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING'] },
            OR: [
              {
                preferredUnit: {
                  unitTypeId: type.id,
                },
              },
              {
                aiInsight: {
                  preferredUnit: {
                    contains: type.name.split(' ')[0], // simple keyword match e.g. "2" or "3" for "2 BHK"
                    mode: 'insensitive',
                  },
                },
              },
            ],
          },
        });

        // Determine pricing sensitivity signal
        let signal: 'OPPORTUNITY' | 'RISK' | 'NORMAL' = 'NORMAL';
        if (availableCount <= 3 && interestedLeadsCount >= 2) {
          signal = 'OPPORTUNITY';
        } else if (availableCount >= 5 && interestedLeadsCount === 0) {
          signal = 'RISK';
        }

        return {
          ...type,
          totalUnits: totalCount,
          availableUnits: availableCount,
          demandHeat: interestedLeadsCount,
          pricingSignal: signal,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedUnitTypes,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUnitType = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new InventoryError('User is not associated with an organization', 400);
    }

    const { id } = req.params;
    const { name, bedrooms, bathrooms, sizeSqFt, basePrice } = req.body;

    const unitType = await prisma.unitType.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!unitType) {
      throw new InventoryError('Unit layout type not found', 404);
    }

    const updated = await prisma.unitType.update({
      where: { id },
      data: {
        name,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseFloat(bathrooms) : null,
        sizeSqFt: sizeSqFt ? parseFloat(sizeSqFt) : null,
        basePrice: basePrice ? new Prisma.Decimal(basePrice) : null,
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

export const deleteUnitType = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new InventoryError('User is not associated with an organization', 400);
    }

    const { id } = req.params;

    const unitType = await prisma.unitType.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!unitType) {
      throw new InventoryError('Unit layout type not found', 404);
    }

    // Soft delete
    await prisma.unitType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'Layout configuration soft deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// INVENTORY UNITS CONTROLLERS
// ==========================================

export const createUnit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new InventoryError('User is not associated with an organization', 400);
    }

    const { projectId } = req.params;
    const { unitNumber, floor, status, price, areaSqFt, facing, unitTypeId } = req.body;

    // Verify layout and project belong to org
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId, deletedAt: null },
    });
    if (!project) {
      throw new InventoryError('Project not found in organization', 404);
    }

    const layout = await prisma.unitType.findFirst({
      where: { id: unitTypeId, projectId, deletedAt: null },
    });
    if (!layout) {
      throw new InventoryError('Invalid layout configuration selection for this project', 400);
    }

    // Check unitNumber uniqueness inside project
    const existingUnit = await prisma.unit.findFirst({
      where: { unitNumber, projectId, deletedAt: null },
    });
    if (existingUnit) {
      throw new InventoryError(`Unit number "${unitNumber}" already exists in this project`, 400);
    }

    const unit = await prisma.unit.create({
      data: {
        unitNumber,
        floor: floor ? parseInt(floor) : null,
        status: status as UnitStatus,
        price: price ? new Prisma.Decimal(price) : null,
        areaSqFt: areaSqFt ? parseFloat(areaSqFt) : null,
        facing,
        unitTypeId,
        projectId,
      },
    });

    res.status(201).json({
      success: true,
      data: unit,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnits = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new InventoryError('User is not associated with an organization', 400);
    }

    const { projectId } = req.params;

    // Filters & Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const unitTypeId = req.query.unitTypeId as string;
    const facing = req.query.facing as string;
    const sortBy = (req.query.sortBy as string) || 'unitNumber';
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? 'desc' : 'asc';

    // Verify project belongs to org
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId, deletedAt: null },
    });
    if (!project) {
      throw new InventoryError('Project not found', 404);
    }

    const where: Prisma.UnitWhereInput = {
      projectId,
      deletedAt: null,
    };

    if (status) {
      where.status = status as UnitStatus;
    }
    if (unitTypeId) {
      where.unitTypeId = unitTypeId;
    }
    if (facing) {
      where.facing = { contains: facing, mode: 'insensitive' };
    }
    if (search) {
      where.unitNumber = { contains: search, mode: 'insensitive' };
    }

    const total = await prisma.unit.count({ where });

    const units = await prisma.unit.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        unitType: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        units,
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

export const getUnit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new InventoryError('User is not associated with an organization', 400);
    }

    const { id } = req.params;

    const unit = await prisma.unit.findFirst({
      where: {
        id,
        deletedAt: null,
        project: {
          organizationId: orgId,
        },
      },
      include: {
        unitType: true,
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!unit) {
      throw new InventoryError('Unit inventory records not found', 404);
    }

    res.status(200).json({
      success: true,
      data: unit,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUnit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new InventoryError('User is not associated with an organization', 400);
    }

    const { id } = req.params;
    const { unitNumber, floor, status, price, areaSqFt, facing, unitTypeId } = req.body;

    const unit = await prisma.unit.findFirst({
      where: {
        id,
        deletedAt: null,
        project: {
          organizationId: orgId,
        },
      },
    });
    if (!unit) {
      throw new InventoryError('Unit inventory records not found', 404);
    }

    if (unitTypeId && unitTypeId !== unit.unitTypeId) {
      const layout = await prisma.unitType.findFirst({
        where: { id: unitTypeId, projectId: unit.projectId, deletedAt: null },
      });
      if (!layout) {
        throw new InventoryError('Invalid layout type choice for this project', 400);
      }
    }

    if (unitNumber && unitNumber !== unit.unitNumber) {
      const existing = await prisma.unit.findFirst({
        where: { unitNumber, projectId: unit.projectId, deletedAt: null },
      });
      if (existing) {
        throw new InventoryError(`Unit number "${unitNumber}" already exists in this project`, 400);
      }
    }

    const updated = await prisma.unit.update({
      where: { id },
      data: {
        unitNumber,
        floor: floor ? parseInt(floor) : null,
        status: status as UnitStatus,
        price: price ? new Prisma.Decimal(price) : null,
        areaSqFt: areaSqFt ? parseFloat(areaSqFt) : null,
        facing,
        unitTypeId,
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

export const deleteUnit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new InventoryError('User is not associated with an organization', 400);
    }

    const { id } = req.params;

    const unit = await prisma.unit.findFirst({
      where: {
        id,
        deletedAt: null,
        project: {
          organizationId: orgId,
        },
      },
    });
    if (!unit) {
      throw new InventoryError('Unit inventory records not found', 404);
    }

    // Soft delete
    await prisma.unit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'Unit inventory record soft deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// STATISTICS CONTROLLER
// ==========================================

export const getUnitStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new InventoryError('User is not associated with an organization', 400);
    }

    const { projectId } = req.params;

    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId, deletedAt: null },
    });
    if (!project) {
      throw new InventoryError('Project not found in organization', 404);
    }

    // Aggregated statuses counts & totals
    const groupStats = await prisma.unit.groupBy({
      by: ['status'],
      where: {
        projectId,
        deletedAt: null,
      },
      _count: {
        status: true,
      },
      _sum: {
        price: true,
      },
      _avg: {
        price: true,
        areaSqFt: true,
      },
    });

    // Populate baseline structure
    const statsSummary = {
      totalCount: 0,
      availableCount: 0,
      reservedCount: 0,
      soldCount: 0,
      totalPortfolioValue: new Prisma.Decimal(0),
      soldPortfolioValue: new Prisma.Decimal(0),
      averagePrice: new Prisma.Decimal(0),
      averageArea: 0,
    };

    let totalAreaSum = 0;
    let totalAreaCount = 0;

    groupStats.forEach((group) => {
      const count = group._count.status;
      statsSummary.totalCount += count;

      if (group.status === 'AVAILABLE') {
        statsSummary.availableCount = count;
      } else if (group.status === 'RESERVED') {
        statsSummary.reservedCount = count;
      } else if (group.status === 'SOLD') {
        statsSummary.soldCount = count;
        if (group._sum.price) {
          statsSummary.soldPortfolioValue = group._sum.price;
        }
      }

      if (group._sum.price) {
        statsSummary.totalPortfolioValue = statsSummary.totalPortfolioValue.plus(group._sum.price);
      }

      if (group._avg.areaSqFt && count) {
        totalAreaSum += group._avg.areaSqFt * count;
        totalAreaCount += count;
      }
    });

    if (statsSummary.totalCount > 0) {
      statsSummary.averagePrice = statsSummary.totalPortfolioValue.dividedBy(statsSummary.totalCount);
    }

    if (totalAreaCount > 0) {
      statsSummary.averageArea = totalAreaSum / totalAreaCount;
    }

    res.status(200).json({
      success: true,
      data: statsSummary,
    });
  } catch (error) {
    next(error);
  }
};
