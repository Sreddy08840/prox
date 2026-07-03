import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../middlewares/auth';
import { aiService } from '../services/ai/aiService';

class ConversationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ConversationError.prototype);
  }
}

/**
 * Start a new conversation topic thread for a lead
 */
export const createConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new ConversationError('User organization context is missing', 400);
    }

    const { leadId } = req.params;
    const { subject } = req.body;

    if (!subject || subject.trim().length === 0) {
      throw new ConversationError('Subject topic title is required', 400);
    }

    // Verify lead ownership
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: orgId, deletedAt: null },
    });

    if (!lead) {
      throw new ConversationError('Lead profile not found', 404);
    }

    const conversation = await prisma.conversation.create({
      data: {
        leadId,
        subject: subject.trim(),
      },
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List conversations for a lead (supports search & pagination)
 */
export const getConversations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new ConversationError('User organization context is missing', 400);
    }

    const { leadId } = req.params;
    const { search } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Verify lead
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: orgId, deletedAt: null },
    });

    if (!lead) {
      throw new ConversationError('Lead profile not found', 404);
    }

    // Formulate search filters matching subject or summary
    const whereClause: {
      leadId: string;
      OR?: Array<{
        subject?: { contains: string; mode: 'default' | 'insensitive' };
        summary?: { contains: string; mode: 'default' | 'insensitive' };
      }>;
    } = {
      leadId,
    };

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.conversation.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        conversations,
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
 * Retrieve messages inside a single conversation topic thread
 */
export const getConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new ConversationError('User organization context is missing', 400);
    }

    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        lead: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!conversation || conversation.lead.organizationId !== orgId || conversation.lead.deletedAt !== null) {
      throw new ConversationError('Conversation thread not found', 404);
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Post a message inside a conversation thread
 */
export const postMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    const userId = req.user?.id;
    if (!orgId || !userId) {
      throw new ConversationError('User authorization context is invalid', 401);
    }

    const { id } = req.params;
    const { content, senderType, attachments } = req.body;

    if (!content || content.trim().length === 0) {
      throw new ConversationError('Message content is required', 400);
    }

    if (!['USER', 'LEAD', 'AI'].includes(senderType)) {
      throw new ConversationError('Invalid sender type context', 400);
    }

    // Verify conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!conversation || conversation.lead.organizationId !== orgId || conversation.lead.deletedAt !== null) {
      throw new ConversationError('Conversation thread not found', 404);
    }

    // Prepare sender fields
    const senderId = senderType === 'USER' ? userId : null;

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderType,
        senderId,
        content: content.trim(),
        attachments: attachments || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Touch conversation updated timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Summarize a conversation using the AI summarizer
 */
export const summarizeConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      throw new ConversationError('User organization context is missing', 400);
    }

    const { id } = req.params;

    // Verify conversation ownership and retrieve messages
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        lead: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation || conversation.lead.organizationId !== orgId || conversation.lead.deletedAt !== null) {
      throw new ConversationError('Conversation thread not found', 404);
    }

    if (conversation.messages.length === 0) {
      throw new ConversationError('Cannot generate summary for an empty conversation thread.', 400);
    }

    // Structure transcript text
    let transcript = '';
    conversation.messages.forEach((msg) => {
      let role = 'Agent';
      if (msg.senderType === 'LEAD') role = 'Customer';
      if (msg.senderType === 'AI') role = 'AI Responder';

      transcript += `[${role}]: ${msg.content}\n`;
    });

    // Invoke AI Service Summarization
    const summaryText = await aiService.summarizeConversation(transcript.trim());

    // Save summary text back to database
    const updated = await prisma.conversation.update({
      where: { id },
      data: { summary: summaryText.trim() },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
