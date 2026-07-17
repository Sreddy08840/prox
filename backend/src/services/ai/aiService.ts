import fs from 'fs';
import path from 'path';
import { AIProvider, AIAnalysisResult } from './aiProvider';
import { AnthropicProvider } from './anthropicProvider';
import { MockProvider } from './mockProvider';
import prisma from '../../config/database';
import { Prisma } from '@prisma/client';
import logger from '../../utils/logger';
import { crmSyncService } from '../crmSyncService';
import { routeLeadToAgent } from '../../utils/leadRouter';
import { sendEmail } from '../mailService';
import metrics from '../../utils/metrics';

class AIService {
  private provider: AIProvider;
  private promptPath: string;
  private summaryPromptPath: string;

  constructor() {
    this.promptPath = path.join(__dirname, '../../config/prompts/leadAnalysisPrompt.txt');
    this.summaryPromptPath = path.join(
      __dirname,
      '../../config/prompts/conversationSummaryPrompt.txt',
    );

    const selectedProvider = (process.env.AI_PROVIDER || '').toLowerCase();
    if (selectedProvider === 'anthropic') {
      this.provider = new AnthropicProvider();
    } else if (selectedProvider === 'mock') {
      this.provider = new MockProvider();
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.provider = new AnthropicProvider();
    } else {
      this.provider = new MockProvider();
    }
    logger.info(`[AI Service] Initialized with provider: ${this.provider.constructor.name}`);
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs = 15000): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI Request Timeout exceeded')), timeoutMs)
    );
    return Promise.race([fn(), timeoutPromise]);
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, task: string, retries = 2): Promise<T> {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const start = Date.now();
        const res = await fn();
        const duration = Date.now() - start;
        metrics.recordAiLatency(task, duration);
        return res;
      } catch (err) {
        attempt++;
        if (attempt > retries) throw err;
        logger.warn(`[AI Service] Attempt ${attempt} failed for task "${task}". Retrying... Error: ${err instanceof Error ? err.message : String(err)}`);
        await new Promise(res => setTimeout(res, 1000 * attempt)); // exponential backoff
      }
    }
    throw new Error('AI execution exceeded maximum retry limit.');
  }

  async analyzeLeadConversations(transcript: string): Promise<AIAnalysisResult> {
    try {
      const template = await fs.promises.readFile(this.promptPath, 'utf8');
      return await this.executeWithRetry(
        () => this.executeWithTimeout(() => this.provider.analyzeConversation(transcript, template)),
        'analyze_lead'
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`AI Service analysis failed: ${errMsg}`);
    }
  }

  async summarizeConversation(transcript: string): Promise<string> {
    try {
      const template = await fs.promises.readFile(this.summaryPromptPath, 'utf8');
      return await this.executeWithRetry(
        () => this.executeWithTimeout(() => this.provider.summarizeConversation(transcript, template)),
        'summarize_conversation'
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`AI Service summarization failed: ${errMsg}`);
    }
  }

  /**
   * Qualifies a lead automatically using conversations, updating DB scores and logging activities.
   */
  async qualifyLeadAndSave(leadId: string): Promise<unknown> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!lead) {
      throw new Error(`Lead profile not found: ${leadId}`);
    }

    let transcript = '';
    lead.conversations.forEach((conversation) => {
      if (conversation.subject) {
        transcript += `Subject: ${conversation.subject}\n`;
      }
      conversation.messages.forEach((msg) => {
        const sender = msg.senderType === 'USER' ? 'Agent' : 'Client';
        transcript += `[${sender}]: ${msg.content}\n`;
      });
      transcript += '\n';
    });

    transcript = transcript.trim();
    if (!transcript) {
      throw new Error('No conversation messages exist for this lead to analyze.');
    }

    const analysis = await this.analyzeLeadConversations(transcript);
    const budgetVal = analysis.budget ? new Prisma.Decimal(analysis.budget) : null;

    const insight = await prisma.aiInsight.upsert({
      where: { leadId },
      update: {
        budget: budgetVal,
        preferredUnit: analysis.preferredUnit,
        timeline: analysis.timeline,
        financingStatus: analysis.financingStatus,
        intent: analysis.intent,
        leadScore: analysis.leadScore,
        reasoning: analysis.reasoning,
        rawResponse: analysis.rawResponse || null,
      },
      create: {
        leadId,
        budget: budgetVal,
        preferredUnit: analysis.preferredUnit,
        timeline: analysis.timeline,
        financingStatus: analysis.financingStatus,
        intent: analysis.intent,
        leadScore: analysis.leadScore,
        reasoning: analysis.reasoning,
        rawResponse: analysis.rawResponse || null,
      },
    });

    // Also update lead fields in database if empty. Auto-qualify lead if score is HOT or WARM.
    const isHotOrWarm = analysis.leadScore === 'HOT' || analysis.leadScore === 'WARM';
    const shouldQualify = isHotOrWarm && lead.status === 'NEW';

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        budget: lead.budget ? undefined : budgetVal || undefined,
        timeline: lead.timeline ? undefined : analysis.timeline || undefined,
        financingStatus: lead.financingStatus ? undefined : analysis.financingStatus || undefined,
        status: shouldQualify ? 'QUALIFIED' : undefined,
      },
    });

    // Log audit action
    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'NOTE',
        description: `AI Analysis executed. Generated Lead Score: ${analysis.leadScore}. Reasoning: ${analysis.reasoning.slice(0, 100)}...`,
      },
    });

    if (shouldQualify) {
      await prisma.leadActivity.create({
        data: {
          leadId,
          type: 'STATUS_CHANGE',
          description: `Lead status automatically upgraded to QUALIFIED based on AI score: ${analysis.leadScore}`,
        },
      });

      // Auto-route to agent
      if (!updatedLead.assignedUserId) {
        await routeLeadToAgent(leadId);
      }

      // CRM sync and webhook dispatch
      await crmSyncService.syncLeadToHubSpot(leadId);
      await crmSyncService.dispatchWebhook(leadId);

      // Automated PDF brochure email delivery
      if (updatedLead.email && analysis.preferredUnit) {
        const matchLayout = await prisma.unitType.findFirst({
          where: {
            organizationId: updatedLead.organizationId,
            name: { contains: analysis.preferredUnit.split(' ')[0], mode: 'insensitive' },
            brochureUrl: { not: null },
            deletedAt: null,
          },
          select: { name: true, brochureUrl: true },
        });

        if (matchLayout && matchLayout.brochureUrl) {
          try {
            await sendEmail({
              to: updatedLead.email,
              subject: `PropX CRM - Brochure & Details for ${matchLayout.name}`,
              text: `Hello ${updatedLead.firstName},\n\nWe have automatically qualified your interest in ${matchLayout.name}!\nHere is the link to download the project brochure:\n${matchLayout.brochureUrl}\n\nBest regards,\nPropX Team`,
              html: `<p>Hello <strong>${updatedLead.firstName}</strong>,</p><p>We have automatically qualified your interest in <strong>${matchLayout.name}</strong>!</p><p>You can download the brochure with details and plans at the link below:</p><p><a href="${matchLayout.brochureUrl}" style="background:#6366f1;color:white;padding:10px 15px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Download Brochure PDF</a></p><p>Best regards,<br/>PropX Team</p>`,
            });

            await prisma.leadActivity.create({
              data: {
                leadId,
                type: 'EMAIL',
                description: `Automatically emailed brochure for "${matchLayout.name}" to ${updatedLead.email}`,
              },
            });
          } catch (_err) {
            // Suppress mail failures to prevent interrupting transaction
          }
        }
      }
    }

    return insight;
  }

  /**
   * Generate an AI Negotiation Co-Pilot drafted message for objections
   */
  public async generateNegotiationDraft(leadId: string): Promise<string> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!lead || lead.deletedAt) {
      throw new Error('Lead profile not found.');
    }

    const conversation = lead.conversations[0];
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return `Hello ${lead.firstName}, I see you are interested in our project layouts. How can I help you proceed with site visits or financing details?`;
    }

    // Build chat transcript string
    const transcriptText = conversation.messages
      .map((m) => `${m.senderType === 'LEAD' ? 'Customer' : 'Agent'}: ${m.content}`)
      .join('\n');

    // Load prompt template
    const promptPath = path.join(__dirname, '../../config/prompts/objectionHandlingPrompt.txt');
    const promptTemplate = fs.readFileSync(promptPath, 'utf8');
    const systemPrompt = promptTemplate.replace('{transcript}', transcriptText);

    // Call provider
    const response = await this.executeWithRetry(
      () => this.executeWithTimeout(() => this.provider.generateDraft(transcriptText, systemPrompt)),
      'negotiation_draft'
    );
    return response.trim();
  }
}

export const aiService = new AIService();
export { AIAnalysisResult };

