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

  async analyzeLeadConversations(transcript: string): Promise<AIAnalysisResult> {
    try {
      const template = await fs.promises.readFile(this.promptPath, 'utf8');
      return await this.provider.analyzeConversation(transcript, template);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`AI Service analysis failed: ${errMsg}`);
    }
  }

  async summarizeConversation(transcript: string): Promise<string> {
    try {
      const template = await fs.promises.readFile(this.summaryPromptPath, 'utf8');
      return await this.provider.summarizeConversation(transcript, template);
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
    }

    return insight;
  }
}

export const aiService = new AIService();
export { AIAnalysisResult };

