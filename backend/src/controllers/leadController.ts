import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { LeadStatus, ActivityType, Prisma } from '@prisma/client';
import notificationService from '../services/notificationService';

class CRMError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CRMError.prototype);
  }
}

/**
 * Helper to check duplicate leads in organization
 */
async function checkDuplicate(
  orgId: string,
  email?: string | null,
  phone?: string | null,
): Promise<string | null> {
  if (!email && !phone) return null;

  const conditions: Prisma.LeadWhereInput[] = [];
  if (email) conditions.push({ email });
  if (phone) conditions.push({ phone });

  const existing = await prisma.lead.findFirst({
    where: {
      organizationId: orgId,
      deletedAt: null,
      OR: conditions,
    },
  });

  if (existing) {
    if (email && existing.email === email) {
      return `A lead with email "${email}" already exists in the organization.`;
    }
    if (phone && existing.phone === phone) {
      return `A lead with phone "${phone}" already exists in the organization.`;
    }
  }

  return null;
}

/**
 * Create a new lead
 */
export const createLead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new CRMError('User is not associated with an organization', 400);
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      status,
      source,
      budget,
      timeline,
      financingStatus,
      notes,
      assignedUserId,
      preferredUnitId,
    } = req.body;

    // Check duplicate
    const duplicateMessage = await checkDuplicate(orgId, email, phone);
    if (duplicateMessage) {
      throw new CRMError(duplicateMessage, 400);
    }

    // Create lead in transaction to log initial activity log
    const lead = await prisma.$transaction(async (tx) => {
      const newLead = await tx.lead.create({
        data: {
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          status: (status as LeadStatus) || 'NEW',
          source: source || null,
          budget: budget ? new Prisma.Decimal(budget) : null,
          timeline: timeline || null,
          financingStatus: financingStatus || null,
          notes: notes || null,
          organizationId: orgId,
          assignedUserId: assignedUserId || null,
          preferredUnitId: preferredUnitId || null,
        },
      });

      // Log initial creation activity
      await tx.leadActivity.create({
        data: {
          leadId: newLead.id,
          type: 'STATUS_CHANGE',
          description: `Lead created under status: ${newLead.status}`,
        },
      });

      return newLead;
    });

    if (lead.assignedUserId) {
      await notificationService.sendNotification(
        lead.assignedUserId,
        'New Lead Assigned',
        `Lead ${lead.firstName} ${lead.lastName} has been assigned to you.`,
        {
          subject: `PropX CRM - Lead Assigned: ${lead.firstName} ${lead.lastName}`,
          text: `Hello, you have been assigned a new lead: ${lead.firstName} ${lead.lastName}.`,
          html: `<p>Hello,</p><p>You have been assigned a new lead: <strong>${lead.firstName} ${lead.lastName}</strong>.</p>`,
        },
      );
    }

    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List leads with search, filtering, and pagination
 */
export const getLeads = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new CRMError('User is not associated with an organization', 400);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const source = req.query.source as string;
    const assignedUserId = req.query.assignedUserId as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const where: Prisma.LeadWhereInput = {
      organizationId: orgId,
      deletedAt: null,
    };

    if (status) {
      where.status = status as LeadStatus;
    }
    if (source) {
      where.source = source;
    }
    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.lead.count({ where });

    const leads = await prisma.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        preferredUnit: {
          select: {
            id: true,
            unitNumber: true,
            project: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        leads,
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
 * Get lead details with activities
 */
export const getLead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new CRMError('User is not associated with an organization', 400);
    }

    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        preferredUnit: {
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
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!lead) {
      throw new CRMError('Lead profile not found', 404);
    }

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update lead details
 */
export const updateLead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new CRMError('User is not associated with an organization', 400);
    }

    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      status,
      source,
      budget,
      timeline,
      financingStatus,
      notes,
      assignedUserId,
      preferredUnitId,
    } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!lead) {
      throw new CRMError('Lead profile not found', 404);
    }

    // Check duplicate if email or phone is updated
    if (email && email !== lead.email) {
      const duplicateMessage = await checkDuplicate(orgId, email, null);
      if (duplicateMessage) throw new CRMError(duplicateMessage, 400);
    }
    if (phone && phone !== lead.phone) {
      const duplicateMessage = await checkDuplicate(orgId, null, phone);
      if (duplicateMessage) throw new CRMError(duplicateMessage, 400);
    }

    // Update in transaction to append status changes logs
    const updated = await prisma.$transaction(async (tx) => {
      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          status: status ? (status as LeadStatus) : undefined,
          source: source || null,
          budget: budget ? new Prisma.Decimal(budget) : null,
          timeline: timeline || null,
          financingStatus: financingStatus || null,
          notes: notes || null,
          assignedUserId: assignedUserId || null,
          preferredUnitId: preferredUnitId || null,
        },
      });

      // Check status change
      if (status && status !== lead.status) {
        await tx.leadActivity.create({
          data: {
            leadId: id,
            type: 'STATUS_CHANGE',
            description: `Lead status changed from "${lead.status}" to "${status}"`,
          },
        });
      }

      return updatedLead;
    });

    // Notify on assignment updates
    if (updated.assignedUserId && updated.assignedUserId !== lead.assignedUserId) {
      await notificationService.sendNotification(
        updated.assignedUserId,
        'Lead Assigned',
        `Lead ${updated.firstName} ${updated.lastName} has been assigned to you.`,
        {
          subject: `PropX CRM - Lead Assigned: ${updated.firstName} ${updated.lastName}`,
          text: `Hello, you have been assigned a lead: ${updated.firstName} ${updated.lastName}.`,
          html: `<p>Hello,</p><p>You have been assigned a lead: <strong>${updated.firstName} ${updated.lastName}</strong>.</p>`,
        },
      );
    }

    // Notify on status updates (notify assigned user if any)
    if (status && status !== lead.status && lead.assignedUserId) {
      await notificationService.sendNotification(
        lead.assignedUserId,
        'Lead Status Updated',
        `Lead ${lead.firstName} ${lead.lastName}'s status changed from "${lead.status}" to "${status}".`,
        {
          subject: `PropX CRM - Status Updated: ${lead.firstName} ${lead.lastName}`,
          text: `Hello, the status of lead ${lead.firstName} ${lead.lastName} has been updated to ${status}.`,
          html: `<p>Hello,</p><p>The status of lead <strong>${lead.firstName} ${lead.lastName}</strong> has been updated to <strong>${status}</strong>.</p>`,
        },
      );
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a lead
 */
export const deleteLead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new CRMError('User is not associated with an organization', 400);
    }

    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!lead) {
      throw new CRMError('Lead profile not found', 404);
    }

    await prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'Lead profile soft deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log a custom lead activity
 */
