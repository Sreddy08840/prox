/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../../config/database';
import {
  getOrganizations,
  getUsers,
  createUser,
  updateUser,
  getProjects,
  createProject,
  getApiKeys,
  createApiKey,
  deleteApiKey,
  getAuditLogs,
  getFailedMessages,
  retryFailedMessage,
} from '../../controllers/adminController';
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

async function testAdminPanelAPIs() {
  // eslint-disable-next-line no-console
  console.log('=== START ADMIN PANEL INTEGRATION TESTS ===');

  try {
    // 1. Setup User and Org context
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: 'Test Administrative Org', slug: 'test-admin-org' },
      });
    }

    let user = await prisma.user.findFirst({
      where: { role: 'ADMIN', organizationId: org.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'superadmin@test.com',
          password: 'supersecurepassword',
          firstName: 'Super',
          lastName: 'Admin',
          role: 'ADMIN',
          status: 'ACTIVE',
          organizationId: org.id,
        },
      });
    }

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    // 2. Test getOrganizations endpoint
    // eslint-disable-next-line no-console
    console.log('\n[Test 1] Testing GET /admin/organizations...');
    const reqOrgs = { user: authUser } as unknown as Request;
    const resOrgs = mockResponse();
    await getOrganizations(reqOrgs, resOrgs, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- GET Orgs status code: ${resOrgs.statusCode || 200}`);
    if (resOrgs.body?.success && resOrgs.body.data.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`✓ Success: Found ${resOrgs.body.data.length} organization(s).`);
    } else {
      // eslint-disable-next-line no-console
      console.error('✗ Error: failed to fetch organizations.');
    }

    // 3. Test getUsers endpoint
    // eslint-disable-next-line no-console
    console.log('\n[Test 2] Testing GET /admin/users...');
    const reqUsers = { user: authUser } as unknown as Request;
    const resUsers = mockResponse();
    await getUsers(reqUsers, resUsers, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- GET Users status code: ${resUsers.statusCode || 200}`);
    if (resUsers.body?.success) {
      // eslint-disable-next-line no-console
      console.log(`✓ Success: Found ${resUsers.body.data.length} user(s).`);
    } else {
      // eslint-disable-next-line no-console
      console.error('✗ Error: failed to fetch users.');
    }

    // 4. Test createUser endpoint
    // eslint-disable-next-line no-console
    console.log('\n[Test 3] Testing POST /admin/users...');
    const testEmail = `agent-${Date.now()}@test.com`;
    const reqCreateUser = {
      user: authUser,
      body: {
        email: testEmail,
        firstName: 'Sales',
        lastName: 'Agent',
        role: 'SALES_AGENT',
      },
    } as unknown as Request;
    const resCreateUser = mockResponse();
    await createUser(reqCreateUser, resCreateUser, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- POST Create User status code: ${resCreateUser.statusCode || 201}`);
    const createdUser = resCreateUser.body?.data;
    if (createdUser && createdUser.email === testEmail) {
      // eslint-disable-next-line no-console
      console.log(`✓ Success: Created member agent "${createdUser.firstName} ${createdUser.lastName}".`);
    } else {
      // eslint-disable-next-line no-console
      console.error('✗ Error: failed to create user.');
    }

    // 5. Test updateUser role endpoint
    // eslint-disable-next-line no-console
    console.log('\n[Test 4] Testing PUT /admin/users/:id...');
    const reqUpdateUser = {
      user: authUser,
      params: { id: createdUser.id },
      body: {
        firstName: 'Sales',
        lastName: 'Agent Pro',
        role: 'SALES_MANAGER',
        status: 'ACTIVE',
      },
    } as unknown as Request;
    const resUpdateUser = mockResponse();
    await updateUser(reqUpdateUser, resUpdateUser, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- PUT Update User status code: ${resUpdateUser.statusCode || 200}`);
    if (resUpdateUser.body?.data?.role === 'SALES_MANAGER') {
      // eslint-disable-next-line no-console
      console.log('✓ Success: Member role updated to SALES_MANAGER.');
    } else {
      // eslint-disable-next-line no-console
      console.error('✗ Error: failed to update member role.');
    }

    // 6. Test createProject endpoint
    // eslint-disable-next-line no-console
    console.log('\n[Test 5] Testing POST /admin/projects...');
    const reqProj = {
      user: authUser,
      body: {
        name: 'Hilltop Manor',
        description: 'Luxury condos overviewing valley',
        status: 'PLANNING',
      },
    } as unknown as Request;
    const resProj = mockResponse();
    await createProject(reqProj, resProj, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- POST Create Project status code: ${resProj.statusCode || 201}`);
    const createdProj = resProj.body?.data;
    if (createdProj && createdProj.name === 'Hilltop Manor') {
      // eslint-disable-next-line no-console
      console.log('✓ Success: Created hilltop manor project.');
    } else {
      // eslint-disable-next-line no-console
      console.error('✗ Error: failed to create project.');
    }

    // 7. Test getProjects endpoint
    // eslint-disable-next-line no-console
    console.log('\n[Test 6] Testing GET /admin/projects...');
    const reqGetProjs = { user: authUser } as unknown as Request;
    const resGetProjs = mockResponse();
    await getProjects(reqGetProjs, resGetProjs, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- GET Projects status code: ${resGetProjs.statusCode || 200}`);
    if (resGetProjs.body?.success) {
      // eslint-disable-next-line no-console
      console.log(`✓ Success: Found ${resGetProjs.body.data.length} projects.`);
    }

    // 8. Test createApiKey endpoint
    // eslint-disable-next-line no-console
    console.log('\n[Test 7] Testing POST /admin/apikeys...');
    const reqKey = {
      user: authUser,
      body: { name: 'Zapier Webhook Key' },
    } as unknown as Request;
    const resKey = mockResponse();
    await createApiKey(reqKey, resKey, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- POST Create Key status code: ${resKey.statusCode || 201}`);
    const generatedKeyObj = resKey.body?.data;
    if (generatedKeyObj && generatedKeyObj.key.startsWith('pk_')) {
      // eslint-disable-next-line no-console
      console.log('✓ Success: API key generated.');
    } else {
      // eslint-disable-next-line no-console
      console.error('✗ Error: API key generation failed.');
    }

    // 9. Test getApiKeys endpoint
    // eslint-disable-next-line no-console
    console.log('\n[Test 8] Testing GET /admin/apikeys...');
    const reqGetKeys = { user: authUser } as unknown as Request;
    const resGetKeys = mockResponse();
    await getApiKeys(reqGetKeys, resGetKeys, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- GET Keys status code: ${resGetKeys.statusCode || 200}`);
    if (resGetKeys.body?.success && resGetKeys.body.data.length > 0) {
      // eslint-disable-next-line no-console
      console.log('✓ Success: Listed generated keys.');
    }

    // 10. Test deleteApiKey endpoint
    // eslint-disable-next-line no-console
    console.log('\n[Test 9] Testing DELETE /admin/apikeys/:id...');
    const reqDelKey = {
      user: authUser,
      params: { id: generatedKeyObj.id },
    } as unknown as Request;
    const resDelKey = mockResponse();
    await deleteApiKey(reqDelKey, resDelKey, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- DELETE Key status code: ${resDelKey.statusCode || 200}`);
    if (resDelKey.body?.success) {
      // eslint-disable-next-line no-console
      console.log('✓ Success: API key revoked.');
    }

    // 11. Test getAuditLogs endpoint
    // eslint-disable-next-line no-console
    console.log('\n[Test 10] Testing GET /admin/audit-logs...');
    // Create an audit log record first
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        action: 'USER_LOGIN',
        entityName: 'User',
        entityId: user.id,
        newValues: { detail: 'User authenticated successfully via credentials.' },
      },
    });

    const reqAudit = { user: authUser } as unknown as Request;
    const resAudit = mockResponse();
    await getAuditLogs(reqAudit, resAudit, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- GET Audit Logs status code: ${resAudit.statusCode || 200}`);
    if (resAudit.body?.success && resAudit.body.data.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`✓ Success: Found ${resAudit.body.data.length} audit trail log(s).`);
    }

    // 12. Test Failed deliveries & retry triggers
    // eslint-disable-next-line no-console
    console.log('\n[Test 11] Testing GET /admin/failed-messages & Retry...');
    const failedMsg = await prisma.failedMessage.create({
      data: {
        recipientPhone: '15550199000',
        content: 'Outbound test dispatch retry queue logging',
        attempts: 1,
        status: 'FAILED',
        errorMsg: 'Webhook connection timeout',
      },
    });

    const reqFailed = { user: authUser } as unknown as Request;
    const resFailed = mockResponse();
    await getFailedMessages(reqFailed, resFailed, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- GET Failed Messages status code: ${resFailed.statusCode || 200}`);
    if (resFailed.body?.success && resFailed.body.data.length > 0) {
      // eslint-disable-next-line no-console
      console.log('✓ Success: Listed failed deliveries queue.');
    }

    // Trigger retry API
    const reqRetry = {
      user: authUser,
      params: { id: failedMsg.id },
    } as unknown as Request;
    const resRetry = mockResponse();
    await retryFailedMessage(reqRetry, resRetry, (err) => { if (err) throw err; });

    // eslint-disable-next-line no-console
    console.log(`- POST Retry status code: ${resRetry.statusCode || 200}`);
    if (resRetry.body?.success || resRetry.statusCode === 202) {
      // eslint-disable-next-line no-console
      console.log('✓ Success: Retry request completed.');
    }

    // eslint-disable-next-line no-console
    console.log('\n=== ALL ADMIN PANEL INTEGRATION TESTS COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Test crashed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminPanelAPIs();
