const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create roles
  const roles = [
    {
      name: 'Admin',
      description: 'System administrator with full access',
      permissions: {
        users: ['create', 'read', 'update', 'delete'],
        candidates: ['create', 'read', 'update', 'delete'],
        courses: ['create', 'read', 'update', 'delete'],
        placements: ['create', 'read', 'update', 'delete'],
        reports: ['read'],
        settings: ['read', 'update']
      }
    },
    {
      name: 'Trainer',
      description: 'Training instructor with course management access',
      permissions: {
        candidates: ['read', 'update'],
        courses: ['create', 'read', 'update'],
        enrollments: ['create', 'read', 'update'],
        attendance: ['create', 'read', 'update'],
        assessments: ['create', 'read', 'update']
      }
    },
    {
      name: 'Candidate',
      description: 'Training candidate with limited access',
      permissions: {
        profile: ['read', 'update'],
        documents: ['create', 'read', 'update'],
        progress: ['read']
      }
    },
    {
      name: 'Agent',
      description: 'Recruitment agent with candidate management access',
      permissions: {
        candidates: ['create', 'read', 'update'],
        documents: ['read'],
        placements: ['read']
      }
    },
    {
      name: 'Broker',
      description: 'Recruitment broker with referral access',
      permissions: {
        candidates: ['create', 'read'],
        referrals: ['create', 'read'],
        commissions: ['read']
      }
    },
    {
      name: 'Recruiter',
      description: 'Employer/Recruiter with placement access',
      permissions: {
        candidates: ['read'],
        placements: ['create', 'read', 'update'],
        jobs: ['create', 'read', 'update']
      }
    }
  ];

  console.log('📝 Creating roles...');
  for (const roleData of roles) {
    const existingRole = await prisma.role.findFirst({
      where: { name: roleData.name }
    });

    if (!existingRole) {
      await prisma.role.create({
        data: roleData
      });
      console.log(`✅ Created role: ${roleData.name}`);
    } else {
      console.log(`⏭️  Role already exists: ${roleData.name}`);
    }
  }

  // Create admin user
  const adminRole = await prisma.role.findFirst({
    where: { name: 'Admin' }
  });

  let admin;
  if (adminRole) {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@labourmobility.com' }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      admin = await prisma.user.create({
        data: {
          email: 'admin@labourmobility.com',
          password: hashedPassword,
          firstName: 'System',
          lastName: 'Administrator',
          phone: '+254700000000',
          roleId: adminRole.id,
          status: 'ACTIVE'
        }
      });
      console.log('✅ Created admin user: admin@labourmobility.com');
    } else {
      admin = existingAdmin;
      console.log('⏭️  Admin user already exists');
    }
  }

  // Create sample trainer
  const trainerRole = await prisma.role.findFirst({
    where: { name: 'Trainer' }
  });

  let trainerId;
  if (trainerRole) {
    const existingTrainer = await prisma.user.findUnique({
      where: { email: 'trainer@labourmobility.com' }
    });

    if (!existingTrainer) {
      const hashedPassword = await bcrypt.hash('trainer123', 12);
      
      const trainer = await prisma.user.create({
        data: {
          email: 'trainer@labourmobility.com',
          password: hashedPassword,
          firstName: 'John',
          lastName: 'Trainer',
          phone: '+254700000001',
          roleId: trainerRole.id,
          status: 'ACTIVE'
        }
      });
      trainerId = trainer.id;
      console.log('✅ Created trainer user: trainer@labourmobility.com');
    } else {
      trainerId = existingTrainer.id;
      console.log('⏭️  Trainer user already exists');
    }
  }

  // Create sample candidate
  const candidateRole = await prisma.role.findFirst({
    where: { name: 'Candidate' }
  });

  let candidateUserId;
  let candidateId;
  if (candidateRole) {
    const existingCandidate = await prisma.user.findUnique({
      where: { email: 'candidate@labourmobility.com' }
    });

    if (!existingCandidate) {
      const hashedPassword = await bcrypt.hash('candidate123', 12);
      
      const candidateUser = await prisma.user.create({
        data: {
          email: 'candidate@labourmobility.com',
          password: hashedPassword,
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+254700000002',
          roleId: candidateRole.id,
          status: 'ACTIVE'
        }
      });
      candidateUserId = candidateUser.id;

      // Create candidate profile
      const candidate = await prisma.candidate.create({
        data: {
          tenantId: 1,
          userId: candidateUserId,
          fullName: 'Jane Doe',
          gender: 'FEMALE',
          dob: new Date('1995-05-15'),
          nationalIdPassport: 'ID123456789',
          county: 'Nairobi',
          maritalStatus: 'Single',
          highestEducation: 'Bachelor of Business Administration',
          languages: ['English', 'Swahili'],
          relevantSkills: 'Communication, Problem Solving, Computer Skills',
          previousEmployer: 'ABC Company',
          previousRole: 'Customer Service Representative',
          previousDuration: '2 years',
          preferredCountry: 'Kenya',
          jobTypePreference: 'Full-time',
          willingToRelocate: true,
          declarationConfirmed: true
        }
      });
      candidateId = candidate.id;
      console.log('✅ Created candidate user: candidate@labourmobility.com');
    } else {
      candidateUserId = existingCandidate.id;
      let candidate = await prisma.candidate.findUnique({
        where: { userId: candidateUserId }
      });
      
      // If candidate profile doesn't exist, create it
      if (!candidate) {
        candidate = await prisma.candidate.create({
          data: {
            tenantId: 1,
            userId: candidateUserId,
            fullName: 'Jane Doe',
            gender: 'FEMALE',
            dob: new Date('1995-05-15'),
            nationalIdPassport: 'ID123456789',
            county: 'Nairobi',
            maritalStatus: 'Single',
            highestEducation: 'Bachelor of Business Administration',
            languages: ['English', 'Swahili'],
            relevantSkills: 'Communication, Problem Solving, Computer Skills',
            previousEmployer: 'ABC Company',
            previousRole: 'Customer Service Representative',
            previousDuration: '2 years',
            preferredCountry: 'Kenya',
            jobTypePreference: 'Full-time',
            willingToRelocate: true,
            declarationConfirmed: true
          }
        });
        console.log('✅ Created candidate profile for existing user');
      }
      
      candidateId = candidate.id;
      console.log('⏭️  Candidate user already exists');
    }
  }

  // Create sample recruiter
  const recruiterRole = await prisma.role.findFirst({
    where: { name: 'Recruiter' }
  });
  const agentRole = await prisma.role.findFirst({
    where: { name: 'Agent' }
  });

  if (recruiterRole) {
    const recruiterEmail = 'recruiter@labourmobility.com';
    const existingRecruiter = await prisma.user.findUnique({
      where: { email: recruiterEmail }
    });

    if (!existingRecruiter) {
      const hashedPassword = await bcrypt.hash('recruiter123', 12);
      const recruiterUser = await prisma.user.create({
        data: {
          email: recruiterEmail,
          password: hashedPassword,
          firstName: 'Rita',
          lastName: 'Recruiter',
          phone: '+254700000010',
          roleId: recruiterRole.id,
          tenantId: 1,
          status: 'ACTIVE'
        }
      });

      console.log('✅ Created recruiter user: recruiter@labourmobility.com');
    } else {
      const needsRoleUpdate = existingRecruiter.roleId !== recruiterRole.id;

      if (needsRoleUpdate) {
        await prisma.user.update({
          where: { id: existingRecruiter.id },
          data: { roleId: recruiterRole.id }
        });
        console.log('🔁 Updated existing recruiter user to Recruiter role');
      } else {
        console.log('⏭️  Recruiter user already exists');
      }
    }
  } else {
    console.warn('⚠️  Recruiter role not found; recruiter seed user was not created');
  }

  if (recruiterRole && agentRole) {
    const legacyAgents = await prisma.user.findMany({
      where: { roleId: agentRole.id }
    });

    for (const agentUser of legacyAgents) {
      await prisma.user.update({
        where: { id: agentUser.id },
        data: { roleId: recruiterRole.id }
      });
      console.log(`🔁 Updated legacy agent (${agentUser.email}) to Recruiter role`);
    }
  }

  // Create sample broker
  const brokerRole = await prisma.role.findFirst({
    where: { name: 'Broker' }
  });

  let brokerUserId;
  let brokerProfileId;
  if (brokerRole) {
    const existingBrokerUser = await prisma.user.findUnique({
      where: { email: 'broker@labourmobility.com' }
    });

    if (!existingBrokerUser) {
      const hashedPassword = await bcrypt.hash('broker123', 12);
      
      const brokerUser = await prisma.user.create({
        data: {
          email: 'broker@labourmobility.com',
          password: hashedPassword,
          firstName: 'Maria',
          lastName: 'Broker',
          phone: '+254700000004',
          roleId: brokerRole.id,
          tenantId: 1,
          status: 'ACTIVE'
        }
      });
      brokerUserId = brokerUser.id;

      // Create UserTenant membership
      await prisma.userTenant.create({
        data: {
          userId: brokerUserId,
          tenantId: 1,
          roleId: brokerRole.id
        }
      });

      // Create broker profile
      const brokerProfile = await prisma.broker.create({
        data: {
          tenantId: 1,
          name: 'Maria Broker & Associates',
          brokerCode: 'BRK001',
          contactDetails: {
            email: 'broker@labourmobility.com',
            phone: '+254700000004',
            address: 'Nairobi, Kenya'
          },
          referrerType: 'Individual',
          dateJoined: new Date(),
          commissionType: 'Percentage',
          commissionAmount: 5.0,
          paymentTerms: 'Net 30',
          createdBy: brokerUserId
        }
      });
      brokerProfileId = brokerProfile.id;
      
      console.log('✅ Created broker user: broker@labourmobility.com');
      console.log('✅ Created broker profile: Maria Broker & Associates');
    } else {
      brokerUserId = existingBrokerUser.id;
      
      // Check if broker profile exists
      const existingBrokerProfile = await prisma.broker.findFirst({
        where: { createdBy: brokerUserId }
      });

      if (!existingBrokerProfile) {
        const brokerProfile = await prisma.broker.create({
          data: {
            tenantId: 1,
            name: 'Maria Broker & Associates',
            brokerCode: 'BRK001',
            contactDetails: {
              email: 'broker@labourmobility.com',
              phone: '+254700000004',
              address: 'Nairobi, Kenya'
            },
            referrerType: 'Individual',
            dateJoined: new Date(),
            commissionType: 'Percentage',
            commissionAmount: 5.0,
            paymentTerms: 'Net 30',
            createdBy: brokerUserId
          }
        });
        brokerProfileId = brokerProfile.id;
        console.log('✅ Created broker profile for existing user');
      } else {
        brokerProfileId = existingBrokerProfile.id;
      }
      
      console.log('⏭️  Broker user already exists');
    }
  } else {
    console.warn('⚠️  Broker role not found; broker seed user was not created');
  }

  // Create sample courses
  if (trainerId) {
    console.log('📚 Creating sample courses...');
    
    const coursesData = [
      {
        tenantId: 1,
        title: 'Customer Service Excellence',
        code: 'CS101',
        description: 'Comprehensive customer service training program covering communication skills, conflict resolution, and service excellence.',
        durationDays: 60,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-03-15'),
        capacity: 30,
        status: 'ACTIVE',
        trainers: [trainerId]
      },
      {
        tenantId: 1,
        title: 'Digital Marketing Fundamentals',
        code: 'DM201',
        description: 'Learn the basics of digital marketing including SEO, social media marketing, and content creation.',
        durationDays: 60,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-03-31'),
        capacity: 25,
        status: 'ACTIVE',
        trainers: [trainerId]
      },
      {
        tenantId: 1,
        title: 'Data Analysis with Excel',
        code: 'DA301',
        description: 'Master data analysis techniques using Microsoft Excel. Learn formulas, pivot tables, and data visualization.',
        durationDays: 30,
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-02-20'),
        capacity: 20,
        status: 'COMPLETED',
        trainers: [trainerId]
      },
      {
        tenantId: 1,
        title: 'Professional Communication Skills',
        code: 'PC401',
        description: 'Enhance your professional communication skills including email writing, presentations, and business meetings.',
        durationDays: 30,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-31'),
        capacity: 35,
        status: 'ACTIVE',
        trainers: [trainerId]
      },
      {
        tenantId: 1,
        title: 'Introduction to Programming',
        code: 'IT501',
        description: 'Learn programming basics with Python. Perfect for beginners with no coding experience.',
        durationDays: 90,
        startDate: new Date('2024-02-15'),
        endDate: new Date('2024-05-15'),
        capacity: 20,
        status: 'ACTIVE',
        trainers: [trainerId]
      }
    ];

    const createdCourses = [];
    for (const courseData of coursesData) {
      const existing = await prisma.course.findUnique({
        where: { 
          tenantId_code: {
            tenantId: 1,
            code: courseData.code
          }
        }
      });

      if (!existing) {
        const course = await prisma.course.create({ data: courseData });
        createdCourses.push(course);
        console.log(`✅ Created course: ${course.title}`);
      } else {
        createdCourses.push(existing);
        console.log(`⏭️  Course already exists: ${existing.title}`);
      }
    }

    // Create enrollments for the candidate
    if (candidateId && createdCourses.length > 0) {
      console.log('📝 Creating course enrollments...');
      
      const enrollmentsData = [
        {
          tenantId: 1,
          courseId: createdCourses[0].id,
          candidateId: candidateId,
          enrollmentDate: new Date('2024-01-10'),
          enrollmentStatus: 'ENROLLED'
        },
        {
          tenantId: 1,
          courseId: createdCourses[1].id,
          candidateId: candidateId,
          enrollmentDate: new Date('2024-01-25'),
          enrollmentStatus: 'ENROLLED'
        },
        {
          tenantId: 1,
          courseId: createdCourses[2].id,
          candidateId: candidateId,
          enrollmentDate: new Date('2024-01-15'),
          enrollmentStatus: 'COMPLETED'
        },
        {
          tenantId: 1,
          courseId: createdCourses[3].id,
          candidateId: candidateId,
          enrollmentDate: new Date('2024-02-25'),
          enrollmentStatus: 'ENROLLED'
        }
      ];

      const createdEnrollments = [];
      for (const enrollmentData of enrollmentsData) {
        const existing = await prisma.enrollment.findFirst({
          where: {
            courseId: enrollmentData.courseId,
            candidateId: enrollmentData.candidateId
          }
        });

        if (!existing) {
          const enrollment = await prisma.enrollment.create({ data: enrollmentData });
          createdEnrollments.push(enrollment);
          console.log(`✅ Created enrollment for course ID: ${enrollmentData.courseId}`);
        } else {
          createdEnrollments.push(existing);
          console.log(`⏭️  Enrollment already exists for course ID: ${enrollmentData.courseId}`);
        }
      }

      // Create assessments for enrolled courses
      if (createdEnrollments.length > 0) {
        console.log('📊 Creating assessments...');
        
        const assessmentsData = [
          {
            tenantId: 1,
            courseId: createdCourses[0].id,
            enrollmentId: createdEnrollments[0].id,
            assessmentType: 'WRITTEN',
            score: 85,
            resultCategory: 'PASS',
            trainerComments: 'Excellent understanding of customer service principles.',
            date: new Date('2024-02-15')
          },
          {
            tenantId: 1,
            courseId: createdCourses[0].id,
            enrollmentId: createdEnrollments[0].id,
            assessmentType: 'PRACTICAL',
            score: null,
            resultCategory: null,
            trainerComments: null,
            date: new Date('2024-03-20')
          },
          {
            tenantId: 1,
            courseId: createdCourses[2].id,
            enrollmentId: createdEnrollments[2].id,
            assessmentType: 'PRACTICAL',
            score: 92,
            resultCategory: 'PASS',
            trainerComments: 'Outstanding work on data visualization project.',
            date: new Date('2024-02-18')
          }
        ];

        for (const assessmentData of assessmentsData) {
          const existing = await prisma.assessment.findFirst({
            where: {
              courseId: assessmentData.courseId,
              enrollmentId: assessmentData.enrollmentId,
              assessmentType: assessmentData.assessmentType
            }
          });

          if (!existing) {
            await prisma.assessment.create({ data: assessmentData });
            console.log(`✅ Created assessment for enrollment ID: ${assessmentData.enrollmentId}`);
          } else {
            console.log(`⏭️  Assessment already exists for enrollment ID: ${assessmentData.enrollmentId}`);
          }
        }
      }
    }
  }

  // Create cohorts
  const course = await prisma.course.findFirst({
    where: { status: 'ACTIVE' }
  });

  const trainer = await prisma.user.findUnique({
    where: { email: 'trainer@labourmobility.com' }
  });

  if (course && trainer && admin) {
    console.log('📚 Creating cohorts...');

    const cohortsData = [
      {
        tenantId: 1,
        courseId: course.id,
        cohortCode: 'COH-2024-001',
        cohortName: 'January 2024 Batch',
        description: 'First cohort of 2024 for healthcare workers',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-29'),
        enrollmentDeadline: new Date('2024-01-10'),
        maxCapacity: 25,
        currentEnrollment: 0,
        status: 'COMPLETED',
        leadTrainerId: trainer.id,
        location: 'Nairobi Training Center',
        scheduleInfo: 'Monday to Friday, 9:00 AM - 5:00 PM',
        createdBy: admin.id,
      },
      {
        tenantId: 1,
        courseId: course.id,
        cohortCode: 'COH-2024-002',
        cohortName: 'March 2024 Batch',
        description: 'Second cohort of 2024 for healthcare workers',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-15'),
        enrollmentDeadline: new Date('2024-02-25'),
        maxCapacity: 30,
        currentEnrollment: 0,
        status: 'IN_TRAINING',
        leadTrainerId: trainer.id,
        location: 'Nairobi Training Center',
        scheduleInfo: 'Monday to Friday, 9:00 AM - 5:00 PM',
        createdBy: admin.id,
      },
      {
        tenantId: 1,
        courseId: course.id,
        cohortCode: 'COH-2025-001',
        cohortName: 'January 2025 Batch',
        description: 'First cohort of 2025 for healthcare workers',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-29'),
        enrollmentDeadline: new Date('2025-01-10'),
        maxCapacity: 30,
        currentEnrollment: 0,
        status: 'ENROLLMENT_OPEN',
        leadTrainerId: trainer.id,
        location: 'Nairobi Training Center',
        scheduleInfo: 'Monday to Friday, 9:00 AM - 5:00 PM',
        createdBy: admin.id,
      },
    ];

    for (const cohortData of cohortsData) {
      const existing = await prisma.cohort.findUnique({
        where: { cohortCode: cohortData.cohortCode }
      });

      if (!existing) {
        const cohort = await prisma.cohort.create({ data: cohortData });
        console.log(`✅ Created cohort: ${cohortData.cohortName}`);

        // Create sessions for the cohort
        if (cohortData.status !== 'DRAFT') {
          const sessionsData = [];
          const daysOfTraining = Math.ceil((cohortData.endDate - cohortData.startDate) / (1000 * 60 * 60 * 24));
          
          for (let day = 1; day <= Math.min(daysOfTraining, 10); day++) {
            const sessionDate = new Date(cohortData.startDate);
            sessionDate.setDate(sessionDate.getDate() + (day - 1));
            
            sessionsData.push({
              cohortId: cohort.id,
              sessionNumber: day,
              sessionTitle: `Session ${day}: Healthcare Training`,
              sessionDate,
              startTime: new Date(sessionDate.setHours(9, 0, 0)),
              endTime: new Date(sessionDate.setHours(17, 0, 0)),
              facilitatorId: trainer.id,
              location: cohortData.location,
              topics: 'Patient care, safety protocols, and documentation',
              status: cohortData.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
              expectedAttendees: cohortData.maxCapacity,
              createdBy: admin.id,
            });
          }

          for (const sessionData of sessionsData) {
            await prisma.cohortSession.create({ data: sessionData });
          }
          console.log(`✅ Created ${sessionsData.length} sessions for cohort: ${cohortData.cohortName}`);
        }

        // Enroll some candidates if there are any
        const candidates = await prisma.candidate.findMany({
          take: 5,
          where: { status: 'ENROLLED' }
        });

        for (const candidate of candidates) {
          const enrollment = await prisma.enrollment.findFirst({
            where: {
              candidateId: candidate.id,
              courseId: course.id
            }
          });

          if (enrollment && cohortData.status !== 'DRAFT') {
            await prisma.cohortEnrollment.create({
              data: {
                cohortId: cohort.id,
                candidateId: candidate.id,
                enrollmentId: enrollment.id,
                status: 'ENROLLED',
                attendanceCount: cohortData.status === 'COMPLETED' ? 10 : 5,
                totalSessions: 10,
                attendanceRate: cohortData.status === 'COMPLETED' ? 100 : 50,
                assessmentsPassed: cohortData.status === 'COMPLETED' ? 1 : 0,
                vettingStatus: cohortData.status === 'COMPLETED' ? 'CLEARED' : 'PENDING',
                certificationIssued: cohortData.status === 'COMPLETED',
                placementReady: cohortData.status === 'COMPLETED',
                reviewedBy: admin.id,
                approvalDate: new Date(),
              }
            });
          }
        }

        // Update cohort enrollment count
        const enrolledCount = await prisma.cohortEnrollment.count({
          where: { cohortId: cohort.id, status: 'ENROLLED' }
        });

        await prisma.cohort.update({
          where: { id: cohort.id },
          data: { currentEnrollment: enrolledCount }
        });

        console.log(`✅ Enrolled ${enrolledCount} students in cohort: ${cohortData.cohortName}`);
      } else {
        console.log(`⏭️  Cohort already exists: ${cohortData.cohortName}`);
      }
    }
  }

  console.log('🎉 Database seed completed successfully!');
  console.log(`
📋 Default Users Created:
   Admin: admin@labourmobility.com / admin123
   Trainer: trainer@labourmobility.com / trainer123
  Candidate: candidate@labourmobility.com / candidate123
  Recruiter: recruiter@labourmobility.com / recruiter123

📊 Sample Data Created:
   5 Courses
   4 Enrollments
   3 Assessments
   3 Cohorts with Sessions and Enrollments
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
