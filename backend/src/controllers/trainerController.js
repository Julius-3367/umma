const prisma = require('../config/database');

/**
 * Get trainer dashboard overview
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get cohorts where this user is the lead trainer (using userId directly)
    const cohorts = await prisma.cohort.findMany({
      where: {
        leadTrainerId: userId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            sessions: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const cohortIds = cohorts.map(c => c.id);

    // Get cohort enrollments for these cohorts
    const cohortEnrollments = await prisma.cohortEnrollment.findMany({
      where: {
        cohortId: { in: cohortIds },
      },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        cohort: {
          select: {
            cohortName: true,
            cohortCode: true,
          },
        },
      },
      orderBy: { applicationDate: 'desc' },
      take: 10,
    });

    // Get upcoming sessions
    const upcomingSessions = await prisma.cohortSession.findMany({
      where: {
        cohortId: { in: cohortIds },
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
            cohortCode: true,
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

    // Get courses where trainer is assigned (legacy support)
    const allCourses = await prisma.course.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    // Filter courses where trainer ID is in trainers array
    const trainerCourses = allCourses.filter(course => {
      if (course.trainers && Array.isArray(course.trainers)) {
        return course.trainers.includes(userId);
      }
      return false;
    });

    const courseIds = trainerCourses.map(c => c.id);

    // Get statistics
    const [
      enrollments,
      activeEnrollments,
      completedEnrollments,
      pendingAssessments,
      todayAttendance,
    ] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          courseId: { in: courseIds },
        },
        select: {
          candidateId: true,
        },
      }),
      prisma.enrollment.count({
        where: {
          courseId: { in: courseIds },
          enrollmentStatus: 'ENROLLED',
        },
      }),
      prisma.enrollment.count({
        where: {
          courseId: { in: courseIds },
          enrollmentStatus: 'COMPLETED',
        },
      }),
      prisma.assessment.count({
        where: {
          courseId: { in: courseIds },
          score: null,
        },
      }),
      prisma.attendanceRecord.count({
        where: {
          courseId: { in: courseIds },
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    // Calculate unique students
    const uniqueStudents = new Set(enrollments.map(e => e.candidateId));
    const totalStudents = uniqueStudents.size;

    // Get cohort stats
    const activeCohorts = cohorts.filter(c => c.status === 'IN_TRAINING' || c.status === 'ENROLLMENT_OPEN').length;
    const completedCohorts = cohorts.filter(c => c.status === 'COMPLETED').length;
    const totalCohortStudents = cohortEnrollments.filter(e => e.status === 'ENROLLED').length;
    const pendingApprovals = cohortEnrollments.filter(e => e.status === 'APPLIED').length;

    // Get recent enrollments
    const recentEnrollments = await prisma.enrollment.findMany({
      where: {
        courseId: { in: courseIds },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        candidate: {
          select: {
            fullName: true,
            user: {
              select: {
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
    });

    // Get upcoming assessments
    const upcomingAssessments = await prisma.assessment.findMany({
      where: {
        courseId: { in: courseIds },
        date: {
          gte: new Date(),
        },
      },
      take: 5,
      orderBy: { date: 'asc' },
      include: {
        course: {
          select: {
            title: true,
          },
        },
        enrollment: {
          include: {
            candidate: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalCourses: trainerCourses.length,
          totalStudents,
          activeEnrollments,
          completedEnrollments,
          pendingAssessments,
          todayAttendance,
          completionRate: activeEnrollments > 0 
            ? ((completedEnrollments / (activeEnrollments + completedEnrollments)) * 100).toFixed(1)
            : 0,
          // Cohort stats
          totalCohorts: cohorts.length,
          activeCohorts,
          completedCohorts,
          totalCohortStudents,
          pendingApprovals,
        },
        courses: trainerCourses,
        cohorts: cohorts.map(c => ({
          id: c.id,
          cohortName: c.cohortName,
          cohortCode: c.cohortCode,
          course: c.course,
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
          studentsCount: c._count.enrollments,
          sessionsCount: c._count.sessions,
          maxCapacity: c.maxCapacity,
        })),
        recentEnrollments,
        cohortEnrollments,
        upcomingAssessments,
        upcomingSessions,
      },
    });
  } catch (error) {
    console.error('Trainer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};

/**
 * Get all courses for trainer
 */
