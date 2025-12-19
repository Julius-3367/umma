const prisma = require('../config/database');
const cohortService = require('../services/cohortService');
const cohortAutomationService = require('../services/cohortAutomationService');

/**
 * Create a new cohort
 */
const createCohort = async (req, res) => {
  try {
    const {
      courseId,
      cohortCode,
      cohortName,
      description,
      startDate,
      endDate,
      enrollmentDeadline,
      maxCapacity,
      leadTrainerId,
      location,
      scheduleInfo,
    } = req.body;

    const userId = req.user.id;
    const tenantId = req.user.tenantId || 1; // Default to tenant 1 if null

    // Validate required fields
    if (!courseId || !cohortCode || !cohortName || !startDate || !endDate || !enrollmentDeadline || !maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check if cohort code already exists
    const existingCohort = await prisma.cohort.findUnique({
      where: { cohortCode },
    });

    if (existingCohort) {
      return res.status(400).json({
        success: false,
        message: 'Cohort code already exists',
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const cohort = await prisma.cohort.create({
      data: {
        tenantId,
        courseId: parseInt(courseId),
        cohortCode,
        cohortName,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        enrollmentDeadline: new Date(enrollmentDeadline),
        maxCapacity: parseInt(maxCapacity),
        leadTrainerId: leadTrainerId ? parseInt(leadTrainerId) : null,
        location,
        scheduleInfo,
        createdBy: userId,
      },
      include: {
        course: true,
        leadTrainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Cohort created successfully',
      data: cohort,
    });
  } catch (error) {
    console.error('Error creating cohort:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating cohort',
      error: error.message,
    });
  }
};

/**
 * Get all cohorts with filters
 */
const getCohorts = async (req, res) => {
  try {
    const { courseId, trainerId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const tenantId = req.user.tenantId || 1; // Default to tenant 1 if null

    const where = {};
    
    // Only filter by tenantId if it exists
    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (courseId) where.courseId = parseInt(courseId);
    if (trainerId) where.leadTrainerId = parseInt(trainerId);
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const [cohorts, total] = await Promise.all([
      prisma.cohort.findMany({
        where,
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
      data: {
        cohorts,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
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
 * Get cohort by ID with full details
 */
const getCohortById = async (req, res) => {
  try {
    const { id } = req.params;

    const cohort = await prisma.cohort.findUnique({
      where: { id: parseInt(id) },
      include: {
        course: true,
        leadTrainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        enrollments: {
          include: {
            candidate: {
              select: {
                id: true,
                fullName: true,
                nationalIdPassport: true,
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
            applicationDate: 'desc',
          },
        },
        sessions: {
          orderBy: {
            sessionNumber: 'asc',
          },
        },
        _count: {
          select: {
            enrollments: true,
            sessions: true,
            progressSummaries: true,
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

    res.json({
      success: true,
      data: cohort,
    });
  } catch (error) {
    console.error('Error fetching cohort:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cohort',
      error: error.message,
    });
  }
};

/**
 * Update cohort
 */
const updateCohort = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cohortName,
      description,
      startDate,
      endDate,
      enrollmentDeadline,
      maxCapacity,
      leadTrainerId,
      location,
      scheduleInfo,
      status,
    } = req.body;

    const userId = req.user.id;

    const cohort = await prisma.cohort.findUnique({
      where: { id: parseInt(id) },
    });

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    const updateData = {
      updatedBy: userId,
    };

    if (cohortName) updateData.cohortName = cohortName;
    if (description !== undefined) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (enrollmentDeadline) updateData.enrollmentDeadline = new Date(enrollmentDeadline);
    if (maxCapacity) updateData.maxCapacity = parseInt(maxCapacity);
    if (leadTrainerId !== undefined) updateData.leadTrainerId = leadTrainerId ? parseInt(leadTrainerId) : null;
    if (location !== undefined) updateData.location = location;
    if (scheduleInfo !== undefined) updateData.scheduleInfo = scheduleInfo;
    if (status) updateData.status = status;

    const updatedCohort = await prisma.cohort.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        course: true,
        leadTrainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Cohort updated successfully',
      data: updatedCohort,
    });
  } catch (error) {
    console.error('Error updating cohort:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cohort',
      error: error.message,
    });
  }
};

/**
 * Delete cohort
 */
const deleteCohort = async (req, res) => {
  try {
    const { id } = req.params;

    const cohort = await prisma.cohort.findUnique({
      where: { id: parseInt(id) },
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

    // Only allow deletion if no enrollments or cohort is in DRAFT status
    if (cohort._count.enrollments > 0 && cohort.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete cohort with enrollments. Consider archiving instead.',
      });
    }

    await prisma.cohort.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: 'Cohort deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting cohort:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting cohort',
      error: error.message,
    });
  }
};

/**
 * Enroll student in cohort
 */
const enrollStudent = async (req, res) => {
  try {
    const { id } = req.params; // cohort ID
    const { candidateId, enrollmentId, status = 'APPLIED' } = req.body;
    const userId = req.user.id;

    const cohort = await prisma.cohort.findUnique({
      where: { id: parseInt(id) },
      include: {
        course: true,
      },
    });

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    // Use automation service to check if enrollment is allowed
    const canEnrollCheck = await cohortAutomationService.canEnroll(parseInt(id));
    if (!canEnrollCheck.canEnroll && status === 'ENROLLED') {
      return res.status(400).json({
        success: false,
        message: canEnrollCheck.reason,
      });
    }

    // Check if student is already enrolled
    const existing = await prisma.cohortEnrollment.findFirst({
      where: {
        cohortId: parseInt(id),
        candidateId: parseInt(candidateId),
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this cohort',
      });
    }

    // When enrolling directly with ENROLLED status, create main enrollment
    let mainEnrollmentId = enrollmentId ? parseInt(enrollmentId) : null;
    
    if (status === 'ENROLLED' && !mainEnrollmentId) {
      // Check if candidate already has an enrollment for this course
      let courseEnrollment = await prisma.enrollment.findFirst({
        where: {
          courseId: cohort.courseId,
          candidateId: parseInt(candidateId),
        },
      });

      // If no enrollment exists, create one
      if (!courseEnrollment) {
        courseEnrollment = await prisma.enrollment.create({
          data: {
            tenantId: cohort.tenantId,
            courseId: cohort.courseId,
            candidateId: parseInt(candidateId),
            enrollmentDate: new Date(),
            enrollmentStatus: 'ENROLLED',
            paymentStatus: 'PENDING',
            createdBy: userId,
          },
        });
      } else if (courseEnrollment.enrollmentStatus !== 'ENROLLED') {
        // Update existing enrollment to ENROLLED status
        courseEnrollment = await prisma.enrollment.update({
          where: { id: courseEnrollment.id },
          data: {
            enrollmentStatus: 'ENROLLED',
            enrollmentDate: new Date(),
            updatedBy: userId,
          },
        });
      }
      
      mainEnrollmentId = courseEnrollment.id;
    }

    // Create cohort enrollment
    const cohortEnrollment = await prisma.cohortEnrollment.create({
      data: {
        cohortId: parseInt(id),
        candidateId: parseInt(candidateId),
        enrollmentId: mainEnrollmentId,
        status,
        reviewedBy: status === 'APPROVED' || status === 'ENROLLED' ? userId : null,
        approvalDate: status === 'APPROVED' || status === 'ENROLLED' ? new Date() : null,
      },
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
        enrollment: {
          include: {
            course: true,
          },
        },
      },
    });

    // Update cohort enrollment count if status is ENROLLED
    if (status === 'ENROLLED') {
      await cohortAutomationService.incrementEnrollmentCount(parseInt(id));
      await cohortAutomationService.updateCohortMetrics(parseInt(id));
    }

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: cohortEnrollment,
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling student',
      error: error.message,
    });
  }
};

/**
 * Update cohort enrollment status
 */
const updateEnrollmentStatus = async (req, res) => {
  try {
    const { id, enrollmentId } = req.params;
    const { status, reviewNotes } = req.body;
    const userId = req.user.id;

    const cohortEnrollment = await prisma.cohortEnrollment.findUnique({
      where: { id: parseInt(enrollmentId) },
      include: {
        cohort: {
          include: {
            course: true,
          },
        },
        candidate: true,
      },
    });

    if (!cohortEnrollment || cohortEnrollment.cohortId !== parseInt(id)) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    const updateData = {
      status,
      reviewedBy: userId,
    };

    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    if (status === 'APPROVED' || status === 'ENROLLED') {
      updateData.approvalDate = new Date();
    }
    if (status === 'WITHDRAWN') {
      updateData.withdrawalDate = new Date();
    }

    // When status changes to ENROLLED, create or link the main Enrollment record
    if (status === 'ENROLLED' && !cohortEnrollment.enrollmentId) {
      // Check if candidate already has an enrollment for this course
      let courseEnrollment = await prisma.enrollment.findFirst({
        where: {
          courseId: cohortEnrollment.cohort.courseId,
          candidateId: cohortEnrollment.candidateId,
        },
      });

      // If no enrollment exists, create one
      if (!courseEnrollment) {
        courseEnrollment = await prisma.enrollment.create({
          data: {
            tenantId: cohortEnrollment.cohort.tenantId,
            courseId: cohortEnrollment.cohort.courseId,
            candidateId: cohortEnrollment.candidateId,
            enrollmentDate: new Date(),
            enrollmentStatus: 'ENROLLED',
            paymentStatus: 'PENDING',
            createdBy: userId,
          },
        });
      } else if (courseEnrollment.enrollmentStatus !== 'ENROLLED') {
        // Update existing enrollment to ENROLLED status
        courseEnrollment = await prisma.enrollment.update({
          where: { id: courseEnrollment.id },
          data: {
            enrollmentStatus: 'ENROLLED',
            enrollmentDate: new Date(),
            updatedBy: userId,
          },
        });
      }

      // Link the enrollment to cohort enrollment
      updateData.enrollmentId = courseEnrollment.id;
    }

    const updated = await prisma.cohortEnrollment.update({
      where: { id: parseInt(enrollmentId) },
      data: updateData,
      include: {
        candidate: {
          select: {
            id: true,
            fullName: true,
          },
        },
        enrollment: {
          include: {
            course: true,
          },
        },
      },
    });

    // Handle enrollment count changes
    const oldStatus = cohortEnrollment.status;
    const newStatus = status;

    if (oldStatus !== 'ENROLLED' && newStatus === 'ENROLLED') {
      // Student moved to ENROLLED - increment count
      await cohortAutomationService.incrementEnrollmentCount(parseInt(id));
    } else if (oldStatus === 'ENROLLED' && newStatus !== 'ENROLLED') {
      // Student left ENROLLED status - decrement count
      await cohortAutomationService.decrementEnrollmentCount(parseInt(id));
    }

    // Sync status with main enrollment
    await cohortAutomationService.syncEnrollmentStatus(parseInt(enrollmentId));

    // Update cohort metrics
    await cohortAutomationService.updateCohortMetrics(parseInt(id));

    // Check if student completed and ready for certificate
    if (newStatus === 'COMPLETED') {
      await cohortAutomationService.checkAndIssueCertificate(parseInt(enrollmentId));
      await cohortAutomationService.checkPlacementReadiness(parseInt(enrollmentId));
    }

    res.json({
      success: true,
      message: 'Enrollment status updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating enrollment status',
      error: error.message,
    });
  }
};

/**
 * Get cohort progress/dashboard
 */
const getCohortProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const cohort = await prisma.cohort.findUnique({
      where: { id: parseInt(id) },
      include: {
        course: {
          select: {
            title: true,
            code: true,
          },
        },
        leadTrainer: {
          select: {
            firstName: true,
            lastName: true,
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

    // Get all progress metrics
    const [
      attendanceStats,
      assessmentProgress,
      vettingProgress,
      placementReadiness,
    ] = await Promise.all([
      cohortService.getCohortAttendanceStats(parseInt(id)),
      cohortService.getCohortAssessmentProgress(parseInt(id)),
      cohortService.getCohortVettingProgress(parseInt(id)),
      cohortService.getCohortPlacementReadiness(parseInt(id)),
    ]);

    const enrollmentStats = await prisma.cohortEnrollment.groupBy({
      by: ['status'],
      where: { cohortId: parseInt(id) },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        cohort,
        enrollment: {
          total: cohort.currentEnrollment,
          capacity: cohort.maxCapacity,
          remaining: cohort.maxCapacity - cohort.currentEnrollment,
          byStatus: enrollmentStats,
        },
        attendance: attendanceStats,
        assessment: assessmentProgress,
        vetting: vettingProgress,
        placement: placementReadiness,
      },
    });
  } catch (error) {
    console.error('Error fetching cohort progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cohort progress',
      error: error.message,
    });
  }
};

/**
 * Create cohort session
 */
const createSession = async (req, res) => {
  try {
    const { id } = req.params; // cohort ID
    const {
      sessionNumber,
      sessionTitle,
      sessionDate,
      startTime,
      endTime,
      facilitatorId,
      location,
      topics,
      materials,
    } = req.body;
    const userId = req.user.id;

    const cohort = await prisma.cohort.findUnique({
      where: { id: parseInt(id) },
    });

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    const session = await prisma.cohortSession.create({
      data: {
        cohortId: parseInt(id),
        sessionNumber: parseInt(sessionNumber),
        sessionTitle,
        sessionDate: new Date(sessionDate),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        facilitatorId: facilitatorId ? parseInt(facilitatorId) : null,
        location,
        topics,
        materials,
        createdBy: userId,
      },
      include: {
        facilitator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating session',
      error: error.message,
    });
  }
};

/**
 * Update cohort session
 */
const updateSession = async (req, res) => {
  try {
    const { id, sessionId } = req.params;
    const updateData = { ...req.body, updatedBy: req.user.id };

    const session = await prisma.cohortSession.findUnique({
      where: { id: parseInt(sessionId) },
    });

    if (!session || session.cohortId !== parseInt(id)) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const updated = await prisma.cohortSession.update({
      where: { id: parseInt(sessionId) },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: updated,
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
 * Generate progress summary
 */
const generateProgressSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const summary = await cohortService.generateCohortProgressSummary(parseInt(id), userId);

    res.status(201).json({
      success: true,
      message: 'Progress summary generated successfully',
      data: summary,
    });
  } catch (error) {
    console.error('Error generating progress summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating progress summary',
      error: error.message,
    });
  }
};

/**
 * Update cohort metrics (attendance, assessment, vetting, placement)
 */
const updateMetrics = async (req, res) => {
  try {
    const { id } = req.params;

    const cohort = await cohortService.updateCohortMetrics(parseInt(id));

    res.json({
      success: true,
      message: 'Metrics updated successfully',
      data: cohort,
    });
  } catch (error) {
    console.error('Error updating metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating metrics',
      error: error.message,
    });
  }
};

/**
 * Publish cohort (make it visible for enrollment)
 */
const publishCohort = async (req, res) => {
  try {
    const { id } = req.params;

    const cohort = await prisma.cohort.update({
      where: { id: parseInt(id) },
      data: { status: 'PUBLISHED' },
    });

    res.json({
      success: true,
      message: 'Cohort published successfully',
      data: cohort,
    });
  } catch (error) {
    console.error('Error publishing cohort:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing cohort',
      error: error.message,
    });
  }
};

/**
 * Open enrollment for cohort
 */
const openEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    const cohort = await prisma.cohort.update({
      where: { id: parseInt(id) },
      data: { status: 'ENROLLMENT_OPEN' },
    });

    res.json({
      success: true,
      message: 'Enrollment opened successfully',
      data: cohort,
    });
  } catch (error) {
    console.error('Error opening enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error opening enrollment',
      error: error.message,
    });
  }
};

/**
 * Close enrollment for cohort
 */
const closeEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    const cohort = await prisma.cohort.update({
      where: { id: parseInt(id) },
      data: { status: 'ENROLLMENT_CLOSED' },
    });

    res.json({
      success: true,
      message: 'Enrollment closed successfully',
      data: cohort,
    });
  } catch (error) {
    console.error('Error closing enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing enrollment',
      error: error.message,
    });
  }
};

/**
 * Archive cohort
 */
const archiveCohort = async (req, res) => {
  try {
    const { id } = req.params;

    const cohort = await prisma.cohort.update({
      where: { id: parseInt(id) },
      data: { status: 'ARCHIVED' },
    });

    res.json({
      success: true,
      message: 'Cohort archived successfully',
      data: cohort,
    });
  } catch (error) {
    console.error('Error archiving cohort:', error);
    res.status(500).json({
      success: false,
      message: 'Error archiving cohort',
      error: error.message,
    });
  }
};

module.exports = {
  createCohort,
  getCohorts,
  getCohortById,
  updateCohort,
  deleteCohort,
  enrollStudent,
  updateEnrollmentStatus,
  getCohortProgress,
  createSession,
  updateSession,
  generateProgressSummary,
  updateMetrics,
  publishCohort,
  openEnrollment,
  closeEnrollment,
  archiveCohort,
};
