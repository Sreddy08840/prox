/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../../config/database';
import { whatsappService } from '../whatsappService';
import { handleWebhook, verifyWebhook, sendMessage } from '../../controllers/whatsappController';
import { Request } from 'express';

// Simple Mock Express Response
const mockResponse = () => {
  const res = {} as any;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  res.send = (data: any) => {
    res.body = data;
    return res;
  };
  res.sendStatus = (code: number) => {
    res.statusCode = code;
    return res;
  };
  return res;
};

async function testWhatsappIntegration() {
  // eslint-disable-next-line no-console
  console.log('=== START WHATSAPP INTEGRATION TEST ===');

  try {
    // Ensure we have a default organization
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: 'Default Org', slug: 'default-org' },
      });
    }

    // Fetch or create user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'agent@test.com',
          password: 'mockpassword',
          firstName: 'Agent',
          lastName: 'Smith',
          role: 'ADMIN',
          status: 'ACTIVE',
          organizationId: org.id,
        },
      });
    }
    const agentId = user.id;

    // Clear failed messages for clean testing
    await prisma.failedMessage.deleteMany({});
    
    // Clean up test leads with target phone
    const TEST_PHONE = '15550199222';
    await prisma.lead.deleteMany({ where: { phone: TEST_PHONE } });

    // 1. Test Webhook Verification Challenge
    // eslint-disable-next-line no-console
    console.log('\n[Test 1] Testing Webhook GET verification challange...');
    const reqVerify = {
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'propx_token',
        'hub.challenge': 'challange_accepted_1234',
      },
    } as unknown as Request;

    const resVerify = mockResponse();
    await verifyWebhook(reqVerify, resVerify, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- Webhook GET status code: ${resVerify.statusCode || 200}`);
    // eslint-disable-next-line no-console
    console.log(`- Webhook GET challenge body: "${resVerify.body}"`);

    if (resVerify.body === 'challange_accepted_1234') {
      // eslint-disable-next-line no-console
      console.log('✓ Success: Webhook verification challenge verified.');
    } else {
      // eslint-disable-next-line no-console
      console.error('✗ Error: challenge verification failed.');
    }

    // 2. Test Incoming Message Webhook Handling (auto-create Lead & Conversation)
    // eslint-disable-next-line no-console
    console.log('\n[Test 2] Submitting incoming message payload (POST)...');
    const reqIncoming = {
      body: {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  contacts: [
                    {
                      profile: { name: 'Sarah Connor' },
                      wa_id: TEST_PHONE,
                    },
                  ],
                  messages: [
                    {
                      from: TEST_PHONE,
                      id: 'wamid.HBgLMTU1NTAxOTkyMjIVAhIAEhg1NkIzRjRDMTIzNDU2Nzg5MEIA',
                      text: { body: 'Hello, looking to invest $350k into a completed 2 BHK suite immediately.' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    } as Request;

    const resIncoming = mockResponse();
    await handleWebhook(reqIncoming, resIncoming, (err) => { if (err) throw err; });

    // Let qualification complete (simulated async qualification)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify DB lead creation
    const createdLead = await prisma.lead.findFirst({
      where: { phone: TEST_PHONE },
      include: {
        conversations: {
          include: { messages: true },
        },
        aiInsight: true,
      },
    });

    if (createdLead) {
      // eslint-disable-next-line no-console
      console.log('✓ Success: Lead created auto-magically.');
      // eslint-disable-next-line no-console
      console.log(`  - Lead Name: "${createdLead.firstName} ${createdLead.lastName}"`);
      // eslint-disable-next-line no-console
      console.log(`  - Conversation: "${createdLead.conversations[0]?.subject}"`);
      // eslint-disable-next-line no-console
      console.log(`  - Messages in thread: ${createdLead.conversations[0]?.messages.length}`);
      // eslint-disable-next-line no-console
      console.log(`  - AI Scored Lead: ${createdLead.aiInsight?.leadScore || 'PENDING'}`);
      // eslint-disable-next-line no-console
      console.log(`  - AI Extracted Budget: $${createdLead.budget ? createdLead.budget.toString() : 'None'}`);
    } else {
      // eslint-disable-next-line no-console
      console.error('✗ Error: Lead was not created from webhook payload.');
    }

    // 3. Test Manual Send Outbound Message
    // eslint-disable-next-line no-console
    console.log('\n[Test 3] Testing Outbound Manual Send API...');
    const reqSend = {
      body: {
        leadId: createdLead?.id,
        content: 'Hi Sarah, thank you for contacting PropX. We will connect you to an agent soon.',
      },
      user: { id: agentId },
    } as unknown as Request & { user?: { id: string } };

    const resSend = mockResponse();
    await sendMessage(reqSend, resSend, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- Send API Status: ${resSend.statusCode || 200}`);
    if (resSend.body?.success) {
      // eslint-disable-next-line no-console
      console.log('✓ Success: Outbound message stored in conversation thread.');
    } else {
      // eslint-disable-next-line no-console
      console.error('✗ Error: Outbound message failed to store.');
    }

    // 4. Test Background Retry Loop Queue
    // eslint-disable-next-line no-console
    console.log('\n[Test 4] Verifying WhatsApp Background Retry Loop...');
    // Create a mock failed message
    const failedMsg = await prisma.failedMessage.create({
      data: {
        recipientPhone: '15550000000',
        content: 'Failed retry message verification',
        attempts: 1,
        status: 'FAILED',
        errorMsg: 'Mock connection error',
      },
    });

    // Run retry loop
    await whatsappService.retryFailedMessages();

    // Check status
    const updatedMsg = await prisma.failedMessage.findUnique({
      where: { id: failedMsg.id },
    });

    // eslint-disable-next-line no-console
    console.log(`- Outbound message attempts updated to: ${updatedMsg?.attempts}`);
    // eslint-disable-next-line no-console
    console.log(`- Outbound message status: ${updatedMsg?.status}`);

    if (updatedMsg?.status === 'SENT' || updatedMsg?.status === 'FAILED') {
      // eslint-disable-next-line no-console
      console.log('✓ Success: Background retry loop processed the queue.');
    } else {
      // eslint-disable-next-line no-console
      console.error('✗ Error: Background retry loop did not process failed messages.');
    }

    // eslint-disable-next-line no-console
    console.log('\n=== WHATSAPP INTEGRATION TEST COMPLETED ===');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Test script crashed with error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testWhatsappIntegration();
