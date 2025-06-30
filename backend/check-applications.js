const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkApplications() {
  try {
    console.log('Checking for pending agent applications...');
    
    // Check all agent applications
    const allApplications = await prisma.agentApplication.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    });
    
    console.log(`Total applications found: ${allApplications.length}`);
    
    // Check pending applications
    const pendingApplications = await prisma.agentApplication.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    });
    
    console.log(`Pending applications found: ${pendingApplications.length}`);
    
    if (pendingApplications.length > 0) {
      console.log('\nPending Applications:');
      pendingApplications.forEach((app, index) => {
        console.log(`${index + 1}. User: ${app.user.name} (${app.user.email})`);
        console.log(`   Role: ${app.user.role}`);
        console.log(`   Applied: ${app.appliedAt}`);
        console.log(`   Status: ${app.status}`);
        console.log('');
      });
    } else {
      console.log('\nNo pending applications found.');
      console.log('\nTo test the system:');
      console.log('1. Create a customer account');
      console.log('2. Login as that customer');
      console.log('3. Apply to become an agent');
      console.log('4. Login as admin and check the agent requests page');
    }
    
    // Check all users and their roles
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('\nAll Users:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error checking applications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApplications(); 