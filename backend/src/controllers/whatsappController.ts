import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { whatsappService } from '../services/whatsappService';
import { aiService } from '../services/ai/aiService';


class WhatsAppControllerError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, WhatsAppControllerError.prototype);
  }
}

/**
 * Helper to qualify lead using AI conversation transcript
 */
import logger from '../utils/logger';

async function qualifyLeadAutomatically(leadId: string): Promise<void> {
  try {
    await aiService.qualifyLeadAndSave(leadId);
  } catch (err) {
    logger.error(`[WhatsApp Controller] Auto qualification error for lead ${leadId}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Verify WhatsApp webhook challange (GET request from Meta)
 */
export const verifyWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'propx_token';

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        // eslint-disable-next-line no-console
        console.log('[WhatsApp Webhook] Webhook challenge verified successfully.');
        res.status(200).send(challenge);
        return;
      }
    }

    res.sendStatus(403);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle incoming WhatsApp Webhook messages (POST request from Meta)
 */
export const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = req;

    // Check WhatsApp Webhook payload format
    if (body.object && body.entry?.[0]?.changes?.[0]?.value) {
      const value = body.entry[0].changes[0].value;

      if (value.messages && value.messages.length > 0) {
        const msg = value.messages[0];
        const from = msg.from; // Sender phone number
        const content = msg.text?.body;
        const contactName = value.contacts?.[0]?.profile?.name || 'WhatsApp Contact';

        if (content) {
          // Find target organization
          const defaultOrg = await prisma.organization.findFirst();
          if (!defaultOrg) {
            throw new WhatsAppControllerError('No registered organization exists to connect lead.', 500);
          }

          // 1. Connect or auto-create Lead by phone number
          let lead = await prisma.lead.findFirst({
            where: {
              organizationId: defaultOrg.id,
              phone: from,
              deletedAt: null,
            },
          });

          if (!lead) {
            // Split profile name
            const nameParts = contactName.trim().split(/\s+/);
            const firstName = nameParts[0] || 'WhatsApp';
            const lastName = nameParts.slice(1).join(' ') || 'Customer';

            lead = await prisma.lead.create({
              data: {
                firstName,
                lastName,
                phone: from,
                source: 'WhatsApp',
                organizationId: defaultOrg.id,
              },
            });

            // Log activity
            await prisma.leadActivity.create({
              data: {
                leadId: lead.id,
                type: 'STATUS_CHANGE',
                description: 'Lead registered automatically via WhatsApp message integration.',
              },
            });
          }

          // 2. Find or create active conversation thread
          let conversation = await prisma.conversation.findFirst({
            where: { leadId: lead.id },
            orderBy: { createdAt: 'desc' },
          });

          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                leadId: lead.id,
                subject: `WhatsApp Chat with ${lead.firstName} ${lead.lastName}`,
              },
            });
          }

          // 3. Store incoming message
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderType: 'LEAD',
              content,
            },
          });

          // 4. Trigger AI qualification asynchronously
          // Don't await this inside the webhook reply block to prevent timeouts
          qualifyLeadAutomatically(lead.id);
        }
      }
    }

    // Always reply 200 OK immediately to WhatsApp API to confirm receipt
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually send WhatsApp outbound message
 */
export const sendMessage = async (
  req: Request & { user?: { id: string } },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { leadId, content } = req.body;
    const agentId = req.user?.id;

    if (!leadId || !content) {
      throw new WhatsAppControllerError('leadId and content are required parameters.', 400);
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead || lead.deletedAt) {
      throw new WhatsAppControllerError('Lead profile not found.', 404);
    }

    if (!lead.phone) {
      throw new WhatsAppControllerError('Lead profile has no registered phone number to contact.', 400);
    }

    // 1. Dispatch through WhatsApp Business API
    const sent = await whatsappService.sendMessage(lead.phone, content);

    // 2. Store in conversation thread
    let conversation = await prisma.conversation.findFirst({
      where: { leadId: lead.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          leadId: lead.id,
          subject: `WhatsApp Chat with ${lead.firstName} ${lead.lastName}`,
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'USER',
        senderId: agentId || null,
        content,
      },
    });

    if (!sent) {
      // Message dispatch failed, let user know it failed but is logged in retry queue
      res.status(202).json({
        success: false,
        message: 'Message failed to send immediately but has been queued for background retries.',
        data: message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};
