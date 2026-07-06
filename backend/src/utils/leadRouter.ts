import prisma from '../config/database';
import notificationService from '../services/notificationService';
import logger from './logger';

/**
 * Automatically routes a qualified/hot/warm lead to an active sales agent based on workload rules.
 */
export async function routeLeadToAgent(leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        organizationId: true,
        assignedUserId: true,
      },
    });

    if (!lead) {
      logger.error(`[Lead Router] Lead ${leadId} not found for auto-routing.`);
      return;
    }

    // If already assigned, do not overwrite
    if (lead.assignedUserId) {
      logger.info(`[Lead Router] Lead ${lead.firstName} ${lead.lastName} is already assigned to user ${lead.assignedUserId}.`);
      return;
    }

    // Find active agents/managers in organization
    const activeAgents = await prisma.user.findMany({
      where: {
        organizationId: lead.organizationId,
        status: 'ACTIVE',
        role: { in: ['SALES_AGENT', 'SALES_MANAGER'] },
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (activeAgents.length === 0) {
      logger.warn(`[Lead Router] No active sales agents or managers found in org ${lead.organizationId} to assign lead.`);
      return;
    }

    // Workload computation: Count active leads (not WON, LOST) assigned to each agent
    const agentWorkloads = await Promise.all(
      activeAgents.map(async (agent) => {
        const count = await prisma.lead.count({
          where: {
            assignedUserId: agent.id,
            organizationId: lead.organizationId,
            deletedAt: null,
            status: { notIn: ['WON', 'LOST'] },
          },
        });
        return { agent, count };
      })
    );

    // Sort by lead count ascending (least workload first)
    agentWorkloads.sort((a, b) => a.count - b.count);
    const assignedAgent = agentWorkloads[0].agent;

    // Update lead with assigned agent
    await prisma.lead.update({
      where: { id: lead.id },
      data: { assignedUserId: assignedAgent.id },
    });

    logger.info(`[Lead Router] Routed lead ${lead.firstName} ${lead.lastName} to agent ${assignedAgent.firstName} ${assignedAgent.lastName} (Workload: ${agentWorkloads[0].count} active leads).`);

    // Log reassignment activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'STATUS_CHANGE',
        description: `Lead auto-routed to agent ${assignedAgent.firstName} ${assignedAgent.lastName} based on workload limits.`,
      },
    });

    // Notify agent (email & in-app)
    await notificationService.sendNotification(
      assignedAgent.id,
      'New Lead Auto-Routed',
      `Lead ${lead.firstName} ${lead.lastName} has been qualified and routed to you.`,
      {
        subject: `PropX CRM - Lead Auto-Routed: ${lead.firstName} ${lead.lastName}`,
        text: `Hello ${assignedAgent.firstName}, a qualified lead has been routed to you: ${lead.firstName} ${lead.lastName}.`,
        html: `<p>Hello ${assignedAgent.firstName},</p><p>A qualified lead has been auto-routed to you: <strong>${lead.firstName} ${lead.lastName}</strong>.</p><p>Please review and follow up immediately.</p>`,
      }
    );
  } catch (error) {
    logger.error(`[Lead Router] Auto-routing error for lead ${leadId}:`, error);
  }
}
