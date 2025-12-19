const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive data seed...\n');

  try {
    // Get existing users
    const admin = await prisma.user.findUnique({ where: { email: 'admin@labourmobility.com' } });
    const trainer = await prisma.user.findUnique({ where: { email: 'trainer@labourmobility.com' } });
    const candidates = await prisma.candidate.findMany({ take: 10 });
    const courses = await prisma.course.findMany({ take: 5 });

    if (!admin || !trainer || candidates.length === 0 || courses.length === 0) {
      console.log('⚠️  Please run the main seed first: npm run db:seed');
      return;
    }

    console.log(`✅ Found ${candidates.length} candidates and ${courses.length} courses\n`);

    // 1. Create Vetting Records
    console.log('📋 Creating vetting records...');
    for (let i = 0; i < Math.min(candidates.length, 5); i++) {
      const candidate = candidates[i];
      
      const existingVetting = await prisma.vettingRecord.findFirst({
        where: { candidateId: candidate.id }
      });

      if (!existingVetting) {
        await prisma.vettingRecord.create({
          data: {
            tenantId: 1,
            candidateId: candidate.id,
            policeClearanceNo: `POL-${100000 + i}`,
            policeDocumentUrl: `/uploads/documents/police_clearance_${candidate.id}.pdf`,
            medicalReportNo: `MED-${200000 + i}`,
            medicalReportUrl: `/uploads/documents/medical_report_${candidate.id}.pdf`,
            medicalStatus: i % 2 === 0 ? 'FIT' : 'PENDING',
            vaccinationProofUrl: `/uploads/documents/vaccination_${candidate.id}.pdf`,
            languageTestPassed: i % 3 !== 0,
            vettingStatus: i === 0 ? 'APPROVED' : i === 1 ? 'PENDING' : 'IN_REVIEW',
            verificationOfficerId: admin.id,
            reviewedBy: i < 2 ? admin.id : null,
            reviewDate: i < 2 ? new Date() : null,
            comments: i === 0 ? 'All documents verified and approved' : i === 1 ? 'Awaiting medical report' : 'Under review',
            createdBy: admin.id,
          }
        });
        console.log(`  ✓ Created vetting record for candidate ${candidate.id}`);
      } else {
        console.log(`  ⏭️  Vetting record exists for candidate ${candidate.id}`);
      }
    }

    // 2. Create More Cohorts
    console.log('\n📚 Creating additional cohorts...');
    const cohortData = [
      {
        cohortCode: 'COH-2024-003',
        cohortName: 'May 2024 Advanced Batch',
        description: 'Advanced training for experienced candidates',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-05-31'),
        enrollmentDeadline: new Date('2024-04-25'),
        status: 'COMPLETED',
      },
      {
        cohortCode: 'COH-2024-004',
        cohortName: 'July 2024 Intensive',
        description: 'Intensive summer training program',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-21'),
        enrollmentDeadline: new Date('2024-06-25'),
        status: 'COMPLETED',
      },
      {
        cohortCode: 'COH-2024-005',
        cohortName: 'September 2024 Batch',
        description: 'Fall training cohort',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-09-30'),
        enrollmentDeadline: new Date('2024-08-25'),
        status: 'IN_TRAINING',
      },
      {
        cohortCode: 'COH-2025-002',
        cohortName: 'Test Cohort December 2025',
        description: 'Current active test cohort for demonstration',
        startDate: new Date('2025-12-01'),
        endDate: new Date('2025-12-31'),
        enrollmentDeadline: new Date('2025-11-25'),
        status: 'IN_TRAINING',
      },
    ];

    for (const data of cohortData) {
      const existing = await prisma.cohort.findUnique({ where: { cohortCode: data.cohortCode } });
      
      if (!existing && courses[0]) {
        const cohort = await prisma.cohort.create({
          data: {
            tenantId: 1,
            courseId: courses[0].id,
            cohortCode: data.cohortCode,
            cohortName: data.cohortName,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            enrollmentDeadline: data.enrollmentDeadline,
            maxCapacity: 30,
            currentEnrollment: 0,
            status: data.status,
            leadTrainerId: trainer.id,
            location: 'Training Center',
            scheduleInfo: 'Monday to Friday, 9:00 AM - 5:00 PM',
            createdBy: admin.id,
          }
        });
        
        // Create sessions for the cohort
        const daysOfTraining = 10;
        for (let day = 1; day <= daysOfTraining; day++) {
          const sessionDate = new Date(data.startDate);
          sessionDate.setDate(sessionDate.getDate() + (day - 1));
          
          await prisma.cohortSession.create({
            data: {
              cohortId: cohort.id,
              sessionNumber: day,
              sessionTitle: `Session ${day}: Training Module ${day}`,
              sessionDate: sessionDate,
              startTime: new Date(sessionDate.setHours(9, 0, 0)),
              endTime: new Date(sessionDate.setHours(17, 0, 0)),
              facilitatorId: trainer.id,
              location: 'Training Center',
              topics: `Module ${day} topics and activities`,
              status: data.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
              expectedAttendees: 30,
              createdBy: admin.id,
            }
          });
        }

        // Enroll some candidates
        const candidatesToEnroll = candidates.slice(0, Math.min(5, candidates.length));
        for (const candidate of candidatesToEnroll) {
          const enrollment = await prisma.enrollment.findFirst({
            where: { candidateId: candidate.id, courseId: courses[0].id }
          });

          if (enrollment) {
            await prisma.cohortEnrollment.create({
              data: {
                cohortId: cohort.id,
                candidateId: candidate.id,
                enrollmentId: enrollment.id,
                status: 'ENROLLED',
                attendanceCount: data.status === 'COMPLETED' ? 10 : 5,
                totalSessions: 10,
                attendanceRate: data.status === 'COMPLETED' ? 100 : 50,
                assessmentsPassed: data.status === 'COMPLETED' ? 1 : 0,
                vettingStatus: data.status === 'COMPLETED' ? 'CLEARED' : 'PENDING',
                certificationIssued: data.status === 'COMPLETED',
                placementReady: data.status === 'COMPLETED',
                reviewedBy: admin.id,
                approvalDate: new Date(),
              }
            });
          }
        }

        // Update enrollment count
        const enrolledCount = await prisma.cohortEnrollment.count({
          where: { cohortId: cohort.id, status: 'ENROLLED' }
        });

        await prisma.cohort.update({
          where: { id: cohort.id },
          data: { currentEnrollment: enrolledCount }
        });

        console.log(`  ✓ Created cohort: ${data.cohortName} with ${enrolledCount} students`);
      } else {
        console.log(`  ⏭️  Cohort exists: ${data.cohortName}`);
      }
    }

    // 3. Create Placements
    console.log('\n💼 Creating placement records...');
    for (let i = 0; i < Math.min(candidates.length, 3); i++) {
      const candidate = candidates[i];
      
      const existingPlacement = await prisma.placement.findFirst({
        where: { candidateId: candidate.id }
      });

      if (!existingPlacement) {
        await prisma.placement.create({
          data: {
            tenantId: 1,
            candidateId: candidate.id,
            recruitingAgency: i === 0 ? 'Global Staffing Solutions' : 'International Recruitment Agency',
            jobRoleOffered: i === 0 ? 'Healthcare Assistant' : i === 1 ? 'Customer Service Representative' : 'Data Analyst',
            country: i % 2 === 0 ? 'United Kingdom' : 'Germany',
            employerName: `Employer Company ${i + 1}`,
            interviewDate: new Date(new Date().setDate(new Date().getDate() + 7)),
            interviewResult: i === 0 ? 'PASSED' : null,
            offerLetterUrl: i === 0 ? `/uploads/documents/offer_letter_${candidate.id}.pdf` : null,
            placementStatus: i === 0 ? 'OFFER_ACCEPTED' : i === 1 ? 'INTERVIEW_SCHEDULED' : 'INITIATED',
            contractUploaded: i === 0,
            candidateNotified: true,
            acceptanceConfirmed: i === 0,
            createdBy: admin.id,
          }
        });
        console.log(`  ✓ Created placement for candidate ${candidate.id}`);
      } else {
        console.log(`  ⏭️  Placement exists for candidate ${candidate.id}`);
      }
    }

    // 4. Create Companies/Employers
    console.log('\n🏢 Creating employer companies...');
    const companies = [
      {
        companyCode: 'EMP-001',
        companyName: 'Healthcare International Ltd',
        industry: 'Healthcare',
        country: 'United Kingdom',
        contactPerson: 'John Smith',
        email: 'recruitment@healthcare-intl.co.uk',
        phone: '+44 20 7123 4567',
      },
      {
        companyCode: 'EMP-002',
        companyName: 'Global Care Services',
        industry: 'Healthcare',
        country: 'Germany',
        contactPerson: 'Maria Schmidt',
        email: 'hr@globalcare.de',
        phone: '+49 30 1234 5678',
      },
      {
        companyCode: 'EMP-003',
        companyName: 'Tech Solutions Inc',
        industry: 'Technology',
        country: 'United States',
        contactPerson: 'Sarah Johnson',
        email: 'jobs@techsolutions.com',
        phone: '+1 555 123 4567',
      },
    ];

    for (const companyData of companies) {
      const existing = await prisma.company.findFirst({
        where: { name: companyData.companyName }
      });

      if (!existing) {
        const company = await prisma.company.create({
          data: {
            tenantId: 1,
            name: companyData.companyName,
            industry: companyData.industry,
            country: companyData.country,
            address: companyData.country === 'United Kingdom' ? 'London, UK' : companyData.country === 'Germany' ? 'Berlin, Germany' : 'New York, USA',
            contactPerson: companyData.contactPerson,
            email: companyData.email,
            phone: companyData.phone,
            status: 'Active',
            createdBy: admin.id,
          }
        });

        // Create job openings
        await prisma.jobOpening.create({
          data: {
            tenantId: 1,
            jobTitle: companyData.industry === 'Healthcare' ? 'Healthcare Assistant' : 'Software Developer',
            employerName: companyData.companyName,
            location: companyData.country === 'United Kingdom' ? 'London' : companyData.country === 'Germany' ? 'Berlin' : 'New York',
            jobType: 'Full-time',
            priority: 'High',
            description: `Exciting opportunity with ${companyData.companyName}. Join our team!`,
            requirements: 'Relevant training and certification required',
            openings: 5,
            salaryRange: companyData.country === 'United Kingdom' ? '£25,000 - £30,000' : '$50,000 - $70,000',
            status: 'OPEN',
          }
        });

        console.log(`  ✓ Created company: ${companyData.companyName} with job opening`);
      } else {
        console.log(`  ⏭️  Company exists: ${companyData.companyName}`);
      }
    }

    // 5. Create Certificates
    console.log('\n🎓 Creating certificates...');
    const completedEnrollments = await prisma.enrollment.findMany({
      where: { enrollmentStatus: 'COMPLETED' },
      include: { candidate: true, course: true },
      take: 5,
    });

    for (const enrollment of completedEnrollments) {
      const existing = await prisma.certificate.findFirst({
        where: { enrollmentId: enrollment.id }
      });

      if (!existing) {
        await prisma.certificate.create({
          data: {
            tenantId: 1,
            enrollmentId: enrollment.id,
            courseId: enrollment.courseId,
            certificateNumber: `CERT-${2024}-${String(enrollment.id).padStart(5, '0')}`,
            issueDate: new Date(),
            status: 'ISSUED',
            issuedBy: admin.id,
          }
        });
        console.log(`  ✓ Created certificate for ${enrollment.candidate.fullName}`);
      } else {
        console.log(`  ⏭️  Certificate exists for enrollment ${enrollment.id}`);
      }
    }

    console.log('\n✅ Comprehensive data seed completed successfully!\n');
    
    // Summary
    const stats = {
      vettingRecords: await prisma.vettingRecord.count(),
      cohorts: await prisma.cohort.count(),
      cohortSessions: await prisma.cohortSession.count(),
      cohortEnrollments: await prisma.cohortEnrollment.count(),
      placements: await prisma.placement.count(),
      companies: await prisma.company.count(),
      jobOpenings: await prisma.jobOpening.count(),
      certificates: await prisma.certificate.count(),
    };

    console.log('📊 Database Statistics:');
    console.log(`   Vetting Records: ${stats.vettingRecords}`);
    console.log(`   Cohorts: ${stats.cohorts}`);
    console.log(`   Cohort Sessions: ${stats.cohortSessions}`);
    console.log(`   Cohort Enrollments: ${stats.cohortEnrollments}`);
    console.log(`   Placements: ${stats.placements}`);
    console.log(`   Companies: ${stats.companies}`);
    console.log(`   Job Openings: ${stats.jobOpenings}`);
    console.log(`   Certificates: ${stats.certificates}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