const getMyCourses = async (req, res) => {
  try {
    const trainerId = req.user.id;

    const allCourses = await prisma.course.findMany({
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    // Filter courses where trainer is assigned
    const trainerCourses = allCourses.filter(course => {
      if (course.trainers && Array.isArray(course.trainers)) {
        return course.trainers.includes(trainerId);
      }
      return false;
    });

    res.json({
      success: true,
      data: trainerCourses,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message,
    });
  }
};

/**
 * Get course details with students
 */
const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const trainerId = req.user.id;

    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Verify trainer is assigned to this course
    if (!course.trainers || !course.trainers.includes(trainerId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this course',
      });
    }

    // Get enrollments with student details
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: parseInt(courseId) },
      include: {
        candidate: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get assessments
    const assessments = await prisma.assessment.findMany({
      where: { courseId: parseInt(courseId) },
      include: {
        enrollment: {
          include: {
            candidate: {
              select: {
                id: true,
                fullName: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: {
        course,
        enrollments,
        assessments,
        stats: {
          totalStudents: enrollments.length,
          activeStudents: enrollments.filter(e => e.enrollmentStatus === 'ENROLLED').length,
          completedStudents: enrollments.filter(e => e.enrollmentStatus === 'COMPLETED').length,
          totalAssessments: assessments.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course details',
      error: error.message,
    });
  }
};

/**
 * Get students for a course
 */
const getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const trainerId = req.user.id;

    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Verify trainer access
    if (!course.trainers || !course.trainers.includes(trainerId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: parseInt(courseId) },
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
            dob: true,
            nationalIdPassport: true,
            gender: true,
            county: true,
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        candidate: {
          fullName: 'asc',
        },
      },
    });

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message,
    });
  }
};

/**
 * Record attendance
 */
const recordAttendance = async (req, res) => {
  try {
    const { enrollmentId, status, remarks, date, sessionNumber } = req.body;
    const trainerId = req.user.id;

    if (!enrollmentId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment ID and status are required',
      });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: parseInt(enrollmentId) },
      include: { course: true },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Verify trainer access
    if (!enrollment.course.trainers || !enrollment.course.trainers.includes(trainerId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        enrollmentId: parseInt(enrollmentId),
        courseId: enrollment.courseId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingRecord) {
      const updatedAttendance = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          status,
          remarks,
          sessionNumber: sessionNumber ?? existingRecord.sessionNumber,
          date: attendanceDate,
          recordedBy: trainerId,
        },
      });

      return res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: updatedAttendance,
      });
    }

    const attendance = await prisma.attendanceRecord.create({
      data: {
        tenantId: enrollment.tenantId,
        enrollmentId: parseInt(enrollmentId),
        courseId: enrollment.courseId,
        date: attendanceDate,
        sessionNumber: sessionNumber || null,
        status,
        remarks,
        recordedBy: trainerId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording attendance',
      error: error.message,
    });
  }
};

/**
 * Create/Update assessment
 */
