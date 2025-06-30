const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log('Checking for admin users...');
    
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Active: ${user.isActive}`);
    });

    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating one...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        },
      });
      
      console.log('Created admin user:', adminUser.name, adminUser.email);
    }

    // Also check all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    console.log(`\nTotal users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} - Active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('Error checking admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers(); 