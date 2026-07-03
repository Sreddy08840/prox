import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import cacheService from '../services/cacheService';

class DashboardError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, DashboardError.prototype);
  }
}

/**
 * Get organization dashboard metrics and chart data
 */
export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new DashboardError('User is not associated with an organization', 400);
    }

    const cacheKey = `dashboard_stats_${orgId}`;
    const statsData = await cacheService.getOrSet(cacheKey, 60000, async () => {
      // 1. KPI Counts
      const totalLeads = await prisma.lead.count({
        where: { organizationId: orgId, deletedAt: null },
      });

      const qualifiedLeads = await prisma.lead.count({
        where: { organizationId: orgId, status: 'QUALIFIED', deletedAt: null },
      });

      const hotLeads = await prisma.lead.count({
        where: {
          organizationId: orgId,
          deletedAt: null,
          aiInsight: {
            leadScore: 'HOT',
          },
        },
      });

      const wonLeads = await prisma.lead.count({
        where: { organizationId: orgId, status: 'WON', deletedAt: null },
      });

      const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

      // 2. Average Response Time calculation
      // Look for consecutive messages: LEAD followed by USER
      let averageResponseTimeMin = 14.5; // Benchmark fallback

      const conversations = await prisma.conversation.findMany({
        where: { lead: { organizationId: orgId, deletedAt: null } },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      let totalDiffMs = 0;
      let countPairs = 0;

      conversations.forEach((conv) => {
        const msgs = conv.messages;
        for (let i = 0; i < msgs.length - 1; i++) {
          const current = msgs[i];
          const nextMsg = msgs[i + 1];
          if (current.senderType === 'LEAD' && nextMsg.senderType === 'USER') {
            const diff = nextMsg.createdAt.getTime() - current.createdAt.getTime();
            if (diff > 0) {
              totalDiffMs += diff;
              countPairs++;
            }
          }
        }
      });

      if (countPairs > 0) {
        averageResponseTimeMin = Math.round((totalDiffMs / countPairs / 1000 / 60) * 10) / 10;
      }

      // 3. Lead Trend (Last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const leadsForTrend = await prisma.lead.findMany({
        where: {
          organizationId: orgId,
          deletedAt: null,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      // Populate trend array
      const trendMap = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        trendMap.set(dateStr, 0);
      }

      leadsForTrend.forEach((l) => {
        const dateStr = l.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (trendMap.has(dateStr)) {
          trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
        }
      });

      const leadTrend = Array.from(trendMap.entries()).map(([date, count]) => ({
        date,
        leads: count,
      }));

      // 4. Lead Funnel (Pipeline Stages)
      const funnelStages = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST'];
      const funnelCounts = await prisma.lead.groupBy({
        by: ['status'],
        where: { organizationId: orgId, deletedAt: null },
        _count: { _all: true },
      });

      const leadFunnel = funnelStages.map((stage) => {
        const found = funnelCounts.find((f) => f.status === stage);
        return {
          stage,
          count: found ? found._count._all : 0,
        };
      });

      // 5. Lead Sources
      const sourceCounts = await prisma.lead.groupBy({
        by: ['source'],
        where: { organizationId: orgId, deletedAt: null },
        _count: { _all: true },
      });

      const leadSources = sourceCounts.map((s) => ({
        source: s.source || 'Website',
        count: s._count._all,
      }));

      if (leadSources.length === 0) {
        leadSources.push({ source: 'Website', count: 0 });
      }

      // 6. Demand Heatmap (Budget Distribution Brackets)
      const leads = await prisma.lead.findMany({
        where: { organizationId: orgId, deletedAt: null },
        select: { budget: true },
      });

      const budgetBrackets = [
        { name: '< $100k', count: 0 },
        { name: '$100k - $250k', count: 0 },
        { name: '$250k - $500k', count: 0 },
        { name: '$500k - $1M', count: 0 },
        { name: '$1M+', count: 0 },
      ];

      leads.forEach((l) => {
        if (l.budget) {
          const val = parseFloat(l.budget.toString());
          if (val < 100000) {
            budgetBrackets[0].count++;
          } else if (val >= 100000 && val < 250000) {
            budgetBrackets[1].count++;
          } else if (val >= 250000 && val < 500000) {
            budgetBrackets[2].count++;
          } else if (val >= 500000 && val < 1000000) {
            budgetBrackets[3].count++;
          } else {
            budgetBrackets[4].count++;
          }
        }
      });

      // 7. Recent Activity logs
      const recentActivities = await prisma.leadActivity.findMany({
        where: {
          lead: {
            organizationId: orgId,
            deletedAt: null,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return {
        kpis: {
          totalLeads,
          qualifiedLeads,
          hotLeads,
          conversionRate,
          responseTimeMin: averageResponseTimeMin,
        },
        leadTrend,
        leadFunnel,
        leadSources,
        demandHeatmap: budgetBrackets,
        recentActivities: recentActivities.map((act) => ({
          id: act.id,
          type: act.type,
          description: act.description,
          createdAt: act.createdAt,
          leadName: `${act.lead.firstName} ${act.lead.lastName}`,
          leadId: act.lead.id,
        })),
      };
    });

    res.status(200).json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    next(error);
  }
};
