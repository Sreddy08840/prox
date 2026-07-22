import { PrismaClient, UserRole, UserStatus, ProjectStatus, UnitStatus, LeadStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create or find Organization
  let org = await prisma.organization.findFirst({
    where: { slug: 'propx-demo' },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'PropX Real Estate',
        slug: 'propx-demo',
      },
    });
    console.log('✅ Created organization:', org.name);
  }

  // 2. Create Admin User
  const adminEmail = 'admin@propx.com';
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        organizationId: org.id,
      },
    });
    console.log('✅ Created Admin user (Email: admin@propx.com / Password: Admin@123456)');
  }

  // 3. Create Sample Project
  let project = await prisma.project.findFirst({
    where: { organizationId: org.id },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Skyline Heights',
        description: 'Luxury high-rise apartments in the heart of downtown.',
        address: '128 Business Bay Avenue',
        city: 'Metropolis',
        status: ProjectStatus.UNDER_CONSTRUCTION,
        organizationId: org.id,
      },
    });

    const unitType = await prisma.unitType.create({
      data: {
        name: '2 BHK Luxury Suite',
        bedrooms: 2,
        bathrooms: 2,
        sizeSqFt: 1250,
        basePrice: 250000.00,
        projectId: project.id,
        organizationId: org.id,
      },
    });

    await prisma.unit.createMany({
      data: [
        { unitNumber: '101', floor: 1, price: 250000.00, areaSqFt: 1250, status: UnitStatus.AVAILABLE, unitTypeId: unitType.id, projectId: project.id },
        { unitNumber: '102', floor: 1, price: 255000.00, areaSqFt: 1250, status: UnitStatus.AVAILABLE, unitTypeId: unitType.id, projectId: project.id },
        { unitNumber: '201', floor: 2, price: 260000.00, areaSqFt: 1250, status: UnitStatus.RESERVED, unitTypeId: unitType.id, projectId: project.id },
      ],
    });
    console.log('✅ Created sample Project & Units');
  }

  // 4. Create Sample Lead
  const leadCount = await prisma.lead.count({ where: { organizationId: org.id } });
  if (leadCount === 0) {
    await prisma.lead.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+15551234567',
        status: LeadStatus.NEW,
        source: 'Website',
        budget: 260000.00,
        organizationId: org.id,
        assignedUserId: admin.id,
      },
    });
    console.log('✅ Created sample Lead');
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
