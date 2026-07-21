import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { LeadStatus, ActivityType, Prisma, Lead } from '@prisma/client';
import notificationService from '../services/notificationService';
import { routeLeadToAgent } from '../utils/leadRouter';
import { crmSyncService } from '../services/crmSyncService';

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
async function getExistingDuplicate(
  orgId: string,
  email?: string | null,
  phone?: string | null,
): Promise<Lead | null> {
  if (!email && !phone) return null;

  const conditions: Prisma.LeadWhereInput[] = [];
  if (email) conditions.push({ email });
  if (phone) conditions.push({ phone });

  return await prisma.lead.findFirst({
    where: {
      organizationId: orgId,
      deletedAt: null,
      OR: conditions,
    },
  });
}

/**
 * Helper to merge duplicate lead data
 */
async function mergeLead(
  existingLeadId: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    status?: LeadStatus;
    source?: string | null;
    budget?: number | null;
    timeline?: string | null;
    financingStatus?: string | null;
    notes?: string | null;
    assignedUserId?: string | null;
    preferredUnitId?: string | null;
  },
  tx?: Prisma.TransactionClient
): Promise<Lead | null> {
  const db = tx || prisma;

  const currentLead = await db.lead.findUnique({
    where: { id: existingLeadId }
  });

  if (!currentLead) return null;

  let mergedNotes = currentLead.notes || '';
  if (data.notes) {
    mergedNotes += (mergedNotes ? '\n' : '') + `[Merged on ${new Date().toLocaleDateString()}] ${data.notes}`;
  }

  const budgetVal = data.budget !== undefined && data.budget !== null ? new Prisma.Decimal(data.budget) : currentLead.budget;

  const updatedLead = await db.lead.update({
    where: { id: existingLeadId },
    data: {
      firstName: data.firstName || currentLead.firstName,
      lastName: data.lastName || currentLead.lastName,
      email: data.email || currentLead.email,
      phone: data.phone || currentLead.phone,
      status: data.status || currentLead.status,
      source: data.source || currentLead.source || 'Merged',
      budget: budgetVal,
      timeline: data.timeline || currentLead.timeline,
      financingStatus: data.financingStatus || currentLead.financingStatus,
      notes: mergedNotes || null,
      assignedUserId: data.assignedUserId || currentLead.assignedUserId,
      preferredUnitId: data.preferredUnitId || currentLead.preferredUnitId,
    },
  });

  // Log activity
  await db.leadActivity.create({
    data: {
      leadId: existingLeadId,
      type: 'NOTE',
      description: `Duplicate lead detected. Details merged automatically. Source channel: ${data.source || 'Unknown'}.`,
    },
  });

  // Trigger auto-routing if status becomes qualified
  if (updatedLead.status === 'QUALIFIED' && !updatedLead.assignedUserId) {
    await routeLeadToAgent(updatedLead.id);
  }

  // Trigger CRM push
  if (updatedLead.status === 'QUALIFIED') {
    await crmSyncService.syncLeadToHubSpot(updatedLead.id);
    await crmSyncService.dispatchWebhook(updatedLead.id);
  }

  return updatedLead;
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
    const existingDuplicate = await getExistingDuplicate(orgId, email, phone);
    if (existingDuplicate) {
      const mergedLead = await mergeLead(existingDuplicate.id, {
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
      });
      res.status(200).json({
        success: true,
        data: mergedLead,
      });
      return;
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
        aiInsight: {
          select: {
            id: true,
            leadScore: true,
            reasoning: true,
            preferredUnit: true,
            budget: true,
            timeline: true,
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
      const existing = await getExistingDuplicate(orgId, email, null);
      if (existing && existing.id !== id) {
        throw new CRMError(`A lead with email "${email}" already exists in the organization.`, 400);
      }
    }
    if (phone && phone !== lead.phone) {
      const existing = await getExistingDuplicate(orgId, null, phone);
      if (existing && existing.id !== id) {
        throw new CRMError(`A lead with phone "${phone}" already exists in the organization.`, 400);
      }
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

    // Trigger auto-routing if status becomes qualified and not assigned
    if (updated.status === 'QUALIFIED' && !updated.assignedUserId) {
      await routeLeadToAgent(updated.id);
    }

    // Trigger CRM push if status was changed to QUALIFIED
    if (updated.status === 'QUALIFIED' && status && status !== lead.status) {
      await crmSyncService.syncLeadToHubSpot(updated.id);
      await crmSyncService.dispatchWebhook(updated.id);
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
        const existingDuplicate = await getExistingDuplicate(orgId, email, phone);
        if (existingDuplicate) {
          await mergeLead(existingDuplicate.id, {
            firstName,
            lastName,
            email,
            phone,
            status: (rowData.status as LeadStatus) || undefined,
            source: rowData.source || 'CSV Import',
            budget: rowData.budget ? parseFloat(rowData.budget) : null,
            timeline: rowData.timeline || null,
            financingStatus: rowData.financingStatus || null,
            notes: rowData.notes || 'Merged during CSV Import',
          });
          duplicatesCount++;
          logs.push(`Row ${i + 1} (${firstName} ${lastName}): Duplicate - Details merged.`);
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

/**
 * Create a public lead (web contact form ingestion)
 */
export const createPublicLead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, projectId, source, notes } = req.body;

    if (!firstName || !lastName || !projectId) {
      throw new CRMError('First name, last name, and projectId are required.', 400);
    }

    // Find the project and its organization
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: { organizationId: true },
    });

    if (!project) {
      throw new CRMError('Project not found.', 404);
    }

    const orgId = project.organizationId;

    // Check duplicate
    const existingDuplicate = await getExistingDuplicate(orgId, email, phone);
    if (existingDuplicate) {
      const mergedLead = await mergeLead(existingDuplicate.id, {
        firstName,
        lastName,
        email,
        phone,
        source: source || 'Web Form',
        notes: notes || 'Submitted via public contact form.',
      });
      res.status(200).json({
        success: true,
        data: mergedLead,
      });
      return;
    }

    // Create lead in transaction
    const lead = await prisma.$transaction(async (tx) => {
      const newLead = await tx.lead.create({
        data: {
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
          status: 'NEW',
          source: source || 'Web Form',
          notes: notes || 'Submitted via public contact form.',
          organizationId: orgId,
        },
      });

      // Log initial creation activity
      await tx.leadActivity.create({
        data: {
          leadId: newLead.id,
          type: 'STATUS_CHANGE',
          description: `Lead ingested automatically via public web form.`,
        },
      });

      return newLead;
    });

    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule Site Visit & Generate Calendar Sync Links (Google & iCal)
 */
export const scheduleSiteVisit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { visitDate, notes, location } = req.body;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!lead) {
      throw new CRMError('Lead not found', 404);
    }

    const startDate = visitDate ? new Date(visitDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    const formattedStart = startDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const formattedEnd = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const eventTitle = encodeURIComponent(`PropX Site Visit: ${lead.firstName} ${lead.lastName}`);
    const eventDetails = encodeURIComponent(`Property Site Visit scheduled for ${lead.firstName} ${lead.lastName}.\nPhone: ${lead.phone || 'N/A'}\nNotes: ${notes || 'Site visit consultation.'}`);
    const eventLocation = encodeURIComponent(location || lead.organization?.name || 'PropX Real Estate Site');

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${formattedStart}/${formattedEnd}&details=${eventDetails}&location=${eventLocation}`;

    // Create lead activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'MEETING',
        description: `Site Visit Scheduled for ${startDate.toLocaleString()}. Google Calendar Sync: ${googleCalendarUrl}`,
      },
    });

    // Update lead status to QUALIFIED
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'QUALIFIED' },
    });

    res.status(200).json({
      success: true,
      message: 'Site visit scheduled and calendar sync links generated successfully.',
      data: {
        visitDate: startDate.toISOString(),
        googleCalendarUrl,
        icsUrl: `/api/v1/leads/${lead.id}/site-visit/ics?date=${encodeURIComponent(startDate.toISOString())}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate iCal (.ics) file stream for Site Visit
 */
export const getSiteVisitIcs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const visitDateParam = req.query.date as string;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!lead) {
      throw new CRMError('Lead not found', 404);
    }

    const startDate = visitDateParam ? new Date(visitDateParam) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PropX Real Estate Platform//Site Visit Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:site-visit-${lead.id}-${startDate.getTime()}@propx.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:PropX Site Visit: ${lead.firstName} ${lead.lastName}`,
      `DESCRIPTION:Property Site Visit scheduled for ${lead.firstName} ${lead.lastName}. Phone: ${lead.phone || 'N/A'}`,
      `LOCATION:${lead.organization?.name || 'PropX Site Office'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="site-visit-${lead.firstName}.ics"`);
    res.send(icsContent);
  } catch (error) {
    next(error);
  }
};
