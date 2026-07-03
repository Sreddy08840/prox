/* eslint-disable */
import prisma from '../../config/database';
import { aiService } from './aiService';

async function runConversationTest() {
  console.log('=== Starting Conversation Management Integration Test ===');

  try {
    // 1. Seed org and lead
    console.log('Seeding temporary test organization and lead...');
    const org = await prisma.organization.create({
      data: {
        name: 'Conv Test Org',
        slug: `conv-test-org-${Date.now()}`,
      },
    });

    const lead = await prisma.lead.create({
      data: {
        firstName: 'Alice',
        lastName: 'Smith',
        organizationId: org.id,
      },
    });

    // 2. Create multiple conversations
    console.log('Creating conversation threads...');
    const conv1 = await prisma.conversation.create({
      data: {
        leadId: lead.id,
        subject: 'Pricing and Budget Discussion',
      },
    });

    const conv2 = await prisma.conversation.create({
      data: {
        leadId: lead.id,
        subject: 'Site Layout and Location Visit',
      },
    });

    // 3. Post messages (USER, LEAD, AI, attachments)
    console.log('Posting messages into threads...');
    await prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderType: 'LEAD',
        content: 'Hi! Can you tell me the pricing plans for a 2 BHK apartment?',
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderType: 'USER',
        content: 'Sure Alice, we have options ranging from $250k to $350k. Here is the brochure.',
        attachments: [
          {
            name: 'propx_brochure_v1.pdf',
            size: 2048000,
            url: 'https://example.com/propx_brochure_v1.pdf',
          },
        ] as any,
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conv1.id,
        senderType: 'AI',
        content: '[Auto-responder]: Agent has been notified of your inquiry.',
      },
    });

    // 4. Test Search Filters in Database
    console.log('Testing search filters...');
    const searchResultSubject = await prisma.conversation.findMany({
      where: {
        leadId: lead.id,
        OR: [
          { subject: { contains: 'Pricing', mode: 'insensitive' } },
          { summary: { contains: 'Pricing', mode: 'insensitive' } },
        ],
      },
    });
    console.log(`Search result for "Pricing" found ${searchResultSubject.length} threads (Expected: 1).`);
    if (searchResultSubject.length !== 1 || searchResultSubject[0].id !== conv1.id) {
      throw new Error('Search filter by subject failed.');
    }

    const searchResultLocation = await prisma.conversation.findMany({
      where: {
        leadId: lead.id,
        OR: [
          { subject: { contains: 'Location', mode: 'insensitive' } },
          { summary: { contains: 'Location', mode: 'insensitive' } },
        ],
      },
    });
    console.log(`Search result for "Location" found ${searchResultLocation.length} threads (Expected: 1).`);
    if (searchResultLocation.length !== 1 || searchResultLocation[0].id !== conv2.id) {
      throw new Error('Search filter by subject failed.');
    }

    // 5. Test AI Summaries
    console.log('Testing AI summarization...');
    const messages = await prisma.message.findMany({
      where: { conversationId: conv1.id },
      orderBy: { createdAt: 'asc' },
    });

    let transcript = '';
    messages.forEach((msg) => {
      let role = 'Agent';
      if (msg.senderType === 'LEAD') role = 'Customer';
      if (msg.senderType === 'AI') role = 'AI Responder';
      transcript += `[${role}]: ${msg.content}\n`;
    });

    console.log('Generating AI summary...');
    const summaryText = await aiService.summarizeConversation(transcript.trim());
    console.log('Generated Summary:', summaryText);

    // Save summary back to database
    const updatedConv = await prisma.conversation.update({
      where: { id: conv1.id },
      data: { summary: summaryText.trim() },
    });
    console.log('Conversation summary successfully saved to database.');

    // Verify search matches in summaries
    console.log('Testing search filters after summary save...');
    const searchResultSummary = await prisma.conversation.findMany({
      where: {
        leadId: lead.id,
        OR: [
          { subject: { contains: 'inquiries', mode: 'insensitive' } },
          { summary: { contains: 'inquiries', mode: 'insensitive' } },
        ],
      },
    });
    console.log(`Search result for "inquiries" found ${searchResultSummary.length} threads.`);

    // 6. Print retrieved data details
    console.log('\n--- Retrieved Message & Conversation Details ---');
    const retrievedMessages = await prisma.message.findMany({
      where: { conversationId: conv1.id },
      orderBy: { createdAt: 'asc' },
    });

    retrievedMessages.forEach((msg) => {
      console.log(`[${msg.senderType}] (${msg.createdAt.toISOString()}): ${msg.content}`);
      if (msg.attachments) {
        console.log(`  Attachments: ${JSON.stringify(msg.attachments)}`);
      }
    });
    console.log('--------------------------------------------------\n');

    // 7. Cleanup
    console.log('Cleaning up database test records...');
    await prisma.message.deleteMany({
      where: { conversationId: { in: [conv1.id, conv2.id] } },
    });
    await prisma.conversation.deleteMany({
      where: { id: { in: [conv1.id, conv2.id] } },
    });
    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.organization.delete({ where: { id: org.id } });
    console.log('Cleanup complete.');

    console.log('=== Conversation Management Integration Test: SUCCESS ===');
  } catch (error) {
    console.error('=== Conversation Management Integration Test: FAILED ===');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runConversationTest();
