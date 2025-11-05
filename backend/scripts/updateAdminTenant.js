const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminTenant() {
  try {
    console.log('Updating admin user tenantId...');

    // Get or create default tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Organization',
          code: 'DEFAULT',
        },
      });
      console.log('Created tenant:', tenant.name);
    }

    // Update all users without tenantId to use the default tenant
    const result = await prisma.user.updateMany({
      where: {
        tenantId: null,
      },
      data: {
        tenantId: tenant.id,
      },
    });

    console.log(`✅ Updated ${result.count} user(s) to use tenantId: ${tenant.id}`);
    console.log('Admin user should now have proper tenant access');
  } catch (error) {
    console.error('Error updating admin tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminTenant();
