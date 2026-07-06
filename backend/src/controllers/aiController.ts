import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { aiService } from '../services/ai/aiService';


class AIInsightError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AIInsightError.prototype);
  }
}

/**
 * Trigger AI conversation analysis for a lead
 */
export const analyzeLead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new AIInsightError('User is not associated with an organization', 400);
    }

    const { leadId } = req.params;

    // Verify lead belongs to organization
    const leadExists = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: orgId, deletedAt: null },
    });

    if (!leadExists) {
      throw new AIInsightError('Lead profile not found', 404);
    }

    const insight = await aiService.qualifyLeadAndSave(leadId);

    res.status(200).json({
      success: true,
      data: insight,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get AI analysis insight for a lead
 */
export const getLeadInsight = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new AIInsightError('User is not associated with an organization', 400);
    }

    const { leadId } = req.params;

    // Verify lead belongs to org
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: orgId, deletedAt: null },
    });

    if (!lead) {
      throw new AIInsightError('Lead profile not found', 404);
    }

    const insight = await prisma.aiInsight.findUnique({
      where: { leadId },
    });

    res.status(200).json({
      success: true,
      data: insight,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update/Override AI analysis insight for a lead (Sales Agent score override)
 */
export const updateLeadInsight = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new AIInsightError('User is not associated with an organization', 400);
    }

    const { leadId } = req.params;
    const { leadScore, reasoning, budget, preferredUnit, timeline, financingStatus } = req.body;

    // Verify lead belongs to org
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: orgId, deletedAt: null },
    });

    if (!lead) {
      throw new AIInsightError('Lead profile not found', 404);
    }

    const prismaClient = require('@prisma/client');
    const budgetVal = budget !== undefined && budget !== null ? new prismaClient.Prisma.Decimal(budget) : undefined;

    const insight = await prisma.aiInsight.upsert({
      where: { leadId },
      update: {
        leadScore: leadScore || undefined,
        reasoning: reasoning || undefined,
        budget: budgetVal,
        preferredUnit: preferredUnit || undefined,
        timeline: timeline || undefined,
        financingStatus: financingStatus || undefined,
      },
      create: {
        leadId,
        leadScore: leadScore || 'WARM',
        reasoning: reasoning || 'Manually overridden by agent.',
        budget: budgetVal || null,
        preferredUnit: preferredUnit || null,
        timeline: timeline || null,
        financingStatus: financingStatus || null,
      },
    });

    // Log override activity
    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'NOTE',
        description: `Agent manually overridden AI lead score to ${insight.leadScore}. Reason: ${reasoning || 'No reason provided'}`,
      },
    });

    res.status(200).json({
      success: true,
      data: insight,
    });
  } catch (error) {
    next(error);
  }
};
