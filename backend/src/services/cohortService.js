const prisma = require('../config/database');

/**
 * Cohort Service
 * Business logic for cohort management, status transitions, and automation
 */

/**
 * Calculate cohort capacity remaining
 */
const calculateCapacityRemaining = (cohort) => {
  return cohort.maxCapacity - cohort.currentEnrollment;
};

/**
 * Check if cohort is full
 */
const isCohortFull = (cohort) => {
  return cohort.currentEnrollment >= cohort.maxCapacity;
};

/**
 * Auto-transition cohort status based on dates and conditions
 */
const autoTransitionCohortStatus = async (cohortId) => {
  const cohort = await prisma.cohort.findUnique({
    where: { id: cohortId },
    include: {
      enrollments: {
        where: { status: 'ENROLLED' },
      },
    },
  });

  if (!cohort) return null;

  const now = new Date();
  let newStatus = cohort.status;

  // Auto-transition logic
  if (cohort.status === 'ENROLLMENT_OPEN') {
    // Close enrollment if deadline passed or cohort is full
    if (now > cohort.enrollmentDeadline || isCohortFull(cohort)) {
      newStatus = 'ENROLLMENT_CLOSED';
    }
  }

  if (cohort.status === 'ENROLLMENT_CLOSED' || cohort.status === 'ENROLLMENT_OPEN') {
    // Start training if course start date has arrived
    if (now >= cohort.startDate && now < cohort.endDate) {
      newStatus = 'IN_TRAINING';
    }
  }

  if (cohort.status === 'IN_TRAINING') {
    // Check if all assessments are completed
    const allAssessmentsCompleted = await checkAllAssessmentsCompleted(cohortId);
    if (allAssessmentsCompleted && now >= cohort.endDate) {
      newStatus = 'ASSESSMENT_IN_PROGRESS';
    }
  }

  if (cohort.status === 'ASSESSMENT_IN_PROGRESS') {
    // Check if vetting can start
    const assessmentProgress = await getCohortAssessmentProgress(cohortId);
    if (assessmentProgress.allCompleted) {
      newStatus = 'VETTING_IN_PROGRESS';
    }
  }

  if (cohort.status === 'VETTING_IN_PROGRESS') {
    // Check if vetting is complete for all students
    const vettingProgress = await getCohortVettingProgress(cohortId);
    if (vettingProgress.completionRate === 100) {
      newStatus = 'COMPLETED';
    }
  }

  // Update status if changed
  if (newStatus !== cohort.status) {
    return await prisma.cohort.update({
      where: { id: cohortId },
      data: { status: newStatus },
    });
  }

  return cohort;
};

/**
 * Check if all assessments are completed for a cohort
 */
const checkAllAssessmentsCompleted = async (cohortId) => {
  const cohort = await prisma.cohort.findUnique({
    where: { id: cohortId },
    include: {
      enrollments: {
        where: { status: 'ENROLLED' },
        include: {
          enrollment: {
            include: {
              assessments: true,
            },
          },
        },
      },
    },
  });

  if (!cohort || cohort.enrollments.length === 0) return false;

  // Check if all enrolled students have at least one assessment
  for (const cohortEnrollment of cohort.enrollments) {
    if (!cohortEnrollment.enrollment) continue;
    const assessments = cohortEnrollment.enrollment.assessments;
    if (!assessments || assessments.length === 0) {
      return false;
    }
  }

  return true;
};

/**
 * Get cohort attendance statistics
 */
const getCohortAttendanceStats = async (cohortId) => {
  const sessions = await prisma.cohortSession.findMany({
    where: { cohortId },
  });

  const enrollments = await prisma.cohortEnrollment.findMany({
    where: { 
      cohortId,
      status: 'ENROLLED',
    },
  });

  const totalSessions = sessions.filter(s => s.status === 'COMPLETED').length;
  const totalStudents = enrollments.length;

  if (totalSessions === 0 || totalStudents === 0) {
    return {
      totalSessions: 0,
      completedSessions: 0,
      averageAttendanceRate: 0,
      studentsWithPoorAttendance: 0,
    };
  }

  const totalAttendance = enrollments.reduce((sum, e) => sum + e.attendanceCount, 0);
  const expectedAttendance = totalStudents * totalSessions;
  const averageAttendanceRate = expectedAttendance > 0 ? (totalAttendance / expectedAttendance) * 100 : 0;

  const studentsWithPoorAttendance = enrollments.filter(e => e.attendanceRate < 75).length;

  return {
    totalSessions: sessions.length,
    completedSessions: totalSessions,
    averageAttendanceRate: Math.round(averageAttendanceRate * 100) / 100,
    studentsWithPoorAttendance,
  };
};

/**
 * Get cohort assessment progress
 */
