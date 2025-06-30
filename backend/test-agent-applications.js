const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAgentApplications() {
  try {
    console.log('Checking for pending agent applications...');
    
    const applications = await prisma.agentApplication.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    console.log(`Found ${applications.length} pending applications:`);
    
    if (applications.length === 0) {
      console.log('No pending applications found. Creating a test application...');
      
      // Find a customer user to create a test application
      const customer = await prisma.user.findFirst({
        where: {
          role: 'CUSTOMER',
        },
      });

      if (customer) {
        const testApplication = await prisma.agentApplication.create({
          data: {
            userId: customer.id,
            status: 'PENDING',
          },
        });
        console.log('Created test application for user:', customer.name);
        console.log('Application ID:', testApplication.id);
      } else {
        console.log('No customer users found to create test application');
      }
    } else {
      applications.forEach((app, index) => {
        console.log(`\nApplication ${index + 1}:`);
        console.log('  ID:', app.id);
        console.log('  User:', app.user.name);
        console.log('  Email:', app.user.email);
        console.log('  Phone:', app.user.phone || 'Not provided');
        console.log('  Status:', app.status);
        console.log('  Applied:', app.appliedAt);
      });
    }

    // Also check all agent applications
    const allApplications = await prisma.agentApplication.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    console.log(`\nTotal agent applications: ${allApplications.length}`);
    allApplications.forEach((app, index) => {
      console.log(`${index + 1}. ${app.user.name} (${app.user.email}) - ${app.status}`);
    });

  } catch (error) {
    console.error('Error checking agent applications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgentApplications(); 