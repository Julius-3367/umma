const prisma = require('../config/database');

/**
 * Get trainer dashboard overview
 */
const getDashboard = async (req, res) => {
  try {
    const trainerId = req.user.id;

    // Get courses where trainer is assigned (trainers is JSON array)
    const allCourses = await prisma.course.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    // Filter courses where trainer ID is in trainers array
    const trainerCourses = allCourses.filter(course => {
      if (course.trainers && Array.isArray(course.trainers)) {
        return course.trainers.includes(trainerId);
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
        },
        courses: trainerCourses,
        recentEnrollments,
        upcomingAssessments,
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
    const { enrollmentId, status, remarks } = req.body;
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

    const attendance = await prisma.attendanceRecord.create({
      data: {
        tenantId: enrollment.tenantId,
        enrollmentId: parseInt(enrollmentId),
        courseId: enrollment.courseId,
        date: new Date(),
        status: status,
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
    const { enrollmentId, assessmentType, score, resultCategory, trainerComments, date } = req.body;
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

    const assessment = await prisma.assessment.create({
      data: {
        tenantId: enrollment.tenantId,
        courseId: enrollment.courseId,
        enrollmentId: parseInt(enrollmentId),
        assessmentType,
        score: score ? parseFloat(score) : null,
        resultCategory: resultCategory || null,
        trainerComments,
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
    const { score, resultCategory, trainerComments } = req.body;
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

    const updated = await prisma.assessment.update({
      where: { id: parseInt(id) },
      data: {
        ...(score !== undefined && { score: parseFloat(score) }),
        ...(resultCategory && { resultCategory }),
        ...(trainerComments && { trainerComments }),
        updatedBy: trainerId,
      },
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

module.exports = {
  getDashboard,
  getMyCourses,
  getCourseDetails,
  getCourseStudents,
  recordAttendance,
  createAssessment,
  updateAssessment,
  getCourseAttendance,
};
