const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateTestCertificates() {
  try {
    console.log('🎓 Generating test certificates...\n');

    // Get existing enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        enrollmentStatus: 'COMPLETED'
      },
      include: {
        candidate: true,
        course: true
      },
      take: 2
    });

    // If no completed enrollments, get any enrollments
    let enrollmentsToUse = enrollments;
    if (enrollments.length === 0) {
      console.log('No COMPLETED enrollments found, using any available enrollments...\n');
      enrollmentsToUse = await prisma.enrollment.findMany({
        include: {
          candidate: true,
          course: true
        },
        take: 2
      });
    }

    if (enrollmentsToUse.length === 0) {
      console.log('❌ No enrollments found in database. Please create some enrollments first.');
      return;
    }

    const certificates = [];
    
    for (let i = 0; i < enrollmentsToUse.length; i++) {
      const enrollment = enrollmentsToUse[i];
      
      // Check if certificate already exists for this enrollment
      const existing = await prisma.certificate.findFirst({
        where: {
          enrollmentId: enrollment.id,
          tenantId: enrollment.tenantId
        }
      });

      if (existing) {
        console.log(`⚠️  Certificate already exists for enrollment ${enrollment.id}, skipping...`);
        continue;
      }

      const certificateNumber = `CERT-${new Date().getFullYear()}-${String(1000 + i).padStart(4, '0')}`;
      const issueDate = new Date();

      const certificate = await prisma.certificate.create({
        data: {
          tenantId: enrollment.tenantId,
          enrollmentId: enrollment.id,
          certificateNumber: certificateNumber,
          issueDate: issueDate,
          expiryDate: null, // No expiry date
          status: 'ISSUED', // Set as ISSUED so it shows the action buttons
          grade: null, // No grade
          remarks: `Successfully completed ${enrollment.course?.name || 'the course'}`,
          issuedBy: null,
          courseId: enrollment.courseId
        },
        include: {
          enrollment: {
            include: {
              candidate: true,
              course: true
            }
          }
        }
      });

      certificates.push(certificate);

      console.log(`✅ Certificate created:`);
      console.log(`   Number: ${certificate.certificateNumber}`);
      console.log(`   Candidate: ${certificate.enrollment.candidate.fullName || 'N/A'}`);
      console.log(`   Course: ${certificate.enrollment.course?.name || 'N/A'}`);
      console.log(`   Status: ${certificate.status}`);
      console.log('');
    }

    console.log(`\n🎉 Successfully generated ${certificates.length} test certificate(s)!`);
    console.log('\nYou can now:');
    console.log('1. Refresh your Certificates page in the admin dashboard');
    console.log('2. Test the Download button to save the certificate');
    console.log('3. Test the Print button to open and print the certificate\n');

  } catch (error) {
    console.error('❌ Error generating certificates:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

generateTestCertificates();
