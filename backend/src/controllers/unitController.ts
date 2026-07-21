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
    const { name, bedrooms, bathrooms, sizeSqFt, basePrice, brochureUrl } = req.body;

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
        brochureUrl: brochureUrl || null,
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

    // Run a single grouped query to count units by unitTypeId and status
    const unitCounts = await prisma.unit.groupBy({
      by: ['unitTypeId', 'status'],
      where: {
        projectId,
        deletedAt: null,
      },
      _count: true,
    });

    // Build lookup maps for total units and available units per layout
    const totalCountMap: Record<string, number> = {};
    const availableCountMap: Record<string, number> = {};

    unitCounts.forEach((c) => {
      totalCountMap[c.unitTypeId] = (totalCountMap[c.unitTypeId] || 0) + c._count;
      if (c.status === 'AVAILABLE') {
        availableCountMap[c.unitTypeId] = c._count;
      }
    });

    const enrichedUnitTypes = await Promise.all(
      unitTypes.map(async (type) => {
        const totalCount = totalCountMap[type.id] || 0;
        const availableCount = availableCountMap[type.id] || 0;

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
    const { name, bedrooms, bathrooms, sizeSqFt, basePrice, brochureUrl } = req.body;

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
        brochureUrl: brochureUrl !== undefined ? brochureUrl : undefined,
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
    const { unitNumber, floor, status, price, areaSqFt, facing, unitTypeId, xCoord, yCoord } = req.body;

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
        xCoord: xCoord !== undefined ? parseFloat(xCoord) : undefined,
        yCoord: yCoord !== undefined ? parseFloat(yCoord) : undefined,
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

/**
 * Dynamic Pricing Engine: Execute dynamic pricing optimizations
 */
export const applyDynamicPricing = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new InventoryError('User is not associated with an organization', 400);
    }

    const { unitTypeId, adjustmentFactor } = req.body;

    const unitTypes = await prisma.unitType.findMany({
      where: {
        organizationId: orgId,
        ...(unitTypeId ? { id: unitTypeId } : {}),
        deletedAt: null,
      },
      include: {
        units: { where: { status: 'AVAILABLE', deletedAt: null } },
      },
    });

    let updatedUnitsCount = 0;
    const adjustmentsLog: Array<{ unitTypeId: string; name: string; oldPrice: number; newPrice: number; signal: string }> = [];

    for (const type of unitTypes) {
      const availableUnits = type.units;
      if (availableUnits.length === 0) continue;

      const interestedLeadsCount = await prisma.lead.count({
        where: {
          organizationId: orgId,
          deletedAt: null,
          preferredUnitId: { in: availableUnits.map((u) => u.id) },
        },
      });

      let multiplier = adjustmentFactor ? parseFloat(adjustmentFactor) : 1.0;
      let signal = 'BALANCED';

      if (!adjustmentFactor) {
        if (availableUnits.length <= 3 && interestedLeadsCount >= 2) {
          multiplier = 1.05; // +5% High demand escalation
          signal = 'HIGH_DEMAND_ESCALATION';
        } else if (availableUnits.length >= 5 && interestedLeadsCount === 0) {
          multiplier = 0.97; // -3% Promotional absorption incentive
          signal = 'PROMOTIONAL_DISCOUNT';
        }
      }

      if (multiplier !== 1.0) {
        for (const unit of availableUnits) {
          if (!unit.price) continue;
          const currentPrice = parseFloat(unit.price.toString());
          const newPrice = Math.round(currentPrice * multiplier);

          await prisma.unit.update({
            where: { id: unit.id },
            data: { price: newPrice },
          });

          updatedUnitsCount++;
          adjustmentsLog.push({
            unitTypeId: type.id,
            name: `${type.name} (Unit ${unit.unitNumber})`,
            oldPrice: currentPrice,
            newPrice,
            signal,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Dynamic Pricing Engine optimized ${updatedUnitsCount} available units successfully.`,
      data: {
        updatedUnitsCount,
        adjustments: adjustmentsLog,
      },
    });
  } catch (error) {
    next(error);
  }
};
