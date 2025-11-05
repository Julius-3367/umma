const prisma = require('../config/database');
const { createActivityLog } = require('../services/activityLogService');

/**
 * Get candidate dashboard data
 */
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

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

    // Get upcoming events (assessments, interviews, etc.)
    const upcomingEvents = [];
    
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
    const certificates = await prisma.certificate.count({
      where: { enrollmentId: { in: enrollments.map(e => e.id) } },
    });

    res.json({
      success: true,
      data: {
        profile: {
          ...candidate,
          completionRate: candidate.profileCompletionRate || 0,
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
          instructor: enrollment.course.trainer ? 
            `${enrollment.course.trainer.firstName} ${enrollment.course.trainer.lastName}` : 
            'TBA',
          status: enrollment.status === 'COMPLETED' ? 'Completed' : 
                  enrollment.progress > 80 ? 'Almost Complete' : 'In Progress',
        })),
        upcomingEvents,
        stats: {
          activeCourses: inProgressCourses,
          completedCourses,
          certificates,
          applications: placements.length,
        },
      },
    });
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

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

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

    res.json({
      success: true,
      data: enrollments.map(enrollment => ({
        id: enrollment.course.id,
        enrollmentId: enrollment.id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        progress: 0, // Progress tracking would need to be calculated
        status: enrollment.enrollmentStatus,
        startDate: enrollment.course.startDate,
        endDate: enrollment.course.endDate,
        instructor: 'TBA', // Trainers are stored as JSON array, would need separate lookup
        enrolledAt: enrollment.createdAt,
      })),
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
const getRecommendedJobs = async (req, res) => {
  try {
    const userId = req.user.id;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
      include: {
        skills: true,
      },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // For now, return all available jobs
    // TODO: Implement matching algorithm based on skills
    const jobs = await prisma.job.findMany({
      where: {
        status: 'OPEN',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: jobs.map(job => ({
        ...job,
        match: Math.floor(Math.random() * 30) + 70, // Mock match score for now
        posted: getRelativeTime(job.createdAt),
      })),
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
    const { coverLetter, resume } = req.body;

    const candidate = await prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
    }

    // Check if already applied
    const existingApplication = await prisma.placement.findFirst({
      where: {
        candidateId: candidate.id,
        jobId: parseInt(jobId),
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job',
      });
    }

    // Create placement/application
    const placement = await prisma.placement.create({
      data: {
        candidateId: candidate.id,
        jobId: parseInt(jobId),
        status: 'INITIATED',
        applicationDate: new Date(),
        notes: coverLetter || '',
      },
      include: {
        job: true,
      },
    });

    // Log activity
    await createActivityLog({
      userId,
      action: 'JOB_APPLICATION_SUBMITTED',
      resource: 'Placement',
      resourceId: placement.id,
      details: { jobId, jobTitle: placement.job.title },
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
        documents: true,
        skills: true,
      },
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found',
      });
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

module.exports = {
  getDashboardData,
  getMyCourses,
  getCourseDetails,
  getRecommendedJobs,
  applyForJob,
  getNotifications,
  markNotificationAsRead,
  getProfile,
};
