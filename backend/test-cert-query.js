const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const tenantId = 1;
    const where = { tenantId };
    
    const certificates = await prisma.certificate.findMany({
      where,
      take: 2,
      include: {
        enrollment: {
          include: {
            candidate: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            course: {
              select: {
                title: true,
                code: true,
              },
            },
          },
        },
        template: {
          select: {
            name: true,
          },
        },
        issuedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });
    
    console.log('✅ Found', certificates.length, 'certificate(s)');
    
    certificates.forEach((cert, idx) => {
      console.log(`\nCertificate ${idx + 1}:`, cert.certificateNumber);
      console.log('  Status:', cert.status);
      console.log('  Has enrollment:', !!cert.enrollment);
      if (cert.enrollment) {
        console.log('  Candidate:', cert.enrollment.candidate?.user?.firstName, cert.enrollment.candidate?.user?.lastName);
        console.log('  Course:', cert.enrollment.course?.title);
      } else {
        console.log('  No enrollment (likely REISSUED certificate)');
      }
    });
    
    // Test formatting
    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      candidateName: cert.enrollment ? `${cert.enrollment.candidate.user.firstName} ${cert.enrollment.candidate.user.lastName}` : 'N/A',
      candidateEmail: cert.enrollment ? cert.enrollment.candidate.user.email : 'N/A',
      courseName: cert.enrollment ? cert.enrollment.course.title : 'N/A',
      courseCode: cert.enrollment ? cert.enrollment.course.code : 'N/A',
      status: cert.status,
    }));
    
    console.log('\n✅ Formatted successfully');
    console.log(JSON.stringify(formattedCertificates, null, 2));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

test();