const createAssessment = async (req, res) => {
  try {
    const { enrollmentId, assessmentTitle, assessmentType, maxScore, score, resultCategory, trainerComments, feedback, date } = req.body;
    const trainerId = req.user.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: parseInt(enrollmentId) },
      include: { course: true },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Verify trainer access
    if (!enrollment.course.trainers || !enrollment.course.trainers.includes(trainerId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Calculate percentage and result category
    const maxScoreValue = maxScore ? parseFloat(maxScore) : 100;
    const scoreValue = score ? parseFloat(score) : null;
    const percentageValue = scoreValue !== null ? (scoreValue / maxScoreValue) * 100 : null;
    
    let autoResultCategory = resultCategory;
    if (!autoResultCategory && percentageValue !== null) {
      autoResultCategory = percentageValue >= 50 ? 'PASS' : 'FAIL';
    }

    const assessment = await prisma.assessment.create({
      data: {
        tenantId: enrollment.tenantId,
        courseId: enrollment.courseId,
        enrollmentId: parseInt(enrollmentId),
        assessmentTitle: assessmentTitle || assessmentType,
        assessmentType,
        maxScore: maxScoreValue,
        score: scoreValue,
        percentage: percentageValue,
        resultCategory: autoResultCategory,
        trainerComments,
        feedback,
        date: date ? new Date(date) : new Date(),
        createdBy: trainerId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment,
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating assessment',
      error: error.message,
    });
  }
};

/**
 * Update assessment
 */
const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { assessmentTitle, maxScore, score, resultCategory, trainerComments, feedback } = req.body;
    const trainerId = req.user.id;

    const assessment = await prisma.assessment.findUnique({
      where: { id: parseInt(id) },
      include: {
        course: true,
      },
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found',
      });
    }

    // Verify trainer access
    if (!assessment.course.trainers || !assessment.course.trainers.includes(trainerId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Calculate percentage if score is being updated
    const updateData = {
      updatedBy: trainerId,
    };

    if (assessmentTitle !== undefined) updateData.assessmentTitle = assessmentTitle;
    if (maxScore !== undefined) updateData.maxScore = parseFloat(maxScore);
    if (score !== undefined) {
      updateData.score = parseFloat(score);
      const maxScoreVal = maxScore !== undefined ? parseFloat(maxScore) : (assessment.maxScore || 100);
      updateData.percentage = (parseFloat(score) / maxScoreVal) * 100;
      
      // Auto-calculate result if not provided
      if (!resultCategory) {
        updateData.resultCategory = updateData.percentage >= 50 ? 'PASS' : 'FAIL';
      }
    }
    if (resultCategory) updateData.resultCategory = resultCategory;
    if (trainerComments !== undefined) updateData.trainerComments = trainerComments;
    if (feedback !== undefined) updateData.feedback = feedback;

    const updated = await prisma.assessment.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Assessment updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assessment',
      error: error.message,
    });
  }
};

/**
 * Get attendance records for a course
 */
const getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const trainerId = req.user.id;

    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Verify trainer access
    if (!course.trainers || !course.trainers.includes(trainerId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const attendance = await prisma.attendanceRecord.findMany({
      where: { courseId: parseInt(courseId) },
      include: {
        enrollment: {
          include: {
            candidate: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message,
    });
  }
};

/**
 * Get trainer's cohorts
 */
const getMyCohorts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const where = {
      leadTrainerId: userId,
    };

    if (status) {
      where.status = status;
    }

    const [cohorts, total] = await Promise.all([
      prisma.cohort.findMany({
        where,
        include: {
          course: {
            select: {
              title: true,
              code: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              sessions: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.cohort.count({ where }),
    ]);

    res.json({
      success: true,
      data: cohorts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cohorts',
      error: error.message,
    });
  }
};

/**
 * Get cohort sessions for a trainer
 */
const getCohortSessions = async (req, res) => {
  try {
    const { cohortId } = req.params;
    const trainerId = req.user.id;

    // Verify trainer has access to this cohort
    const cohort = await prisma.cohort.findUnique({
      where: { id: parseInt(cohortId) },
    });

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    if (cohort.leadTrainerId !== trainerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const sessions = await prisma.cohortSession.findMany({
      where: { cohortId: parseInt(cohortId) },
      orderBy: { sessionNumber: 'asc' },
    });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching cohort sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cohort sessions',
      error: error.message,
    });
  }
};

/**
 * Update cohort session (for attendance tracking)
 */
const updateCohortSession = async (req, res) => {
  try {
    const { cohortId, sessionId } = req.params;
    const trainerId = req.user.id;
    const updateData = req.body;

    // Verify trainer has access to this cohort
    const cohort = await prisma.cohort.findUnique({
      where: { id: parseInt(cohortId) },
    });

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    if (cohort.leadTrainerId !== trainerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const session = await prisma.cohortSession.update({
      where: { id: parseInt(sessionId) },
      data: {
        ...updateData,
        updatedBy: trainerId,
      },
    });

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: session,
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating session',
      error: error.message,
    });
  }
};

/**
 * Get candidate professional profile
 * Allows trainer to view candidate's full professional information
 */
const getCandidateProfile = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const trainerId = req.user.id;

    // Get candidate with all professional details
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(candidateId) },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
          },
        },
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                code: true,
                category: true,
                trainers: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        vetting: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    // Verify trainer has access to at least one course this candidate is enrolled in
    const hasAccess = candidate.enrollments.some(enrollment => 
      enrollment.course.trainers && enrollment.course.trainers.includes(trainerId)
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - candidate not enrolled in your courses',
      });
    }

    // Get assessments for this candidate
    const assessments = await prisma.assessment.findMany({
      where: {
        enrollment: {
          candidateId: candidate.id,
        },
      },
      include: {
        course: {
          select: {
            title: true,
            code: true,
          },
        },
        enrollment: {
          select: {
            enrollmentStatus: true,
          },
        },
      },
      orderBy: { assessmentDate: 'desc' },
    });

    // Get attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        enrollment: {
          candidateId: candidate.id,
        },
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });

    // Calculate statistics
    const totalAssessments = assessments.length;
    const passedAssessments = assessments.filter(a => 
      a.resultCategory === 'PASS' || a.resultCategory === 'MERIT' || a.resultCategory === 'DISTINCTION'
    ).length;
    const averageScore = totalAssessments > 0 
      ? (assessments.reduce((sum, a) => sum + (a.score || 0), 0) / totalAssessments).toFixed(1)
      : 0;

    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = totalAttendance > 0 
      ? ((presentCount / totalAttendance) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        candidate: {
          id: candidate.id,
          fullName: candidate.fullName,
          email: candidate.user?.email,
          phone: candidate.user?.phone,
          gender: candidate.gender,
          dob: candidate.dob,
          nationalIdPassport: candidate.nationalIdPassport,
          county: candidate.county,
          maritalStatus: candidate.maritalStatus,
          highestEducation: candidate.highestEducation,
          languages: candidate.languages,
          relevantSkills: candidate.relevantSkills,
          profilePhotoUrl: candidate.profilePhotoUrl,
          previousEmployer: candidate.previousEmployer,
          previousRole: candidate.previousRole,
          previousDuration: candidate.previousDuration,
          referenceContact: candidate.referenceContact,
          preferredCountry: candidate.preferredCountry,
          jobTypePreference: candidate.jobTypePreference,
          willingToRelocate: candidate.willingToRelocate,
          status: candidate.status,
          createdAt: candidate.createdAt,
        },
        enrollments: candidate.enrollments,
        assessments,
        attendance: attendanceRecords,
        documents: candidate.documents,
        vettingStatus: candidate.vetting[0] || null,
        statistics: {
          totalEnrollments: candidate.enrollments.length,
          activeEnrollments: candidate.enrollments.filter(e => e.enrollmentStatus === 'ENROLLED').length,
          completedEnrollments: candidate.enrollments.filter(e => e.enrollmentStatus === 'COMPLETED').length,
          totalAssessments,
          passedAssessments,
          averageScore,
          attendanceRate,
          totalAttendanceDays: totalAttendance,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching candidate profile',
      error: error.message,
    });
  }
};

