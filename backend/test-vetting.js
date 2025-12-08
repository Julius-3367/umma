require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTestData() {
  try {
    // Find a candidate
    const candidate = await prisma.candidate.findFirst({
      include: { user: true }
    });
    
    if (!candidate) {
      console.log('❌ No candidate found');
      process.exit(1);
    }
    
    console.log('✅ Candidate found:', candidate.user.email);
    console.log('   Candidate ID:', candidate.id);
    
    // Find a cohort (any available cohort)
    const cohort = await prisma.cohort.findFirst({
      where: {
        status: { in: ['ENROLLMENT_OPEN', 'IN_TRAINING'] }
      },
      include: { course: true }
    });
    
    if (!cohort) {
      console.log('❌ No active cohort found');
      process.exit(1);
    }
    
    console.log('✅ Cohort found:', cohort.cohortName);
    console.log('   Course:', cohort.course?.title || 'N/A');
    
    // Check if there's already an ENROLLED enrollment
    let enrollment = await prisma.cohortEnrollment.findFirst({
      where: {
        candidateId: candidate.id,
        status: 'ENROLLED'
      }
    });
    
    if (!enrollment) {
      // Create an ENROLLED enrollment for testing
      enrollment = await prisma.cohortEnrollment.create({
        data: {
          candidateId: candidate.id,
          cohortId: cohort.id,
          status: 'ENROLLED',
          applicationDate: new Date(),
          approvalDate: new Date()
        }
      });
      console.log('✅ Created ENROLLED enrollment:', enrollment.id);
    } else {
      console.log('✅ Existing ENROLLED enrollment:', enrollment.id);
    }
    
    // Check for existing vetting records
    const existingVetting = await prisma.vettingRecord.findFirst({
      where: {
        candidateId: candidate.id,
        vettingStatus: { in: ['PENDING', 'PENDING_DOCUMENTS', 'IN_PROGRESS'] }
      }
    });
    
    if (existingVetting) {
      console.log('⚠️  Existing active vetting record found:', existingVetting.id);
      console.log('   Status:', existingVetting.vettingStatus);
      console.log('   You may need to complete or cancel this before testing a new application');
    } else {
      console.log('✅ No active vetting records - ready to test new application');
    }
    
    console.log('\n📋 Test Data Summary:');
    console.log('   Candidate Email:', candidate.user.email);
    console.log('   Candidate ID:', candidate.id);
    console.log('   Enrollment ID:', enrollment.id);
    console.log('   Cohort:', cohort.cohortName);
    console.log('   Cohort ID:', cohort.id);
    
    console.log('\n🧪 Ready to test vetting application!');
    console.log('   1. Login as:', candidate.user.email);
    console.log('   2. Go to My Applications page');
    console.log('   3. Look for "Apply for Vetting" button');
    console.log('   4. Click and submit application');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
