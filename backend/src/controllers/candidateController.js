const prisma = require('../config/database');
const { createActivityLog } = require('../services/activityLogService');

/**
 * Get candidate dashboard data
 */
/**
 * Calculate profile completion percentage
 */
const calculateProfileCompletion = (candidate) => {
  if (!candidate) return 0;

  const requiredFields = [
    'fullName',
    'gender',
    'dob',
    'nationalIdPassport',
    'county',
    'maritalStatus',
    'highestEducation',
    'languages',
    'relevantSkills',
    'profilePhotoUrl',
    'passportCopyUrl',
    'idCopyUrl',
    'previousEmployer',
    'previousRole',
    'preferredCountry',
    'jobTypePreference',
  ];

  let completedFields = 0;

  requiredFields.forEach(field => {
    const value = candidate[field];
    if (value !== null && value !== undefined && value !== '') {
      // For JSON fields, check if not empty array/object
      if (typeof value === 'object') {
        if (Array.isArray(value) && value.length > 0) {
          completedFields++;
        } else if (!Array.isArray(value) && Object.keys(value).length > 0) {
          completedFields++;
        }
      } else {
        completedFields++;
      }
    }
  });

  return Math.round((completedFields / requiredFields.length) * 100);
};

/**
 * Get candidate dashboard data
 */
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔐 ===== DASHBOARD DATA REQUEST =====');
    console.log('🔐 User ID from JWT token:', userId);
    console.log('🔐 User email from JWT token:', req.user.email);
    console.log('🔐 User firstName from JWT token:', req.user.firstName);
    console.log('🔐 User lastName from JWT token:', req.user.lastName);
    console.log('🔐 Full req.user object:', JSON.stringify(req.user, null, 2));

    // Get candidate profile
    const candidate = await prisma.candidate.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    console.log('👤 ===== CANDIDATE PROFILE LOOKUP =====');
    console.log('👤 Searching for candidate with userId:', userId);
    console.log('👤 Candidate found:', candidate ? 'YES' : 'NO');
    if (candidate) {
      console.log('👤 Candidate ID:', candidate.id);
      console.log('👤 Candidate userId:', candidate.userId);
      console.log('👤 Candidate fullName:', candidate.fullName);
      console.log('👤 Candidate user.firstName:', candidate.user?.firstName);
      console.log('👤 Candidate user.lastName:', candidate.user?.lastName);
      console.log('👤 Candidate user.email:', candidate.user?.email);
    }

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Get enrollments with courses
    const enrollments = await prisma.enrollment.findMany({
      where: { candidateId: candidate.id },
      include: {
        course: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log('📚 getDashboardData - Enrollments found:', enrollments.length);
    console.log('📚 getDashboardData - Enrollment IDs:', enrollments.map(e => ({ enrollmentId: e.id, courseTitle: e.course.title, candidateId: e.candidateId })));

    // Get cohort enrollments
    const cohortEnrollments = await prisma.cohortEnrollment.findMany({
      where: { candidateId: candidate.id },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                code: true,
              },
            },
            leadTrainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                sessions: true,
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: { applicationDate: 'desc' },
    });

    // Get available cohorts for enrollment (ENROLLMENT_OPEN status)
    const availableCohorts = await prisma.cohort.findMany({
      where: {
        status: 'ENROLLMENT_OPEN',
        startDate: {
          gte: new Date(),
        },
        // Exclude cohorts already enrolled
        NOT: {
          enrollments: {
            some: {
              candidateId: candidate.id,
            },
          },
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        leadTrainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    });

    // Get upcoming events (assessments, interviews, etc.)
    const upcomingEvents = [];

    // Add cohort sessions
    const upcomingSessions = await prisma.cohortSession.findMany({
      where: {
        cohortId: {
          in: cohortEnrollments.map(e => e.cohortId),
        },
        sessionDate: {
          gte: new Date(),
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
      },
      include: {
        cohort: {
          select: {
            cohortName: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { sessionDate: 'asc' },
      take: 5,
    });

    upcomingSessions.forEach(session => {
      upcomingEvents.push({
        id: `session-${session.id}`,
        title: `${session.cohort.course.title} - ${session.topic || 'Session'}`,
        date: session.sessionDate.toISOString().split('T')[0],
        time: session.sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'session',
        location: session.location || 'Training Center',
        cohortName: session.cohort.cohortName,
      });
    });

    // Add assessment dates
    const assessments = await prisma.assessment.findMany({
      where: {
        courseId: {
          in: enrollments.map(e => e.courseId),
        },
        date: {
          gte: new Date(),
        },
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { date: 'asc' },
      take: 5,
    });

    assessments.forEach(assessment => {
      if (assessment.date) {
        upcomingEvents.push({
          id: `assessment-${assessment.id}`,
          title: `${assessment.course.title} - ${assessment.assessmentType}`,
          date: assessment.date.toISOString().split('T')[0],
          time: assessment.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: 'assessment',
          location: 'Training Center',
        });
      }
    });

    // Get job placements
    const placements = await prisma.placement.findMany({
      where: { candidateId: candidate.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Calculate stats
    const completedCourses = enrollments.filter(e => e.enrollmentStatus === 'COMPLETED').length;
    const inProgressCourses = enrollments.filter(e => e.enrollmentStatus === 'ENROLLED').length;
    const completedCohorts = cohortEnrollments.filter(e => e.status === 'COMPLETED').length;
    const activeCohorts = cohortEnrollments.filter(e => e.status === 'ENROLLED').length;
    const pendingCohortApplications = cohortEnrollments.filter(e => e.status === 'APPLIED').length;
    const certificates = await prisma.certificate.count({
      where: { enrollmentId: { in: enrollments.map(e => e.id) } },
    });

    // Calculate profile completion
    const profileCompletion = calculateProfileCompletion(candidate);
    
    console.log('📊 Profile completion calculation:', {
      candidateId: candidate.id,
      fullName: candidate.fullName,
      userFirstName: candidate.user?.firstName,
      userLastName: candidate.user?.lastName,
      profileCompletion,
      completedFields: Object.keys(candidate).filter(key => {
        const value = candidate[key];
        return value !== null && value !== undefined && value !== '';
      }).length
    });

    const responseData = {
      success: true,
      data: {
        profile: {
          ...candidate,
          firstName: candidate.user?.firstName,
          lastName: candidate.user?.lastName,
          email: candidate.user?.email,
          phone: candidate.user?.phone,
          completionRate: profileCompletion,
          skillsAssessed: enrollments.length,
          certificationsEarned: certificates,
          jobApplications: placements.length,
          interviewsScheduled: placements.filter(p => p.status === 'INTERVIEW_SCHEDULED').length,
        },
        currentCourses: enrollments.slice(0, 3).map(enrollment => ({
          id: enrollment.course.id,
          enrollmentId: enrollment.id,
          title: enrollment.course.title,
          progress: enrollment.progress || 0,
          nextSession: enrollment.course.startDate || new Date().toISOString(),
          instructor: enrollment.course.trainers && Array.isArray(enrollment.course.trainers) && enrollment.course.trainers.length > 0 ?
            enrollment.course.trainers[0].name || 'TBA' :
            'TBA',
          status: enrollment.status === 'COMPLETED' ? 'Completed' :
            enrollment.progress > 80 ? 'Almost Complete' : 'In Progress',
        })),
        myCohorts: cohortEnrollments.map(ce => ({
          id: ce.id,
          cohortId: ce.cohort.id,
          cohortName: ce.cohort.cohortName,
          cohortCode: ce.cohort.cohortCode,
          course: ce.cohort.course,
          status: ce.status,
          applicationDate: ce.applicationDate,
          approvalDate: ce.approvalDate,
          startDate: ce.cohort.startDate,
          endDate: ce.cohort.endDate,
          leadTrainer: ce.cohort.leadTrainer,
          sessionsCount: ce.cohort._count.sessions,
          studentsCount: ce.cohort._count.enrollments,
          progress: ce.progress || 0,
        })),
        availableCohorts: availableCohorts.map(cohort => ({
          id: cohort.id,
          cohortName: cohort.cohortName,
          cohortCode: cohort.cohortCode,
          course: cohort.course,
          startDate: cohort.startDate,
          endDate: cohort.endDate,
          enrollmentDeadline: cohort.enrollmentDeadline,
          leadTrainer: cohort.leadTrainer,
          maxCapacity: cohort.maxCapacity,
          currentEnrollment: cohort._count.enrollments,
          spotsLeft: cohort.maxCapacity - cohort._count.enrollments,
          description: cohort.description,
        })),
        upcomingEvents,
        stats: {
          activeCourses: inProgressCourses,
          completedCourses,
          activeCohorts,
          completedCohorts,
          pendingCohortApplications,
          certificates,
          applications: placements.length,
        },
      },
    };

    console.log('📤 ===== SENDING DASHBOARD RESPONSE =====');
    console.log('📤 Response profile.firstName:', responseData.data.profile.firstName);
    console.log('📤 Response profile.lastName:', responseData.data.profile.lastName);
    console.log('📤 Response profile.email:', responseData.data.profile.email);
    console.log('📤 Response profile.fullName:', responseData.data.profile.fullName);
    console.log('📤 Response profile.userId:', responseData.data.profile.userId);
    console.log('📤 Response profile.user.id:', responseData.data.profile.user?.id);
    
    res.json(responseData);
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get candidate's enrolled courses
 */
const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔐 getMyCourses - User ID from token:', userId);
    console.log('🔐 getMyCourses - User email:', req.user.email);

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    console.log('👤 getMyCourses - Candidate found:', candidate ? { id: candidate.id, userId: candidate.userId } : 'NULL');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { candidateId: candidate.id },
      include: {
        course: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('📚 getMyCourses - Query WHERE candidateId:', candidate.id);
    console.log('📚 getMyCourses - Enrollments found:', enrollments.length);
    console.log('📚 getMyCourses - Enrollment details:', enrollments.map(e => ({
      enrollmentId: e.id,
      courseTitle: e.course.title,
      candidateId: e.candidateId,
      status: e.enrollmentStatus
    })));

    // Fetch trainer details and calculate progress for each enrollment
    const coursesWithDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = enrollment.course;

        // Get trainer details if trainers array exists
        let trainers = [];
        if (course.trainers && Array.isArray(course.trainers)) {
          const trainerIds = course.trainers.map(t => typeof t === 'object' ? t.id : t).filter(Boolean);
          if (trainerIds.length > 0) {
            trainers = await prisma.user.findMany({
              where: { id: { in: trainerIds } },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            });
          }
        }

        // Calculate progress based on attendance
        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: {
            courseId: course.id,
          },
          select: { date: true },
          distinct: ['date'],
        });
        const totalSessions = attendanceRecords.length;

        const attendedSessions = await prisma.attendanceRecord.count({
          where: {
            enrollmentId: enrollment.id,
            status: 'PRESENT',
          },
        });

        const progress = totalSessions > 0
          ? Math.round((attendedSessions / totalSessions) * 100)
          : 0;

        // Get assessment completion count
        const totalAssessments = await prisma.assessment.count({
          where: { courseId: course.id },
        });

        const completedAssessments = await prisma.assessment.count({
          where: {
            enrollmentId: enrollment.id,
            score: { not: null },
          },
        });

        return {
          id: course.id,
          enrollmentId: enrollment.id,
          title: course.title,
          code: course.code,
          category: course.category,
          description: course.description,
          durationDays: course.durationDays,
          progress,
          status: enrollment.enrollmentStatus,
          startDate: course.startDate,
          endDate: course.endDate,
          location: course.location,
          capacity: course.capacity,
          trainers: trainers.map(t => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
            email: t.email,
          })),
          instructor: trainers.length > 0
            ? trainers.map(t => `${t.firstName} ${t.lastName}`).join(', ')
            : 'To Be Announced',
          enrolledAt: enrollment.createdAt,
          attendanceRate: totalSessions > 0
            ? Math.round((attendedSessions / totalSessions) * 100)
            : 0,
          assessments: {
            total: totalAssessments,
            completed: completedAssessments,
          },
        };
      })
    );

    res.json({
      success: true,
      data: coursesWithDetails,
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get course details
 */
const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        candidateId: candidate.id,
        courseId: parseInt(courseId),
      },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Get assessments for this enrollment
    const assessments = await prisma.assessment.findMany({
      where: { enrollmentId: enrollment.id },
      orderBy: { date: 'asc' },
    });

    // Get attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        enrollmentId: enrollment.id,
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: {
        course: enrollment.course,
        enrollment: {
          id: enrollment.id,
          status: enrollment.enrollmentStatus,
          progress: 0, // Would need calculation
          enrolledAt: enrollment.createdAt,
        },
        assessments,
        attendance: attendanceRecords,
      },
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get recommended jobs
 */
const mapJobOpeningResponse = (jobOpening, candidate = null) => ({
  id: jobOpening.id,
  jobTitle: jobOpening.jobTitle,
  employerName: jobOpening.employerName,
  location: jobOpening.location,
  jobType: jobOpening.jobType,
  priority: jobOpening.priority,
  openings: jobOpening.openings,
  salaryRange: jobOpening.salaryRange,
  status: jobOpening.status,
  interviewDate: jobOpening.interviewDate,
  description: jobOpening.description,
  requirements: jobOpening.requirements,
  createdAt: jobOpening.createdAt,
  updatedAt: jobOpening.updatedAt,
  postedAgo: getRelativeTime(jobOpening.createdAt),
  matchScore: candidate ? Math.floor(Math.random() * 25) + 75 : null,
});

const getCandidateJobOpenings = async (candidate) => {
  return prisma.jobOpening.findMany({
    where: {
      status: 'OPEN',
      ...(candidate?.tenantId ? { tenantId: candidate.tenantId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

const getJobOpenings = async (req, res) => {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { userId: req.user.id },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    const openings = await getCandidateJobOpenings(candidate);

    res.json({
      success: true,
      data: openings.map((opening) => mapJobOpeningResponse(opening, candidate)),
    });
  } catch (error) {
    console.error('Get job openings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job openings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getRecommendedJobs = async (req, res) => {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { userId: req.user.id },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    const openings = await getCandidateJobOpenings(candidate);

    res.json({
      success: true,
      data: openings.slice(0, 10).map((opening) => mapJobOpeningResponse(opening, candidate)),
    });
  } catch (error) {
    console.error('Get recommended jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommended jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Apply for a job
 */
const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const { coverLetter } = req.body;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    const jobOpening = await prisma.jobOpening.findFirst({
      where: {
        id: parseInt(jobId, 10),
        status: 'OPEN',
        ...(candidate.tenantId ? { tenantId: candidate.tenantId } : {}),
      },
    });

    if (!jobOpening) {
      return res.status(404).json({
        success: false,
        message: 'Job opening not found or no longer accepting applications',
      });
    }

    const existingApplication = await prisma.placement.findFirst({
      where: {
        candidateId: candidate.id,
        jobOpeningId: jobOpening.id,
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this role',
      });
    }

    const placement = await prisma.placement.create({
      data: {
        tenantId: jobOpening.tenantId || candidate.tenantId,
        candidateId: candidate.id,
        jobOpeningId: jobOpening.id,
        employerName: jobOpening.employerName,
        jobRoleOffered: jobOpening.jobTitle,
        country: jobOpening.location,
        recruitmentOfficerId: jobOpening.recruiterId,
        notes: coverLetter || '',
      },
      include: {
        jobOpening: true,
      },
    });

    await createActivityLog({
      userId,
      action: 'JOB_APPLICATION_SUBMITTED',
      resource: 'Placement',
      resourceId: placement.id,
      details: {
        jobOpeningId: jobOpening.id,
        jobTitle: jobOpening.jobTitle,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: placement,
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.update({
      where: {
        id: parseInt(notificationId),
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get candidate profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find or create candidate profile
    let candidate = await prisma.candidate.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!candidate) {
      // Auto-create candidate profile if it doesn't exist
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      candidate = await prisma.candidate.create({
        data: {
          userId: userId,
          tenantId: user.tenantId,
          status: 'APPLIED',
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      console.log('Auto-created candidate profile for user:', userId);
    }

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get candidate documents
 */
const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    const documents = await prisma.candidateDocument.findMany({
      where: { candidateId: candidate.id },
      orderBy: { uploadedAt: 'desc' },
      include: {
        uploadedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Upload candidate document
 */
const uploadDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    console.log('📤 UPLOAD REQUEST:');
    console.log('   File:', file);
    console.log('   Body:', req.body);
    console.log('   Headers:', req.headers['content-type']);

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    const documentType = req.body.type || 'document';
    
    // Move file to correct directory if it's a profile photo
    let fileUrl = `/uploads/documents/${file.filename}`;
    if (documentType === 'profile_photo') {
      const fs = require('fs');
      const path = require('path');
      const oldPath = file.path;
      const newPath = path.join(__dirname, '../../uploads/profile-photos', file.filename);
      
      // Move file to profile-photos directory
      fs.renameSync(oldPath, newPath);
      fileUrl = `/uploads/profile-photos/${file.filename}`;
    }

    // If it's a profile photo, just return the URL (will be saved via updateProfile)
    if (documentType === 'profile_photo') {
      return res.json({
        success: true,
        message: 'Photo uploaded successfully',
        data: {
          fileUrl: fileUrl,
          fileName: file.originalname,
        },
      });
    }

    // For other documents, save to database
    const document = await prisma.candidateDocument.create({
      data: {
        tenantId: candidate.tenantId,
        candidateId: candidate.id,
        documentType: documentType,
        fileUrl: fileUrl,
        uploadedBy: userId,
      },
      include: {
        uploadedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Log activity
    await createActivityLog({
      tenantId: candidate.tenantId,
      userId,
      action: 'CREATE',
      entityType: 'CANDIDATE_DOCUMENT',
      entityId: document.id,
      description: `Uploaded ${documentType} document`,
      metadata: { documentType, fileName: file.originalname },
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Delete candidate document
 */
const deleteDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    const document = await prisma.candidateDocument.findFirst({
      where: {
        id: parseInt(id),
        candidateId: candidate.id,
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    await prisma.candidateDocument.delete({
      where: { id: parseInt(id) },
    });

    // Log activity
    await createActivityLog({
      tenantId: candidate.tenantId,
      userId,
      action: 'DELETE',
      entityType: 'CANDIDATE_DOCUMENT',
      entityId: parseInt(id),
      description: `Deleted ${document.documentType} document`,
    });

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get candidate attendance records
 */
const getAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.query;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Get enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        candidateId: candidate.id,
        ...(courseId && { courseId: parseInt(courseId) }),
      },
    });

    const enrollmentIds = enrollments.map(e => e.id);

    const attendance = await prisma.attendanceRecord.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            enrollmentStatus: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      excused: attendance.filter(a => a.status === 'EXCUSED').length,
      attendanceRate: attendance.length > 0
        ? ((attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length / attendance.length) * 100).toFixed(1)
        : 0,
    };

    res.json({
      success: true,
      data: {
        records: attendance,
        statistics: stats,
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get candidate assessments
 */
const getAssessments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.query;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Get enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        candidateId: candidate.id,
        ...(courseId && { courseId: parseInt(courseId) }),
      },
    });

    const enrollmentIds = enrollments.map(e => e.id);

    const assessments = await prisma.assessment.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            enrollmentStatus: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate statistics
    const stats = {
      total: assessments.length,
      passed: assessments.filter(a => a.resultCategory === 'PASS').length,
      failed: assessments.filter(a => a.resultCategory === 'FAIL').length,
      incomplete: assessments.filter(a => a.resultCategory === 'INCOMPLETE').length,
      averageScore: assessments.length > 0 && assessments.some(a => a.score !== null)
        ? (assessments.filter(a => a.score !== null).reduce((sum, a) => sum + a.score, 0) / assessments.filter(a => a.score !== null).length).toFixed(1)
        : 0,
      passRate: assessments.length > 0
        ? ((assessments.filter(a => a.resultCategory === 'PASS').length / assessments.length) * 100).toFixed(1)
        : 0,
    };

    res.json({
      success: true,
      data: {
        assessments,
        statistics: stats,
      },
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get candidate certificates
 */
const getCertificates = async (req, res) => {
  try {
    const userId = req.user.id;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Get enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        candidateId: candidate.id,
      },
    });

    const enrollmentIds = enrollments.map(e => e.id);

    const certificates = await prisma.certificate.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
      },
      include: {
        enrollment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                code: true,
              },
            },
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    res.json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get available courses for enrollment
 */
const getAvailableCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Get already enrolled course IDs
    const enrollments = await prisma.enrollment.findMany({
      where: { candidateId: candidate.id },
      select: { courseId: true },
    });
    const enrolledCourseIds = enrollments.map(e => e.courseId);

    // Get available courses (not enrolled, active)
    const courses = await prisma.course.findMany({
      where: {
        tenantId: candidate.tenantId,
        id: { notIn: enrolledCourseIds.length > 0 ? enrolledCourseIds : undefined },
        status: 'ACTIVE',
      },
      orderBy: { startDate: 'asc' },
    });

    // Get trainer details and enrollment counts for each course
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        // Get trainer details
        let trainers = [];
        if (course.trainers && Array.isArray(course.trainers)) {
          const trainerIds = course.trainers.map(t => typeof t === 'object' ? t.id : t).filter(Boolean);
          if (trainerIds.length > 0) {
            trainers = await prisma.user.findMany({
              where: { id: { in: trainerIds } },
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            });
          }
        }

        // Get enrollment count
        const enrollmentCount = await prisma.enrollment.count({
          where: {
            courseId: course.id,
            enrollmentStatus: { in: ['ENROLLED', 'COMPLETED'] },
          },
        });

        return {
          ...course,
          trainers: trainers.map(t => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
          })),
          instructor: trainers.length > 0
            ? trainers.map(t => `${t.firstName} ${t.lastName}`).join(', ')
            : 'To Be Announced',
          enrollmentCount,
          availableSeats: course.capacity ? course.capacity - enrollmentCount : null,
        };
      })
    );

    res.json({
      success: true,
      data: coursesWithDetails,
    });
  } catch (error) {
    console.error('Get available courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Enroll in a course
 */
const enrollInCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        candidateId: candidate.id,
        courseId: parseInt(courseId),
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course',
      });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        tenantId: candidate.tenantId,
        courseId: parseInt(courseId),
        candidateId: candidate.id,
        enrollmentDate: new Date(),
        enrollmentStatus: 'APPLIED',
        paymentStatus: 'PENDING',
        createdBy: userId,
      },
      include: {
        course: true,
      },
    });

    // Log activity
    await createActivityLog({
      tenantId: candidate.tenantId,
      userId,
      action: 'CREATE',
      entityType: 'ENROLLMENT',
      entityId: enrollment.id,
      description: `Enrolled in course: ${course.title}`,
      metadata: { courseId: course.id, courseName: course.title },
    });

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment,
    });
  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Update candidate profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    console.log('🔄 UPDATE PROFILE REQUEST:');
    console.log('   User ID:', userId);
    console.log('   Updates:', JSON.stringify(updates, null, 2));

    // Separate User fields from Candidate fields
    const userFields = {};
    const candidateFields = {};

    // User table fields
    if (updates.firstName !== undefined) userFields.firstName = updates.firstName;
    if (updates.lastName !== undefined) userFields.lastName = updates.lastName;
    if (updates.phone !== undefined) userFields.phone = updates.phone;
    if (updates.email !== undefined) userFields.email = updates.email;

    // Candidate table fields (based on actual schema)
    if (updates.fullName !== undefined) candidateFields.fullName = updates.fullName;
    if (updates.gender !== undefined) candidateFields.gender = updates.gender;
    if (updates.dob !== undefined) candidateFields.dob = updates.dob;
    if (updates.dateOfBirth !== undefined) candidateFields.dob = updates.dateOfBirth; // alias
    if (updates.nationalIdPassport !== undefined) candidateFields.nationalIdPassport = updates.nationalIdPassport;
    if (updates.county !== undefined) candidateFields.county = updates.county;
    if (updates.maritalStatus !== undefined) candidateFields.maritalStatus = updates.maritalStatus;
    if (updates.highestEducation !== undefined) candidateFields.highestEducation = updates.highestEducation;
    
    // Handle languages field - convert array to JSON string or set to null if empty
    if (updates.languages !== undefined) {
      if (Array.isArray(updates.languages)) {
        candidateFields.languages = updates.languages.length > 0 
          ? JSON.stringify(updates.languages) 
          : null;
      } else if (typeof updates.languages === 'string') {
        candidateFields.languages = updates.languages || null;
      } else {
        candidateFields.languages = null;
      }
    }
    
    if (updates.relevantSkills !== undefined) candidateFields.relevantSkills = updates.relevantSkills;
    if (updates.profilePhotoUrl !== undefined) candidateFields.profilePhotoUrl = updates.profilePhotoUrl;
    if (updates.passportCopyUrl !== undefined) candidateFields.passportCopyUrl = updates.passportCopyUrl;
    if (updates.idCopyUrl !== undefined) candidateFields.idCopyUrl = updates.idCopyUrl;
    
    // Handle supportingCertificates field - convert array to JSON string or set to null if empty
    if (updates.supportingCertificates !== undefined) {
      if (Array.isArray(updates.supportingCertificates)) {
        candidateFields.supportingCertificates = updates.supportingCertificates.length > 0 
          ? JSON.stringify(updates.supportingCertificates) 
          : null;
      } else if (typeof updates.supportingCertificates === 'string') {
        candidateFields.supportingCertificates = updates.supportingCertificates || null;
      } else {
        candidateFields.supportingCertificates = null;
      }
    }
    
    if (updates.previousEmployer !== undefined) candidateFields.previousEmployer = updates.previousEmployer;
    if (updates.previousRole !== undefined) candidateFields.previousRole = updates.previousRole;
    if (updates.previousDuration !== undefined) candidateFields.previousDuration = updates.previousDuration;
    if (updates.referenceContact !== undefined) candidateFields.referenceContact = updates.referenceContact;
    if (updates.applyingViaAgent !== undefined) candidateFields.applyingViaAgent = updates.applyingViaAgent;
    if (updates.referredByBroker !== undefined) candidateFields.referredByBroker = updates.referredByBroker;
    if (updates.feeAgreementConfirmed !== undefined) candidateFields.feeAgreementConfirmed = updates.feeAgreementConfirmed;
    if (updates.medicalClearanceUrl !== undefined) candidateFields.medicalClearanceUrl = updates.medicalClearanceUrl;
    if (updates.policeClearanceUrl !== undefined) candidateFields.policeClearanceUrl = updates.policeClearanceUrl;
    if (updates.languageTestScore !== undefined) candidateFields.languageTestScore = updates.languageTestScore;
    if (updates.interviewStatus !== undefined) candidateFields.interviewStatus = updates.interviewStatus;
    if (updates.preferredCountry !== undefined) candidateFields.preferredCountry = updates.preferredCountry;
    if (updates.jobTypePreference !== undefined) candidateFields.jobTypePreference = updates.jobTypePreference;
    if (updates.willingToRelocate !== undefined) candidateFields.willingToRelocate = updates.willingToRelocate;
    if (updates.declarationConfirmed !== undefined) candidateFields.declarationConfirmed = updates.declarationConfirmed;

    // Find or create candidate profile
    let candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      // Auto-create candidate profile if it doesn't exist
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Get tenantId - use user's tenant or default tenant (ID 1)
      let tenantId = user.tenantId;
      if (!tenantId) {
        console.log('⚠️  User has no tenantId, using default tenant (ID: 1)');
        tenantId = 1;

        // Update user with default tenant
        await prisma.user.update({
          where: { id: userId },
          data: { tenantId: 1 }
        });
      }

      // Auto-generate fullName if not provided
      if (!candidateFields.fullName && (userFields.firstName || userFields.lastName)) {
        candidateFields.fullName = `${userFields.firstName || user.firstName || ''} ${userFields.lastName || user.lastName || ''}`.trim();
      } else if (!candidateFields.fullName) {
        candidateFields.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
      }

      candidate = await prisma.candidate.create({
        data: {
          userId: userId,
          tenantId: tenantId,
          fullName: candidateFields.fullName,
          ...candidateFields,
          status: 'APPLIED',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      console.log('Auto-created candidate profile for user:', userId);
    }

    // Update User table if there are user fields
    if (Object.keys(userFields).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userFields,
      });
      console.log('Updated user fields:', Object.keys(userFields));

      // If firstName or lastName changed, also update fullName in Candidate
      if (userFields.firstName || userFields.lastName) {
        const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
        candidateFields.fullName = `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim();
      }
    }

    // Update Candidate table if there are candidate fields
    if (Object.keys(candidateFields).length > 0) {
      candidateFields.updatedBy = userId;

      await prisma.candidate.update({
        where: { id: candidate.id },
        data: candidateFields,
      });
      console.log('Updated candidate fields:', Object.keys(candidateFields));
    }

    // Log activity
    await createActivityLog({
      tenantId: candidate.tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'CANDIDATE',
      entityId: candidate.id,
      description: 'Updated candidate profile',
      metadata: {
        updatedUserFields: Object.keys(userFields),
        updatedCandidateFields: Object.keys(candidateFields)
      },
    });

    // Fetch the updated candidate with fresh user data
    const finalCandidate = await prisma.candidate.findUnique({
      where: { id: candidate.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: finalCandidate,
    });
  } catch (error) {
    console.error('❌ UPDATE PROFILE ERROR:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Helper function to get relative time
function getRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/**
 * Get candidate attendance records
 */
const getAttendanceRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Get all enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { candidateId: candidate.id },
      select: { id: true },
    });

    const enrollmentIds = enrollments.map(e => e.id);

    // Build date filter
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        enrollment: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate stats
    const totalDays = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const absent = attendanceRecords.filter(r => r.status === 'ABSENT').length;
    const late = attendanceRecords.filter(r => r.status === 'LATE').length;
    const attendanceRate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    res.json({
      success: true,
      data: {
        records: attendanceRecords.map(record => ({
          id: record.id,
          date: record.date,
          status: record.status,
          courseId: record.courseId,
          courseName: record.course.title,
          sessionNumber: record.sessionNumber,
          remarks: record.remarks,
        })),
        stats: {
          totalDays,
          present,
          absent,
          late,
          attendanceRate,
        },
      },
    });
  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get candidate assessment results
 */
const getAssessmentResults = async (req, res) => {
  try {
    const userId = req.user.id;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Get all enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { candidateId: candidate.id },
      select: { id: true },
    });

    const enrollmentIds = enrollments.map(e => e.id);

    // Get assessments
    const assessments = await prisma.assessment.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Separate upcoming and completed
    const now = new Date();
    const upcoming = assessments.filter(a => a.date && a.date > now && !a.score);
    const completed = assessments.filter(a => a.score !== null && a.score !== undefined);

    // Calculate stats
    const completedCount = completed.length;
    const passedCount = completed.filter(a => a.resultCategory === 'PASS').length;
    const totalScore = completed.reduce((sum, a) => sum + (a.score || 0), 0);
    const averageScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;
    const highestScore = completedCount > 0 ? Math.max(...completed.map(a => a.score || 0)) : 0;

    // Calculate performance by month (last 6 months)
    const performanceData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const monthAssessments = completed.filter(a => {
        const aDate = new Date(a.date);
        return aDate.getMonth() === date.getMonth() && aDate.getFullYear() === date.getFullYear();
      });
      const monthScore = monthAssessments.length > 0
        ? Math.round(monthAssessments.reduce((sum, a) => sum + (a.score || 0), 0) / monthAssessments.length)
        : 0;
      performanceData.push({
        month: monthName,
        score: monthScore,
        average: monthScore > 0 ? monthScore - 5 : 0, // Simulated class average
      });
    }

    res.json({
      success: true,
      data: {
        upcoming: upcoming.map(a => ({
          id: a.id,
          title: `${a.course.title} - ${a.assessmentType}`,
          course: a.course.title,
          courseId: a.courseId,
          date: a.date,
          time: a.date ? new Date(a.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
          type: a.assessmentType,
          totalMarks: 100,
          duration: '2 hours',
        })),
        completed: completed.map(a => ({
          id: a.id,
          title: `${a.course.title} - ${a.assessmentType}`,
          course: a.course.title,
          courseId: a.courseId,
          date: a.date,
          score: a.score,
          totalMarks: 100,
          percentage: Math.round(a.score),
          grade: a.score >= 90 ? 'A' : a.score >= 80 ? 'B+' : a.score >= 70 ? 'B' : a.score >= 60 ? 'C' : 'D',
          status: a.resultCategory === 'PASS' ? 'passed' : 'failed',
          feedback: a.trainerComments || 'Good work! Keep it up.',
        })),
        stats: {
          averageScore,
          completedCount,
          passedCount,
          highestScore,
        },
        performanceData,
      },
    });
  } catch (error) {
    console.error('Get assessment results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assessment results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get candidate certificates and documents
 */
const getCertificatesAndDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Get all enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { candidateId: candidate.id },
      select: { id: true },
    });

    const enrollmentIds = enrollments.map(e => e.id);

    // Get certificates
    const certificates = await prisma.certificate.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
      },
      include: {
        enrollment: {
          include: {
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    // Get vetting records (documents)
    const vettingRecord = await prisma.vettingRecord.findFirst({
      where: { candidateId: candidate.id },
      orderBy: { createdAt: 'desc' },
    });

    // Build documents array from vetting record
    const documents = [];

    if (vettingRecord) {
      if (vettingRecord.policeDocumentUrl) {
        documents.push({
          id: `doc-police-${vettingRecord.id}`,
          type: 'Police Clearance',
          fileName: 'police_clearance.pdf',
          uploadDate: vettingRecord.createdAt,
          expiryDate: null,
          status: 'verified',
          size: '2.3 MB',
          url: vettingRecord.policeDocumentUrl,
        });
      }

      if (vettingRecord.medicalReportUrl) {
        documents.push({
          id: `doc-medical-${vettingRecord.id}`,
          type: 'Medical Clearance',
          fileName: 'medical_clearance.pdf',
          uploadDate: vettingRecord.createdAt,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          status: vettingRecord.medicalStatus === 'cleared' ? 'verified' : 'pending',
          size: '1.8 MB',
          url: vettingRecord.medicalReportUrl,
        });
      }
    }

    // Add placeholder for required documents
    const requiredDocTypes = ['Medical Clearance', 'Police Clearance', 'Passport', 'Education Certificate', 'Resume/CV'];
    const existingTypes = documents.map(d => d.type);

    requiredDocTypes.forEach(type => {
      if (!existingTypes.includes(type)) {
        documents.push({
          id: `doc-missing-${type.toLowerCase().replace(/\s+/g, '-')}`,
          type,
          fileName: null,
          uploadDate: null,
          expiryDate: null,
          status: 'missing',
          size: null,
          url: null,
        });
      }
    });

    res.json({
      success: true,
      data: {
        certificates: certificates.map(cert => ({
          id: cert.id,
          name: `${cert.enrollment.course.title} Certificate`,
          course: cert.enrollment.course.title,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          status: cert.status.toLowerCase(),
          certificateNumber: cert.certificateNumber,
          verificationCode: cert.certificateNumber,
          grade: cert.grade,
          downloadUrl: cert.pdfUrl,
        })),
        documents: documents.map(doc => ({
          id: doc.id,
          type: doc.type,
          fileName: doc.fileName,
          uploadDate: doc.uploadDate,
          expiryDate: doc.expiryDate,
          status: doc.status,
          size: doc.size,
          url: doc.url,
        })),
      },
    });
  } catch (error) {
    console.error('Get certificates and documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates and documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get candidate placement and job application data
 */
const getPlacementData = async (req, res) => {
  try {
    const userId = req.user.id;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Get placements (job applications)
    const placements = await prisma.placement.findMany({
      where: { candidateId: candidate.id },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate placement journey stage
    const vettingRecord = await prisma.vettingRecord.findFirst({
      where: { candidateId: candidate.id },
      orderBy: { createdAt: 'desc' },
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { candidateId: candidate.id },
    });

    const hasCompletedCourse = enrollments.some(e => e.enrollmentStatus === 'COMPLETED');
    const isVetted = vettingRecord && vettingRecord.vettingStatus === 'CLEARED';
    const hasPlacement = placements.length > 0;
    const hasOffer = placements.some(p => p.offerLetterUrl);
    const hasVisa = placements.some(p => p.visaStatus === 'APPROVED');
    const isDeployed = placements.some(p => p.placementStatus === 'COMPLETED');

    // Build placement stages
    const placementStages = [
      {
        label: 'Profile Verification',
        status: candidate.profileCompletionRate >= 100 ? 'completed' : 'active',
        date: candidate.createdAt,
      },
      {
        label: 'Skills Assessment',
        status: hasCompletedCourse ? 'completed' : 'pending',
        date: hasCompletedCourse ? enrollments.find(e => e.enrollmentStatus === 'COMPLETED')?.updatedAt : null,
      },
      {
        label: 'Job Matching',
        status: hasPlacement ? 'completed' : 'pending',
        date: hasPlacement ? placements[0]?.createdAt : null,
      },
      {
        label: 'Interview Process',
        status: placements.some(p => p.interviewDate) ? 'completed' : 'pending',
        date: placements.find(p => p.interviewDate)?.interviewDate,
      },
      {
        label: 'Offer Negotiation',
        status: hasOffer ? 'completed' : 'pending',
        date: placements.find(p => p.offerLetterUrl)?.updatedAt,
      },
      {
        label: 'Contract Signing',
        status: placements.some(p => p.contractUploaded) ? 'completed' : 'pending',
        date: placements.find(p => p.contractUploaded)?.updatedAt,
      },
      {
        label: 'Visa Processing',
        status: hasVisa ? 'completed' : 'pending',
        date: placements.find(p => p.visaStatus === 'APPROVED')?.updatedAt,
      },
      {
        label: 'Deployment',
        status: isDeployed ? 'completed' : 'pending',
        date: placements.find(p => p.placementStatus === 'COMPLETED')?.placementCompletedDate,
      },
    ];

    // Format applications
    const applications = placements.map(p => {
      const matchScore = Math.floor(Math.random() * 20) + 80; // 80-100%
      let status = 'under_review';
      if (p.interviewDate) status = 'interview_scheduled';
      if (p.offerLetterUrl) status = 'accepted';
      if (p.placementStatus === 'CANCELLED') status = 'rejected';

      return {
        id: p.id,
        jobTitle: p.jobRoleOffered || 'Position Available',
        company: p.employerName || 'Employer',
        location: p.country || 'International',
        salary: 'Competitive',
        status,
        matchScore,
        appliedDate: p.createdAt,
        interviewDate: p.interviewDate,
        interviewTime: p.interviewDate ? new Date(p.interviewDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
      };
    });

    // Format interviews
    const interviews = placements
      .filter(p => p.interviewDate && new Date(p.interviewDate) > new Date())
      .map(p => ({
        id: p.id,
        jobTitle: p.jobRoleOffered || 'Position Available',
        company: p.employerName || 'Employer',
        date: p.interviewDate,
        time: new Date(p.interviewDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        type: 'Video Interview',
        interviewer: 'HR Manager',
        interviewerRole: 'Hiring Manager',
        platform: 'Zoom',
        meetingLink: 'https://zoom.us/j/meeting',
      }));

    // Visa progress
    const activeVisa = placements.find(p => p.visaApplicationNo);
    const visaProgress = activeVisa ? {
      stage: activeVisa.visaStatus === 'APPROVED' ? 'approved' : 'active',
      steps: [
        {
          label: 'Document Submission',
          status: activeVisa.visaApplicationNo ? 'completed' : 'pending',
          date: activeVisa.createdAt,
        },
        {
          label: 'Embassy Processing',
          status: activeVisa.visaStatus === 'PROCESSING' ? 'active' : activeVisa.visaStatus === 'APPROVED' ? 'completed' : 'pending',
          date: null,
        },
        {
          label: 'Medical Examination',
          status: isVetted ? 'completed' : 'pending',
          date: vettingRecord?.reviewDate,
        },
        {
          label: 'Visa Approval',
          status: activeVisa.visaStatus === 'APPROVED' ? 'completed' : 'pending',
          date: activeVisa.visaStatus === 'APPROVED' ? activeVisa.updatedAt : null,
        },
        {
          label: 'Travel Arrangements',
          status: activeVisa.travelDate ? 'completed' : 'pending',
          date: activeVisa.travelDate,
        },
      ],
    } : {
      stage: 'not_started',
      steps: [],
    };

    res.json({
      success: true,
      data: {
        placementStages,
        applications,
        interviews,
        matchedEmployers: [], // Would need separate employer matching table
        visaProgress,
      },
    });
  } catch (error) {
    console.error('Get placement data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch placement data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get available cohorts for enrollment
 */
const getAvailableCohorts = async (req, res) => {
  try {
    const userId = req.user.id;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    const availableCohorts = await prisma.cohort.findMany({
      where: {
        status: 'ENROLLMENT_OPEN',
        startDate: {
          gte: new Date(),
        },
        // Exclude cohorts already enrolled
        NOT: {
          enrollments: {
            some: {
              candidateId: candidate.id,
            },
          },
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            description: true,
            durationDays: true,
          },
        },
        leadTrainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            sessions: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    res.json({
      success: true,
      data: availableCohorts.map(cohort => ({
        id: cohort.id,
        cohortName: cohort.cohortName,
        cohortCode: cohort.cohortCode,
        course: cohort.course,
        startDate: cohort.startDate,
        endDate: cohort.endDate,
        enrollmentDeadline: cohort.enrollmentDeadline,
        leadTrainer: cohort.leadTrainer,
        maxCapacity: cohort.maxCapacity,
        currentEnrollment: cohort._count.enrollments,
        spotsLeft: cohort.maxCapacity - cohort._count.enrollments,
        description: cohort.description,
        location: cohort.location,
        scheduleInfo: cohort.scheduleInfo,
        sessionsCount: cohort._count.sessions,
      })),
    });
  } catch (error) {
    console.error('Get available cohorts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available cohorts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Apply for a cohort
 */
const applyForCohort = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cohortId } = req.params;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
      select: { id: true, fullName: true },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Check if cohort exists and is open for enrollment
    const cohort = await prisma.cohort.findUnique({
      where: { id: parseInt(cohortId) },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    if (cohort.status !== 'ENROLLMENT_OPEN') {
      return res.status(400).json({
        success: false,
        message: 'This cohort is not open for enrollment',
      });
    }

    if (cohort._count.enrollments >= cohort.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'This cohort is at full capacity',
      });
    }

    // Check if already enrolled or applied
    const existingEnrollment = await prisma.cohortEnrollment.findFirst({
      where: {
        cohortId: parseInt(cohortId),
        candidateId: candidate.id,
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: `You have already ${existingEnrollment.status === 'APPLIED' ? 'applied to' : 'enrolled in'} this cohort`,
      });
    }

    // Create enrollment application
    const enrollment = await prisma.cohortEnrollment.create({
      data: {
        cohortId: parseInt(cohortId),
        candidateId: candidate.id,
        status: 'APPLIED',
        applicationDate: new Date(),
      },
      include: {
        cohort: {
          select: {
            cohortName: true,
            cohortCode: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Application submitted successfully. Awaiting admin approval.',
      data: enrollment,
    });
  } catch (error) {
    console.error('Apply for cohort error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for cohort',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get candidate's cohorts
 */
const getMyCohorts = async (req, res) => {
  try {
    const userId = req.user.id;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    const cohortEnrollments = await prisma.cohortEnrollment.findMany({
      where: { candidateId: candidate.id },
      include: {
        cohort: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                code: true,
              },
            },
            leadTrainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                sessions: true,
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: { applicationDate: 'desc' },
    });

    res.json({
      success: true,
      data: cohortEnrollments.map(ce => ({
        id: ce.id,
        cohortId: ce.cohort.id,
        cohortName: ce.cohort.cohortName,
        cohortCode: ce.cohort.cohortCode,
        course: ce.cohort.course,
        status: ce.status,
        vettingStatus: ce.vettingStatus, // Include vetting status
        applicationDate: ce.applicationDate,
        approvalDate: ce.approvalDate,
        startDate: ce.cohort.startDate,
        endDate: ce.cohort.endDate,
        leadTrainer: ce.cohort.leadTrainer,
        sessionsCount: ce.cohort._count.sessions,
        studentsCount: ce.cohort._count.enrollments,
        progress: ce.progress || 0,
      })),
    });
  } catch (error) {
    console.error('Get my cohorts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cohorts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get vetting status
const getVettingStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find candidate profile
    const candidate = await prisma.candidate.findUnique({
      where: { userId: userId },
    });

    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    const vettingRecords = await prisma.vettingRecord.findMany({
      where: { candidateId: candidate.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: vettingRecords,
    });
  } catch (error) {
    console.error('Get vetting status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vetting status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Apply for vetting
const applyForVetting = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enrollmentId, policeClearanceNo, medicalReportNo } = req.body;

    // Find candidate profile
    const candidate = await prisma.candidate.findUnique({
      where: { userId: userId },
    });

    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    const candidateId = candidate.id;

    // Check if enrollment exists and belongs to this candidate
    const enrollment = await prisma.cohortEnrollment.findFirst({
      where: {
        id: parseInt(enrollmentId),
        candidateId: candidateId,
        status: 'ENROLLED', // Must be enrolled to apply for vetting
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Valid enrollment not found. You must be enrolled in a cohort to apply for vetting.',
      });
    }

    // Check if vetting record already exists for this candidate
    const existingVetting = await prisma.vettingRecord.findFirst({
      where: {
        candidateId: candidateId,
        vettingStatus: {
          in: ['PENDING', 'PENDING_DOCUMENTS', 'IN_PROGRESS'],
        },
      },
    });

    if (existingVetting) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending vetting application',
        data: existingVetting,
      });
    }

    // Create vetting record
    const vettingRecord = await prisma.vettingRecord.create({
      data: {
        tenantId: req.user.tenantId || 1,
        candidateId: candidateId,
        policeClearanceNo: policeClearanceNo || null,
        medicalReportNo: medicalReportNo || null,
        vettingStatus: 'PENDING_DOCUMENTS',
        createdBy: req.user.id,
      },
    });

    // Update enrollment vetting status
    await prisma.cohortEnrollment.update({
      where: { id: parseInt(enrollmentId) },
      data: { vettingStatus: 'PENDING' },
    });

    res.json({
      success: true,
      message: 'Vetting application submitted successfully. Please upload required documents.',
      data: vettingRecord,
    });
  } catch (error) {
    console.error('Apply for vetting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit vetting application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Update vetting documents
const updateVettingDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vettingId } = req.params;

    // Find candidate profile
    const candidate = await prisma.candidate.findUnique({
      where: { userId: userId },
    });

    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Verify vetting record belongs to this candidate
    const vettingRecord = await prisma.vettingRecord.findFirst({
      where: {
        id: parseInt(vettingId),
        candidateId: candidate.id,
      },
    });

    if (!vettingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Vetting record not found',
      });
    }

    const updateData = {
      updatedBy: req.user.id,
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.policeDocument && req.files.policeDocument[0]) {
        updateData.policeDocumentUrl = req.files.policeDocument[0].path;
      }
      if (req.files.medicalReport && req.files.medicalReport[0]) {
        updateData.medicalReportUrl = req.files.medicalReport[0].path;
      }
      if (req.files.vaccinationProof && req.files.vaccinationProof[0]) {
        updateData.vaccinationProofUrl = req.files.vaccinationProof[0].path;
      }
    }

    // Update status if documents are uploaded
    if (updateData.policeDocumentUrl || updateData.medicalReportUrl) {
      updateData.vettingStatus = 'IN_PROGRESS';
    }

    const updatedVetting = await prisma.vettingRecord.update({
      where: { id: parseInt(vettingId) },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Vetting documents uploaded successfully',
      data: updatedVetting,
    });
  } catch (error) {
    console.error('Update vetting documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload vetting documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getDashboardData,
  getMyCourses,
  getCourseDetails,
  getRecommendedJobs,
  applyForJob,
  getNotifications,
  markNotificationAsRead,
  getProfile,
  updateProfile,
  getDocuments,
  uploadDocument,
  deleteDocument,
  getAttendance,
  getAssessments,
  getCertificates,
  getAvailableCourses,
  enrollInCourse,
  // New comprehensive endpoints
  getAttendanceRecords,
  getAssessmentResults,
  getCertificatesAndDocuments,
  getPlacementData,
  // Cohort endpoints
  getAvailableCohorts,
  applyForCohort,
  getMyCohorts,
  // Vetting endpoints
  getVettingStatus,
  applyForVetting,
  updateVettingDocuments,
};
