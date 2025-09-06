import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function quickSeed() {
  try {
    console.log('🌱 Quick seed starting...');

    // Create company
    const company = await prisma.company.upsert({
      where: { name: 'Default Company' },
      update: {},
      create: { name: 'Default Company' }
    });

    console.log('✅ Company:', company.name);

    // Create admin group
    const adminGroup = await prisma.userGroup.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'System Administrator'
      }
    });

    console.log('✅ Admin group created');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password: hashedPassword },
      create: {
        username: 'admin',
        email: 'admin@company.com',
        password: hashedPassword,
        fullName: 'System Administrator',
        isActive: true,
        groupId: adminGroup.id
      }
    });

    console.log('✅ Admin user created');
    console.log('📋 Credentials: admin / admin123');
    console.log('🎉 Quick seed completed!');

  } catch (error) {
    console.error('❌ Quick seed failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickSeed();
