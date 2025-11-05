const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestDataForCertificates() {
  try {
    console.log('Creating test data for certificate management...');

    // Get or create tenant
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

    // Get admin user
    const admin = await prisma.user.findFirst({
      where: {
        role: {
          name: 'Admin',
        },
      },
    });

    // Get or create a course
    let course = await prisma.course.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          tenantId: tenant.id,
          title: 'Professional Construction Safety Training',
          code: 'PCST-001',
          description: 'Comprehensive construction safety training program',
          duration: 40,
          status: 'ACTIVE',
          capacity: 30,
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-03-15'),
          createdBy: admin?.id,
        },
      });
      console.log('Created course:', course.title);
    }

    // Get or create candidate users
    const candidateRole = await prisma.role.findFirst({
      where: { name: 'Candidate' },
    });

    const candidateUsers = [];
    for (let i = 1; i <= 5; i++) {
      let user = await prisma.user.findFirst({
        where: {
          email: `candidate${i}@test.com`,
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            tenantId: tenant.id,
            roleId: candidateRole.id,
            email: `candidate${i}@test.com`,
            password: '$2a$10$YourHashedPasswordHere', // In production, hash properly
            firstName: `Candidate${i}`,
            lastName: `Test`,
            status: 'ACTIVE',
          },
        });
      }

      let candidate = await prisma.candidate.findFirst({
        where: { userId: user.id },
      });

      if (!candidate) {
        candidate = await prisma.candidate.create({
          data: {
            tenantId: tenant.id,
            userId: user.id,
            fullName: `${user.firstName} ${user.lastName}`,
            dob: new Date('1990-01-01'),
            gender: i % 2 === 0 ? 'Male' : 'Female',
            preferredCountry: 'Kenya',
            status: 'ENROLLED',
          },
        });
      }

      candidateUsers.push({ user, candidate });
    }

    console.log('Created/found 5 candidate users');

    // Create enrollments with COMPLETED status for certificate approval
    for (const { candidate } of candidateUsers) {
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: {
          candidateId: candidate.id,
          courseId: course.id,
        },
      });

      if (!existingEnrollment) {
        const enrollment = await prisma.enrollment.create({
          data: {
            tenantId: tenant.id,
            candidateId: candidate.id,
            courseId: course.id,
            enrollmentStatus: 'COMPLETED',
            enrollmentDate: new Date('2024-01-20'),
          },
        });
        console.log(`Created COMPLETED enrollment for ${candidate.fullName}`);
      }
    }

    // Create a certificate template
    const existingTemplate = await prisma.certificateTemplate.findFirst({
      where: {
        tenantId: tenant.id,
        name: 'Default Certificate Template',
      },
    });

    if (!existingTemplate) {
      await prisma.certificateTemplate.create({
        data: {
          tenantId: tenant.id,
          name: 'Default Certificate Template',
          description: 'Standard certificate template for course completion',
          isActive: true,
          design: {
            backgroundColor: '#ffffff',
            borderColor: '#1e40af',
            borderWidth: 2,
            fontSize: {
              title: '24px',
              body: '14px',
              footer: '12px',
            },
            fontFamily: 'Arial, sans-serif',
          },
          content: {
            header: 'Certificate of Completion',
            body: 'This is to certify that {candidateName} has successfully completed the course {courseName} with distinction.',
            footer: 'Issued on {issueDate}',
          },
          createdBy: admin?.id,
        },
      });
      console.log('Created default certificate template');
    }

    console.log('\n✅ Test data created successfully!');
    console.log('You now have:');
    console.log('- 5 candidates with COMPLETED enrollments ready for certificate approval');
    console.log('- 1 certificate template');
    console.log('\nYou can now:');
    console.log('1. Go to Admin > Certificates > Pending Approvals');
    console.log('2. Approve and generate certificates');
    console.log('3. View issued certificates in the Certificates tab');
    console.log('4. Verify certificates in the Verification tab');
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDataForCertificates();
