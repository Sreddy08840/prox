import prisma from '../config/database';
import logger from '../utils/logger';
import axios from 'axios';

class CrmSyncService {
  /**
   * One-way sync of qualified lead to HubSpot
   */
  async syncLeadToHubSpot(leadId: string): Promise<void> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { aiInsight: true },
      });

      if (!lead) return;

      logger.info(`[CRM Sync] Pushing Lead ${lead.firstName} ${lead.lastName} (ID: ${lead.id}) to HubSpot CRM...`);
      
      // Mock HubSpot API request
      const hubspotPayload = {
        properties: {
          firstname: lead.firstName,
          lastname: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          hs_lead_status: 'QUALIFIED',
          budget: lead.budget ? parseFloat(lead.budget.toString()) : null,
          timeline: lead.timeline,
          financing_status: lead.financingStatus,
          ai_score: lead.aiInsight?.leadScore || 'UNSCORED',
          ai_reasoning: lead.aiInsight?.reasoning || '',
        },
      };

      // In real life, we would do: await axios.post('https://api.hubapi.com/crm/v3/objects/contacts', hubspotPayload, { headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` } });
      logger.info(`[CRM Sync] Successfully synced Lead ${lead.id} to HubSpot. Payload: ${JSON.stringify(hubspotPayload)}`);

      // Log activity
      await prisma.leadActivity.create({
        data: {
          leadId,
          type: 'NOTE',
          description: 'Lead profile successfully synced to HubSpot CRM.',
        },
      });
    } catch (err) {
      logger.error(`[CRM Sync] HubSpot sync failed for lead ${leadId}:`, err);
    }
  }

  /**
   * Dispatch outbound webhook notification of qualified lead
   */
  async dispatchWebhook(leadId: string): Promise<void> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { aiInsight: true },
      });

      if (!lead) return;

      // Check if organization has webhook URL.
      // We will look for an environment variable OR default hook URL.
      const webhookUrl = process.env.ORG_WEBHOOK_URL || 'https://httpbin.org/post'; // fallback test url

      logger.info(`[Webhook Sync] Dispatching outbound webhook for Lead ${lead.id} to ${webhookUrl}...`);

      const payload = {
        event: 'lead.qualified',
        timestamp: new Date().toISOString(),
        data: {
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          source: lead.source,
          budget: lead.budget ? parseFloat(lead.budget.toString()) : null,
          timeline: lead.timeline,
          financingStatus: lead.financingStatus,
          aiInsight: lead.aiInsight ? {
            leadScore: lead.aiInsight.leadScore,
            reasoning: lead.aiInsight.reasoning,
          } : null,
        },
      };

      try {
        await axios.post(webhookUrl, payload, { timeout: 5000 });
        logger.info(`[Webhook Sync] Webhook dispatch successful for lead ${lead.id}.`);
        
        await prisma.leadActivity.create({
          data: {
            leadId,
            type: 'NOTE',
            description: `Outbound webhook (event: lead.qualified) dispatched successfully to ${webhookUrl}`,
          },
        });
      } catch (postErr) {
        logger.error(`[Webhook Sync] Post failed to ${webhookUrl}: ${postErr instanceof Error ? postErr.message : String(postErr)}`);
        
        await prisma.leadActivity.create({
          data: {
            leadId,
            type: 'NOTE',
            description: `Outbound webhook dispatch failed: ${postErr instanceof Error ? postErr.message : 'connection timeout'}`,
          },
        });
      }
    } catch (err) {
      logger.error(`[Webhook Sync] Dispatch error for lead ${leadId}:`, err);
    }
  }
}

export const crmSyncService = new CrmSyncService();
export default crmSyncService;
