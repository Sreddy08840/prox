import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import cacheService from '../services/cacheService';
import { sendEmail } from '../services/mailService';

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
        { name: '< ₹5L', count: 0 },
        { name: '₹5L - ₹10L', count: 0 },
        { name: '₹10L - ₹25L', count: 0 },
        { name: '₹25L - ₹50L', count: 0 },
        { name: '₹50L+', count: 0 },
      ];

      leads.forEach((l) => {
        if (l.budget) {
          const val = parseFloat(l.budget.toString());
          if (val < 500000) {
            budgetBrackets[0].count++;
          } else if (val >= 500000 && val < 1000000) {
            budgetBrackets[1].count++;
          } else if (val >= 1000000 && val < 2500000) {
            budgetBrackets[2].count++;
          } else if (val >= 2500000 && val < 5000000) {
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

      // SLA alerts checking
      const alerts = {
        warning: averageResponseTimeMin > 30 || (totalLeads > 0 && conversionRate < 10),
        message: averageResponseTimeMin > 30 
          ? `SLA Breach: Average response time is ${averageResponseTimeMin} min (threshold: 30 min)` 
          : (totalLeads > 0 && conversionRate < 10) 
            ? `Performance Alert: Lead-to-WON conversion rate has dropped to ${conversionRate}% (threshold: 10%)`
            : null
      };

      return {
        kpis: {
          totalLeads,
          qualifiedLeads,
          hotLeads,
          conversionRate,
          responseTimeMin: averageResponseTimeMin,
        },
        alerts,
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

export const exportSummaryReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    const userEmail = req.user?.email;
    if (!orgId || !userEmail) {
      throw new DashboardError('User organization or email is missing', 400);
    }

    // Get current counts for report
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

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    });

    const subject = `PropX Weekly Summary CRM Report - ${org?.name || 'My Org'}`;
    const text = `
PropX Weekly CRM Pipeline Report Summary:
Organization: ${org?.name || 'N/A'}
Report Recipient: ${userEmail}
Generated At: ${new Date().toLocaleString()}

Pipeline Metrics Summary:
- Total Leads: ${totalLeads}
- Qualified Leads: ${qualifiedLeads}
- AI Scored HOT Leads: ${hotLeads}
- Closed/WON Deals: ${wonLeads}

Access your CRM Dashboard at http://localhost:5173 to review transcripts and assign agents.
    `.trim();

    const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px;">
  <h2 style="color: #6366f1; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">PropX CRM Summary Report</h2>
  <p>Hello,</p>
  <p>Here is your generated weekly summary CRM metrics report for <strong>${org?.name || 'your organization'}</strong>:</p>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Total Leads Ingested</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #1e293b;">${totalLeads}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e2e8f0;">Qualified Leads</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #8b5cf6; font-weight: bold;">${qualifiedLeads}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #ef4444;">AI-Scored HOT Leads</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #ef4444; font-weight: bold;">${hotLeads}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #10b981;">WON Deals</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #10b981; font-weight: bold;">${wonLeads}</td>
    </tr>
  </table>
  
  <p>You can download the full details or export to a CSV from the administrator portal at <a href="http://localhost:5173/">http://localhost:5173/</a>.</p>
</div>
    `.trim();

    await sendEmail({
      to: userEmail,
      subject,
      text,
      html,
    });

    res.status(200).json({
      success: true,
      message: `Weekly summary report successfully exported and emailed to ${userEmail}.`,
    });
  } catch (error) {
    next(error);
  }
};
