import prisma from '../config/database';
import { sendEmail } from './mailService';

export interface EmailDetails {
  subject: string;
  text: string;
  html: string;
}

class NotificationService {
  /**
   * Create an in-app notification and optionally send an email
   */
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    emailDetails?: EmailDetails,
  ): Promise<void> {
    try {
      // 1. Create in-app notification
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
        },
      });

      // 2. If email options are provided, query user details and send email
      if (emailDetails) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, status: true },
        });

        if (user && user.status === 'ACTIVE' && user.email) {
          await sendEmail({
            to: user.email,
            subject: emailDetails.subject,
            text: emailDetails.text,
            html: emailDetails.html,
          });
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[Notification Service] Failed to send notification:`, err);
    }
  }

  /**
   * Aggregate CRM pipeline metrics and send a daily summary email to all organization admins/managers
   */
  async sendDailySummary(orgId: string): Promise<void> {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      });

      if (!org) return;

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Aggregate stats
      const totalLeads = await prisma.lead.count({
        where: { organizationId: orgId, deletedAt: null },
      });

      const newLeads = await prisma.lead.count({
        where: { organizationId: orgId, createdAt: { gte: oneDayAgo }, deletedAt: null },
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

      // Fetch active admins and managers
      const adminUsers = await prisma.user.findMany({
        where: {
          organizationId: orgId,
          status: 'ACTIVE',
          role: { in: ['ADMIN', 'SALES_MANAGER'] },
          deletedAt: null,
        },
        select: { email: true, firstName: true, lastName: true },
      });

      if (adminUsers.length === 0) return;

      // Construct email content
      const subject = `PropX CRM - Daily Pipeline Summary for ${org.name}`;
      const text = `
Hello,

Here is your daily summary metrics for ${org.name}:

- Total CRM Inquiries: ${totalLeads}
- New Leads (Last 24h): ${newLeads}
- Qualified Leads: ${qualifiedLeads}
- AI Scored HOT Leads: ${hotLeads}

View your dashboard at http://localhost:5173 to manage inquiries and assign tasks.

Thank you,
PropX Automation Team
      `.trim();

      const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <h2 style="color: #6366f1; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">PropX CRM Daily Summary</h2>
  <p>Hello,</p>
  <p>Here is your daily summary report details for <strong>${org.name}</strong>:</p>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background-color: #f8fafc;">
      <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">Total CRM Inquiries</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #1e293b;">${totalLeads}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e2e8f0;">New Leads (Last 24h)</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #3b82f6; font-weight: bold;">+${newLeads}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 12px; border: 1px solid #e2e8f0;">Qualified Leads</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #8b5cf6; font-weight: bold;">${qualifiedLeads}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #ef4444;">AI Scored HOT Leads</td>
      <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; color: #ef4444; font-weight: bold;">${hotLeads}</td>
    </tr>
  </table>
  
  <p>Access your administrator portal to review recent activities:</p>
  <p style="text-align: center; margin: 25px 0;">
    <a href="http://localhost:5173/" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open Dashboard</a>
  </p>
  <p style="color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 20px;">
    This is an automated notification. Please do not reply directly to this email.
  </p>
</div>
      `.trim();

      // Dispatch to all admins
      for (const admin of adminUsers) {
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject,
            text,
            html,
          });
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[Notification Service] Failed to send daily summary:`, err);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