const getCohortAssessmentProgress = async (cohortId) => {
  const enrollments = await prisma.cohortEnrollment.findMany({
    where: { 
      cohortId,
      status: 'ENROLLED',
    },
    include: {
      enrollment: {
        include: {
          assessments: true,
        },
      },
    },
  });

  let totalAssessments = 0;
  let completedAssessments = 0;
  let totalScore = 0;
  let passedCount = 0;
  let failedCount = 0;

  enrollments.forEach(cohortEnrollment => {
    if (!cohortEnrollment.enrollment) return;
    
    const assessments = cohortEnrollment.enrollment.assessments;
    totalAssessments += assessments.length;
    
    assessments.forEach(assessment => {
      if (assessment.score !== null) {
        completedAssessments++;
        totalScore += assessment.score;
        
        if (assessment.resultCategory === 'PASS') {
          passedCount++;
        } else if (assessment.resultCategory === 'FAIL') {
          failedCount++;
        }
      }
    });
  });

  const averageScore = completedAssessments > 0 ? totalScore / completedAssessments : 0;
  const passRate = totalAssessments > 0 ? (passedCount / totalAssessments) * 100 : 0;

  return {
    totalAssessments,
    completedAssessments,
    averageScore: Math.round(averageScore * 100) / 100,
    passRate: Math.round(passRate * 100) / 100,
    passedCount,
    failedCount,
    allCompleted: totalAssessments > 0 && completedAssessments === totalAssessments,
  };
};

/**
 * Get cohort vetting progress
 */
const getCohortVettingProgress = async (cohortId) => {
  const enrollments = await prisma.cohortEnrollment.findMany({
    where: { 
      cohortId,
      status: 'ENROLLED',
    },
    include: {
      candidate: {
        include: {
          vetting: true,
        },
      },
    },
  });

  const totalStudents = enrollments.length;
  let pending = 0;
  let inProgress = 0;
  let cleared = 0;
  let rejected = 0;

  enrollments.forEach(enrollment => {
    const vettingRecords = enrollment.candidate.vetting;
    if (vettingRecords.length === 0) {
      pending++;
    } else {
      const latestVetting = vettingRecords[vettingRecords.length - 1];
      switch (latestVetting.vettingStatus) {
        case 'PENDING':
        case 'PENDING_DOCUMENTS':
          pending++;
          break;
        case 'IN_PROGRESS':
          inProgress++;
          break;
        case 'CLEARED':
          cleared++;
          break;
        case 'REJECTED':
          rejected++;
          break;
      }
    }
  });

  const completionRate = totalStudents > 0 ? ((cleared + rejected) / totalStudents) * 100 : 0;

  return {
    totalStudents,
    pending,
    inProgress,
    cleared,
    rejected,
    completionRate: Math.round(completionRate * 100) / 100,
  };
};

/**
 * Get placement readiness for cohort
 */
const getCohortPlacementReadiness = async (cohortId) => {
  const enrollments = await prisma.cohortEnrollment.findMany({
    where: { 
      cohortId,
      status: 'ENROLLED',
    },
  });

  const totalStudents = enrollments.length;
  const placementReady = enrollments.filter(e => e.placementReady).length;
  const readyRate = totalStudents > 0 ? (placementReady / totalStudents) * 100 : 0;

  return {
    totalStudents,
    placementReady,
    notReady: totalStudents - placementReady,
    readyRate: Math.round(readyRate * 100) / 100,
  };
};

/**
 * Update cohort enrollment metrics
 */
const updateCohortEnrollmentMetrics = async (cohortId) => {
  const enrolledCount = await prisma.cohortEnrollment.count({
    where: {
      cohortId,
      status: 'ENROLLED',
    },
  });

  return await prisma.cohort.update({
    where: { id: cohortId },
    data: { currentEnrollment: enrolledCount },
  });
};

/**
 * Update student attendance in cohort enrollment
 */
const updateStudentAttendance = async (cohortId, candidateId, attendanceData) => {
  const { attendanceCount, totalSessions } = attendanceData;
  const attendanceRate = totalSessions > 0 ? (attendanceCount / totalSessions) * 100 : 0;

  return await prisma.cohortEnrollment.updateMany({
    where: {
      cohortId,
      candidateId,
    },
    data: {
      attendanceCount,
      totalSessions,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    },
  });
};

/**
 * Update student assessment progress in cohort enrollment
 */
const updateStudentAssessmentProgress = async (cohortId, candidateId) => {
  const cohortEnrollment = await prisma.cohortEnrollment.findFirst({
    where: { cohortId, candidateId },
    include: {
      enrollment: {
        include: {
          assessments: true,
        },
      },
    },
  });

  if (!cohortEnrollment || !cohortEnrollment.enrollment) return null;

  const assessments = cohortEnrollment.enrollment.assessments;
  const passed = assessments.filter(a => a.resultCategory === 'PASS').length;
  const failed = assessments.filter(a => a.resultCategory === 'FAIL').length;

  return await prisma.cohortEnrollment.update({
    where: { id: cohortEnrollment.id },
    data: {
      assessmentsPassed: passed,
      assessmentsFailed: failed,
    },
  });
};

