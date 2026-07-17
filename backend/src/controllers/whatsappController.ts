import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { whatsappService } from '../services/whatsappService';
import { aiService } from '../services/ai/aiService';
import { notificationService } from '../services/notificationService';


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

class WebhookDeduplicator {
  private static processedIds = new Set<string>();

  public static isDuplicate(messageId: string): boolean {
    if (this.processedIds.has(messageId)) {
      return true;
    }
    this.processedIds.add(messageId);
    if (this.processedIds.size > 1000) {
      const firstKey = this.processedIds.values().next().value;
      if (firstKey !== undefined) {
        this.processedIds.delete(firstKey);
      }
    }
    return false;
  }
}

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
        const messageId = msg.id;

        // Webhook message deduplication check
        if (messageId && WebhookDeduplicator.isDuplicate(messageId)) {
          logger.info(`[WhatsApp Webhook] Duplicate message ID ${messageId} ignored.`);
          res.status(200).json({ success: true, message: 'Duplicate ignored' });
          return;
        }

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

          // 4. Human Handoff Check & Outbound triggers
          const handoffKeywords = ['human', 'agent', 'help', 'support', 'person', 'talk to agent', 'representative'];
          const wantsHandoff = handoffKeywords.some(keyword => content.toLowerCase().includes(keyword));

          if (wantsHandoff && !lead.isHandedOver) {
            await prisma.lead.update({
              where: { id: lead.id },
              data: { isHandedOver: true },
            });
            lead.isHandedOver = true;

            await prisma.leadActivity.create({
              data: {
                leadId: lead.id,
                type: 'NOTE',
                description: 'Buyer requested human agent assistance. AI automated responses paused.',
              },
            });

            // Notify assigned agent or organization admins
            const notifyUserId = lead.assignedUserId;
            if (notifyUserId) {
              await notificationService.sendNotification(
                notifyUserId,
                'Human Handoff Request',
                `Lead ${lead.firstName} ${lead.lastName} has requested a human agent on WhatsApp.`,
                {
                  subject: `PropX CRM - Handoff Request: ${lead.firstName} ${lead.lastName}`,
                  text: `Hello, the lead ${lead.firstName} ${lead.lastName} has requested human assistance.`,
                  html: `<p>Hello,</p><p>Lead <strong>${lead.firstName} ${lead.lastName}</strong> has requested to speak with a human agent on WhatsApp.</p><p>Please take over the conversation.</p>`,
                }
              );
            } else {
              // Notify organization administrators/managers
              const managers = await prisma.user.findMany({
                where: {
                  organizationId: defaultOrg.id,
                  status: 'ACTIVE',
                  role: { in: ['ADMIN', 'SALES_MANAGER'] },
                  deletedAt: null,
                },
                select: { id: true },
              });
              for (const manager of managers) {
                await notificationService.sendNotification(
                  manager.id,
                  'Unassigned Handoff Request',
                  `Unassigned Lead ${lead.firstName} ${lead.lastName} has requested a human agent on WhatsApp.`,
                  {
                    subject: `PropX CRM - Unassigned Handoff: ${lead.firstName} ${lead.lastName}`,
                    text: `Hello, the lead ${lead.firstName} ${lead.lastName} requested human assistance.`,
                    html: `<p>Hello,</p><p>An unassigned lead <strong>${lead.firstName} ${lead.lastName}</strong> has requested to speak with a human agent on WhatsApp.</p>`,
                  }
                );
              }
            }
          }

          // Trigger AI qualification only if not handed over
          if (!lead.isHandedOver) {
            qualifyLeadAutomatically(lead.id);
          }
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

    // Toggle human handoff takeover on outbound manual agent messages
    if (!lead.isHandedOver) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { isHandedOver: true },
      });
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'NOTE',
          description: `Sales Agent took over the chat manually. AI automated replies paused.`,
        },
      });
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

/**
 * Simulate Sandbox WhatsApp message for testing AI qualification
 */
export const simulateSandbox = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { phone, content, contactName } = req.body;
    if (!phone || !content) {
      throw new WhatsAppControllerError('phone and content are required sandbox parameters.', 400);
    }

    const defaultOrg = await prisma.organization.findFirst();
    if (!defaultOrg) {
      throw new WhatsAppControllerError('No registered organization exists to connect sandbox lead.', 500);
    }

    // 1. Connect or auto-create Lead by phone number
    let lead = await prisma.lead.findFirst({
      where: {
        organizationId: defaultOrg.id,
        phone,
        deletedAt: null,
      },
    });

    if (!lead) {
      const nameParts = (contactName || 'Sandbox Contact').trim().split(/\s+/);
      const firstName = nameParts[0] || 'Sandbox';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      lead = await prisma.lead.create({
        data: {
          firstName,
          lastName,
          phone,
          source: 'WhatsApp Sandbox',
          organizationId: defaultOrg.id,
        },
      });

      // Log activity
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'STATUS_CHANGE',
          description: 'Sandbox lead registered automatically.',
        },
      });
    }

    // 2. Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { leadId: lead.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          leadId: lead.id,
          subject: `Sandbox Chat with ${lead.firstName} ${lead.lastName}`,
        },
      });
    }

    // 3. Store message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'LEAD',
        content,
      },
    });

    // 4. Check for human handoff trigger
    const handoffKeywords = ['human', 'agent', 'help', 'support', 'person', 'talk to agent', 'representative'];
    const wantsHandoff = handoffKeywords.some(keyword => content.toLowerCase().includes(keyword));

    if (wantsHandoff && !lead.isHandedOver) {
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: { isHandedOver: true },
      });
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'NOTE',
          description: 'Buyer requested human agent assistance. Sandbox AI automated replies paused.',
        },
      });
    }

    // 5. Trigger AI qualification (await this in sandbox to return live results to screen!)
    let insight = null;
    let autoReplyMessage = null;
    if (!lead.isHandedOver) {
      insight = await aiService.qualifyLeadAndSave(lead.id);
      
      // Let's generate a simulated auto reply for the sandbox chat window!
      autoReplyMessage = `Hello ${lead.firstName}, thank you for your query. We have logged your interest in our layout configurations. A sales agent will contact you shortly.`;
      
      // Save auto reply to messages
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'AI',
          content: autoReplyMessage,
        },
      });
    }

    // Fetch conversation messages
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: {
        lead,
        insight,
        autoReplyMessage,
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};