/**
 * Get all candidates enrolled in trainer's courses
 */
const getAllMyCandidates = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { status, courseId, search } = req.query;

    // Get all courses where trainer is assigned
    const courses = await prisma.course.findMany({
      where: {
        trainers: { has: trainerId },
      },
      select: { id: true },
    });

    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0 },
      });
    }

    // Build where clause
    const whereClause = {
      courseId: courseId ? parseInt(courseId) : { in: courseIds },
    };

    if (status) {
      whereClause.enrollmentStatus = status;
    }

    // Get enrollments with candidate details
    const enrollments = await prisma.enrollment.findMany({
      where: whereClause,
      include: {
        candidate: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
                vetting: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by search term if provided
    let filteredEnrollments = enrollments;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEnrollments = enrollments.filter(enrollment => 
        enrollment.candidate.fullName.toLowerCase().includes(searchLower) ||
        enrollment.candidate.user?.email?.toLowerCase().includes(searchLower) ||
        enrollment.course.title.toLowerCase().includes(searchLower)
      );
    }

    // Get unique candidates
    const candidatesMap = new Map();
    filteredEnrollments.forEach(enrollment => {
      const candidateId = enrollment.candidate.id;
      if (!candidatesMap.has(candidateId)) {
        candidatesMap.set(candidateId, {
          ...enrollment.candidate,
          enrollments: [],
        });
      }
      candidatesMap.get(candidateId).enrollments.push({
        id: enrollment.id,
        course: enrollment.course,
        enrollmentStatus: enrollment.enrollmentStatus,
        enrollmentDate: enrollment.createdAt,
      });
    });

    const candidates = Array.from(candidatesMap.values());

    res.json({
      success: true,
      data: candidates,
      pagination: {
        total: candidates.length,
      },
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching candidates',
      error: error.message,
    });
  }
};

/**
 * Create assessment with candidate context
 */
const createCandidateAssessment = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { courseId, assessmentTitle, assessmentType, maxScore, score, resultCategory, trainerComments, feedback } = req.body;
    const trainerId = req.user.id;

    // Verify candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(candidateId) },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    // Find enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        candidateId: parseInt(candidateId),
        courseId: parseInt(courseId),
      },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not enrolled in this course',
      });
    }

    // Verify trainer access
    if (!enrollment.course.trainers || !enrollment.course.trainers.includes(trainerId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Calculate percentage
    const maxScoreValue = maxScore ? parseFloat(maxScore) : 100;
    const scoreValue = score ? parseFloat(score) : null;
    const percentageValue = scoreValue !== null ? (scoreValue / maxScoreValue) * 100 : null;

    // Determine result category if not provided
    let finalResultCategory = resultCategory;
    if (!finalResultCategory && percentageValue !== null) {
      if (percentageValue >= 80) finalResultCategory = 'DISTINCTION';
      else if (percentageValue >= 70) finalResultCategory = 'MERIT';
      else if (percentageValue >= 50) finalResultCategory = 'PASS';
      else finalResultCategory = 'FAIL';
    }

    const assessment = await prisma.assessment.create({
      data: {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        assessmentTitle: assessmentTitle || assessmentType,
        assessmentType,
        maxScore: maxScoreValue,
        score: scoreValue,
        percentage: percentageValue,
        resultCategory: finalResultCategory,
        trainerComments,
        feedback,
        assessmentDate: new Date(),
        createdBy: trainerId,
      },
      include: {
        enrollment: {
          include: {
            candidate: {
              select: {
                fullName: true,
              },
            },
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment,
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating assessment',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboard,
  getMyCourses,
  getCourseDetails,
  getCourseStudents,
  recordAttendance,
  createAssessment,
  updateAssessment,
  getCourseAttendance,
  getMyCohorts,
  getCohortSessions,
  updateCohortSession,
  getCandidateProfile,
  getAllMyCandidates,
  createCandidateAssessment,
};