/**
 * Update student placement readiness
 */
const updateStudentPlacementReadiness = async (cohortId, candidateId) => {
  const cohortEnrollment = await prisma.cohortEnrollment.findFirst({
    where: { cohortId, candidateId },
    include: {
      candidate: {
        include: {
          vetting: true,
        },
      },
    },
  });

  if (!cohortEnrollment) return null;

  // Student is placement ready if:
  // 1. Attendance rate >= 75%
  // 2. All assessments passed
  // 3. Vetting cleared
  // 4. Certificate issued

  const vettingCleared = cohortEnrollment.candidate.vetting.some(v => v.vettingStatus === 'CLEARED');
  const isReady = 
    cohortEnrollment.attendanceRate >= 75 &&
    cohortEnrollment.assessmentsFailed === 0 &&
    cohortEnrollment.assessmentsPassed > 0 &&
    vettingCleared &&
    cohortEnrollment.certificationIssued;

  return await prisma.cohortEnrollment.update({
    where: { id: cohortEnrollment.id },
    data: { placementReady: isReady },
  });
};

/**
 * Generate cohort progress summary
 */
const generateCohortProgressSummary = async (cohortId, userId) => {
  const attendanceStats = await getCohortAttendanceStats(cohortId);
  const assessmentProgress = await getCohortAssessmentProgress(cohortId);
  const vettingProgress = await getCohortVettingProgress(cohortId);
  const placementReadiness = await getCohortPlacementReadiness(cohortId);

  const enrollmentStats = await prisma.cohortEnrollment.groupBy({
    by: ['status'],
    where: { cohortId },
    _count: true,
  });

  const totalEnrolled = enrollmentStats.find(s => s.status === 'ENROLLED')?._count || 0;
  const withdrawn = enrollmentStats.find(s => s.status === 'WITHDRAWN')?._count || 0;

  const certificates = await prisma.cohortEnrollment.count({
    where: {
      cohortId,
      certificationIssued: true,
    },
  });

  return await prisma.cohortProgressSummary.create({
    data: {
      cohortId,
      totalEnrolled,
      activeStudents: totalEnrolled - withdrawn,
      withdrawnStudents: withdrawn,
      totalSessionsScheduled: attendanceStats.totalSessions,
      totalSessionsCompleted: attendanceStats.completedSessions,
      overallAttendanceRate: attendanceStats.averageAttendanceRate,
      studentsWithPoorAttendance: attendanceStats.studentsWithPoorAttendance,
      totalAssessmentsScheduled: assessmentProgress.totalAssessments,
      totalAssessmentsCompleted: assessmentProgress.completedAssessments,
      averageScore: assessmentProgress.averageScore,
      passRate: assessmentProgress.passRate,
      studentsPassedAll: assessmentProgress.passedCount,
      studentsWithFailures: assessmentProgress.failedCount,
      vettingPending: vettingProgress.pending,
      vettingInProgress: vettingProgress.inProgress,
      vettingCleared: vettingProgress.cleared,
      vettingRejected: vettingProgress.rejected,
      vettingCompletionRate: vettingProgress.completionRate,
      certificatesIssued: certificates,
      certificatesPending: totalEnrolled - certificates,
      placementReady: placementReadiness.placementReady,
      placementInProgress: 0, // TODO: Get from placement module
      placementCompleted: 0, // TODO: Get from placement module
      placementReadyRate: placementReadiness.readyRate,
      generatedBy: userId,
    },
  });
};

/**
 * Update cohort aggregated metrics
 */
const updateCohortMetrics = async (cohortId) => {
  const attendanceStats = await getCohortAttendanceStats(cohortId);
  const assessmentProgress = await getCohortAssessmentProgress(cohortId);
  const vettingProgress = await getCohortVettingProgress(cohortId);
  const placementReadiness = await getCohortPlacementReadiness(cohortId);

  return await prisma.cohort.update({
    where: { id: cohortId },
    data: {
      attendanceRate: attendanceStats.averageAttendanceRate,
      assessmentAverage: assessmentProgress.averageScore,
      vettingCompletionRate: vettingProgress.completionRate,
      placementReadyCount: placementReadiness.placementReady,
    },
  });
};

module.exports = {
  calculateCapacityRemaining,
  isCohortFull,
  autoTransitionCohortStatus,
  checkAllAssessmentsCompleted,
  getCohortAttendanceStats,
  getCohortAssessmentProgress,
  getCohortVettingProgress,
  getCohortPlacementReadiness,
  updateCohortEnrollmentMetrics,
  updateStudentAttendance,
  updateStudentAssessmentProgress,
  updateStudentPlacementReadiness,
  generateCohortProgressSummary,
  updateCohortMetrics,
};
