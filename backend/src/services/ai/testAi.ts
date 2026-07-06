/* eslint-disable */
import prisma from '../../config/database';
import { aiService } from './aiService';
import { Prisma } from '@prisma/client';

async function runTest() {
  console.log('=== starting AI Module Integration Test ===');

  try {
    // 1. Create seed data for testing
    console.log('Seeding temporary test organization and lead...');
    const org = await prisma.organization.create({
      data: {
        name: 'AI Test Org',
        slug: `ai-test-org-${Date.now()}`,
      },
    });

    const project = await prisma.project.create({
      data: {
        name: 'Test Residencies',
        organizationId: org.id,
      },
    });

    const lead = await prisma.lead.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        organizationId: org.id,
        status: 'NEW',
      },
    });

    const conversation = await prisma.conversation.create({
      data: {
        leadId: lead.id,
        subject: 'Inquiry about 3 BHK Penthouse',
      },
    });

    // Add some message content that the AI should parse
    const messages = [
      {
        conversationId: conversation.id,
        senderType: 'LEAD',
        content: 'Hello, I am looking for a 3 BHK Penthouse. My budget is around ₹4,500,000.',
      },
      {
        conversationId: conversation.id,
        senderType: 'USER',
        content: 'Hi John, we have some premium penthouses matching your requirements. Are you pre-approved for a mortgage?',
      },
      {
        conversationId: conversation.id,
        senderType: 'LEAD',
        content: 'Yes, I am cash buyer actually. I can close the purchase within 1-2 months.',
      },
    ];

    for (const msg of messages) {
      await prisma.message.create({
        data: {
          conversationId: msg.conversationId,
          senderType: msg.senderType as any,
          content: msg.content,
        },
      });
    }

    console.log('Conversation and messages successfully seeded.');

    // 2. Fetch messages and construct transcript
    console.log('Constructing transcript...');
    const leadWithConversations = await prisma.lead.findFirst({
      where: { id: lead.id },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
      },
    });

    if (!leadWithConversations) {
      throw new Error('Failed to load created lead with conversations.');
    }

    let transcript = '';
    leadWithConversations.conversations.forEach((conv) => {
      if (conv.subject) {
        transcript += `Subject: ${conv.subject}\n`;
      }
      conv.messages.forEach((msg) => {
        const sender = msg.senderType === 'USER' ? 'Agent' : 'Client';
        transcript += `[${sender}]: ${msg.content}\n`;
      });
      transcript += '\n';
    });

    transcript = transcript.trim();
    console.log('\n--- Transcript ---');
    console.log(transcript);
    console.log('------------------\n');

    // 3. Run AI analysis (this will run using MockProvider by default since ANTHROPIC_API_KEY is not configured yet)
    console.log('Invoking AI Service analysis...');
    const analysis = await aiService.analyzeLeadConversations(transcript);
    console.log('AI Analysis Result:', JSON.stringify(analysis, null, 2));

    // 4. Save to database (Upsert)
    console.log('Storing structured data into PostgreSQL...');
    const budgetVal = analysis.budget ? new Prisma.Decimal(analysis.budget) : null;
    const insight = await prisma.aiInsight.upsert({
      where: { leadId: lead.id },
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
        leadId: lead.id,
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

    console.log('AI Insight successfully saved into database.');

    // 5. Query and verify persistence
    const savedInsight = await prisma.aiInsight.findUnique({
      where: { leadId: lead.id },
    });

    console.log('\n--- Retrieved from Database ---');
    console.log('Saved Insight ID:', savedInsight?.id);
    console.log('Lead ID:', savedInsight?.leadId);
    console.log('Budget:', savedInsight?.budget?.toString());
    console.log('Preferred Unit:', savedInsight?.preferredUnit);
    console.log('Timeline:', savedInsight?.timeline);
    console.log('Financing Status:', savedInsight?.financingStatus);
    console.log('Intent:', savedInsight?.intent);
    console.log('Lead Score:', savedInsight?.leadScore);
    console.log('Reasoning:', savedInsight?.reasoning);
    console.log('-------------------------------\n');

    // Clean up test data
    console.log('Cleaning up test data...');
    await prisma.aiInsight.delete({ where: { leadId: lead.id } });
    await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
    await prisma.conversation.delete({ where: { id: conversation.id } });
    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.project.delete({ where: { id: project.id } });
    await prisma.organization.delete({ where: { id: org.id } });
    console.log('Cleanup finished.');

    console.log('=== AI Module Integration Test: SUCCESS ===');
  } catch (error) {
    console.error('=== AI Module Integration Test: FAILED ===');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
