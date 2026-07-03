import prisma from '../../config/database';
import notificationService from '../notificationService';

async function testNotifications() {
  // eslint-disable-next-line no-console
  console.log('=== START NOTIFICATION SYSTEM TEST ===');

  try {
    // 1. Fetch or create a user and organization
    let user = await prisma.user.findFirst({
      include: { organization: true },
    });

    if (!user) {
      // Create fallback org + user
      const org = await prisma.organization.create({
        data: { name: 'Test Org', slug: 'test-org' },
      });
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
        include: { organization: true },
      });
    }

    const orgId = user.organizationId!;
    const agentId = user.id;

    // Clear old notifications and leads for clean test run
    await prisma.notification.deleteMany({ where: { userId: agentId } });
    await prisma.lead.deleteMany({ where: { organizationId: orgId } });

    // 2. Trigger a lead assignment notification
    // eslint-disable-next-line no-console
    console.log('\n[Test 1] Dispatching Lead Assignment Notification...');
    await notificationService.sendNotification(
      agentId,
      'New Lead Assigned',
      'Lead John Doe has been assigned to you.',
      {
        subject: 'PropX CRM - Lead Assigned: John Doe',
        text: 'Hello Agent Smith, you have been assigned a new lead: John Doe.',
        html: '<p>Hello Agent Smith,</p><p>You have been assigned a new lead: John Doe.</p>',
      },
    );

    // 3. Trigger a lead status update notification
    // eslint-disable-next-line no-console
    console.log('\n[Test 2] Dispatching Status Update Notification...');
    await notificationService.sendNotification(
      agentId,
      'Lead Status Updated',
      "Lead John Doe's status changed from \"NEW\" to \"QUALIFIED\".",
      {
        subject: 'PropX CRM - Status Updated: John Doe',
        text: "Hello Agent Smith, the status of lead John Doe has been updated to QUALIFIED.",
        html: '<p>Hello Agent Smith,</p><p>John Doe\'s status has been changed to QUALIFIED.</p>',
      },
    );

    // 4. Validate DB records
    const notifications = await prisma.notification.findMany({
      where: { userId: agentId },
      orderBy: { createdAt: 'asc' },
    });

    // eslint-disable-next-line no-console
    console.log('\n[Validation] Checking Notification Database Records:');
    notifications.forEach((notif) => {
      // eslint-disable-next-line no-console
      console.log(`- Notif ID: ${notif.id} | Title: "${notif.title}" | Read: ${notif.isRead} | Msg: "${notif.message}"`);
    });

    if (notifications.length === 2) {
      // eslint-disable-next-line no-console
      console.log('✓ Success: In-app database notifications correctly verified.');
    } else {
      // eslint-disable-next-line no-console
      console.error(`✗ Error: Expected 2 notifications, found ${notifications.length}`);
    }

    // 5. Create some test leads to verify Daily Summary numbers
    // eslint-disable-next-line no-console
    console.log('\n[Test 3] Creating dummy leads for daily summary stats check...');
    await prisma.lead.createMany({
      data: [
        {
          firstName: 'Alice',
          lastName: 'Green',
          email: 'alice@test.com',
          status: 'NEW',
          organizationId: orgId,
          assignedUserId: agentId,
        },
        {
          firstName: 'Bob',
          lastName: 'Brown',
          email: 'bob@test.com',
          status: 'QUALIFIED',
          organizationId: orgId,
          assignedUserId: agentId,
        },
      ],
    });

    // 6. Run Daily Summary email dispatch
    // eslint-disable-next-line no-console
    console.log('\n[Test 4] Dispatching Daily Summary Report...');
    await notificationService.sendDailySummary(orgId);

    // eslint-disable-next-line no-console
    console.log('\n=== NOTIFICATION SYSTEM TEST COMPLETED ===');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Test script crashed with error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testNotifications();