export const logActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new CRMError('User is not associated with an organization', 400);
    }

    const { id } = req.params;
    const { type, description } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!lead) {
      throw new CRMError('Lead profile not found', 404);
    }

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: id,
        type: type as ActivityType,
        description,
      },
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Import leads from raw CSV text body
 */
export const importCSV = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new CRMError('User is not associated with an organization', 400);
    }

    const { csvData } = req.body;
    if (!csvData) {
      throw new CRMError('No CSV content provided in request body', 400);
    }

    // Split rows
    const rows = csvData.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line.length > 0);
    if (rows.length < 2) {
      throw new CRMError('CSV requires a header line and at least one data line', 400);
    }

    // Clean headers: firstName, lastName, email, phone, budget, source, timeline, financingStatus, status, notes
    const headers = rows[0].split(',').map((h: string) => h.trim().replace(/^["']|["']$/g, ''));

    let successCount = 0;
    let duplicatesCount = 0;
    let errorsCount = 0;
    const logs: string[] = [];

    // Parse each line (skipping header)
    for (let i = 1; i < rows.length; i++) {
      try {
        const columns = rows[i].split(',').map((col: string) => col.trim().replace(/^["']|["']$/g, ''));
        const rowData: Record<string, string> = {};

        headers.forEach((header: string, index: number) => {
          rowData[header] = columns[index] || '';
        });

        const firstName = rowData.firstName;
        const lastName = rowData.lastName;

        if (!firstName || !lastName) {
          errorsCount++;
          logs.push(`Row ${i + 1}: Skipped - first name and last name are required.`);
          continue;
        }

        const email = rowData.email || null;
        const phone = rowData.phone || null;

        // Check duplicate
        const duplicateMessage = await checkDuplicate(orgId, email, phone);
        if (duplicateMessage) {
          duplicatesCount++;
          logs.push(`Row ${i + 1} (${firstName} ${lastName}): Duplicate - ${duplicateMessage}`);
          continue;
        }

        const budgetValue = rowData.budget ? parseFloat(rowData.budget) : null;

        await prisma.$transaction(async (tx) => {
          const importedLead = await tx.lead.create({
            data: {
              firstName,
              lastName,
              email,
              phone,
              budget: budgetValue ? new Prisma.Decimal(budgetValue) : null,
              source: rowData.source || 'CSV Import',
              timeline: rowData.timeline || null,
              financingStatus: rowData.financingStatus || null,
              status: (rowData.status as LeadStatus) || 'NEW',
              notes: rowData.notes || 'Imported via CSV template.',
              organizationId: orgId,
            },
          });

          await tx.leadActivity.create({
            data: {
              leadId: importedLead.id,
              type: 'STATUS_CHANGE',
              description: `Lead created via CSV import under status: ${importedLead.status}`,
            },
          });
        });

        successCount++;
      } catch (err) {
        errorsCount++;
        const errMsg = err instanceof Error ? err.message : 'Unknown execution error';
        logs.push(`Row ${i + 1}: Error - ${errMsg}`);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        successCount,
        duplicatesCount,
        errorsCount,
        logs,
      },
    });
  } catch (error) {
    next(error);
  }
};
