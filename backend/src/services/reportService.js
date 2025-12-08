const prisma = require('../config/database');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', '..', 'uploads', 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Generate Enrollment Statistics Report
 */
async function generateEnrollmentReport(startDate, endDate, tenantId) {
  const enrollments = await prisma.cohortEnrollment.findMany({
    where: {
      ...(tenantId && { cohort: { tenantId } }),
      applicationDate: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: {
      cohort: {
        include: {
          course: { select: { title: true, code: true } },
        },
      },
      candidate: {
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { applicationDate: 'desc' },
  });

  return enrollments.map(e => ({
    enrollmentId: e.id,
    candidateName: e.candidate.fullName,
    candidateEmail: e.candidate.user.email,
    cohortName: e.cohort.cohortName,
    cohortCode: e.cohort.cohortCode,
    courseName: e.cohort.course?.title || 'N/A',
    courseCode: e.cohort.course?.code || 'N/A',
    status: e.status,
    vettingStatus: e.vettingStatus,
    applicationDate: e.applicationDate?.toISOString().split('T')[0],
    approvalDate: e.approvalDate?.toISOString().split('T')[0] || 'N/A',
    progress: e.progress || 0,
  }));
}

/**
 * Generate Course Performance Report
 */
async function generateCourseReport(startDate, endDate, tenantId) {
  const courses = await prisma.course.findMany({
    where: {
      ...(tenantId && { tenantId }),
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: {
      cohorts: {
        include: {
          _count: {
            select: { enrollments: true },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  return courses.map(course => {
    const totalCohorts = course.cohorts.length;
    const totalEnrollments = course.cohorts.reduce((sum, c) => sum + c._count.enrollments, 0);
    const activeCohorts = course.cohorts.filter(c => c.status === 'IN_TRAINING').length;

    return {
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      duration: course.duration || 'N/A',
      totalCohorts,
      activeCohorts,
      completedCohorts: course.cohorts.filter(c => c.status === 'COMPLETED').length,
      totalEnrollments,
      averageEnrollmentPerCohort: totalCohorts > 0 ? Math.round(totalEnrollments / totalCohorts) : 0,
      status: course.status,
      createdDate: course.createdAt.toISOString().split('T')[0],
    };
  });
}

/**
 * Generate Candidate Progress Report
 */
async function generateCandidateReport(startDate, endDate, tenantId) {
  const candidates = await prisma.candidate.findMany({
    where: {
      ...(tenantId && { tenantId }),
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: {
      user: { select: { email: true, createdAt: true } },
      enrollments: {
        include: {
          cohort: {
            include: {
              course: { select: { title: true } },
            },
          },
        },
      },
      vettingRecords: true,
    },
  });

  return candidates.map(c => {
    const totalEnrollments = c.enrollments.length;
    const activeEnrollments = c.enrollments.filter(e => e.status === 'ENROLLED').length;
    const completedEnrollments = c.enrollments.filter(e => e.status === 'COMPLETED').length;
    const vettingCleared = c.vettingRecords.filter(v => v.vettingStatus === 'CLEARED').length;

    return {
      candidateId: c.id,
      fullName: c.fullName,
      email: c.user.email,
      gender: c.gender,
      county: c.county,
      nationalId: c.nationalIdPassport,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      vettingCleared,
      status: c.status,
      registrationDate: c.createdAt.toISOString().split('T')[0],
    };
  });
}

/**
 * Generate Attendance Report
 */
async function generateAttendanceReport(startDate, endDate, tenantId) {
  const attendance = await prisma.attendance.findMany({
    where: {
      ...(tenantId && { tenantId }),
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: {
      session: {
        include: {
          cohort: { select: { cohortName: true, cohortCode: true } },
          course: { select: { title: true, code: true } },
        },
      },
      candidate: {
        include: {
          user: { select: { email: true } },
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  return attendance.map(a => ({
    attendanceId: a.id,
    candidateName: a.candidate.fullName,
    candidateEmail: a.candidate.user.email,
    cohortName: a.session.cohort.cohortName,
    courseName: a.session.course.title,
    sessionTitle: a.session.title,
    date: a.date.toISOString().split('T')[0],
    status: a.status,
    checkInTime: a.checkInTime || 'N/A',
    checkOutTime: a.checkOutTime || 'N/A',
    notes: a.notes || 'N/A',
  }));
}

/**
 * Generate Vetting Report
 */
async function generateVettingReport(startDate, endDate, tenantId) {
  const vettingRecords = await prisma.vettingRecord.findMany({
    where: {
      ...(tenantId && { tenantId }),
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: {
      candidate: {
        include: {
          user: { select: { email: true } },
        },
      },
      verificationOfficer: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return vettingRecords.map(v => ({
    vettingId: v.id,
    candidateName: v.candidate.fullName,
    candidateEmail: v.candidate.user.email,
    vettingStatus: v.vettingStatus,
    policeClearanceNo: v.policeClearanceNo || 'N/A',
    medicalReportNo: v.medicalReportNo || 'N/A',
    policeDocumentUploaded: v.policeDocumentUrl ? 'Yes' : 'No',
    medicalReportUploaded: v.medicalReportUrl ? 'Yes' : 'No',
    verificationOfficer: v.verificationOfficer
      ? `${v.verificationOfficer.firstName} ${v.verificationOfficer.lastName}`
      : 'N/A',
    reviewDate: v.reviewDate?.toISOString().split('T')[0] || 'N/A',
    applicationDate: v.createdAt.toISOString().split('T')[0],
    comments: v.comments || 'N/A',
  }));
}

/**
 * Generate Certificate Issuance Report
 */
async function generateCertificateReport(startDate, endDate, tenantId) {
  const certificates = await prisma.certificate.findMany({
    where: {
      ...(tenantId && { tenantId }),
      issuedAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: {
      candidate: {
        include: {
          user: { select: { email: true } },
        },
      },
      course: { select: { title: true, code: true } },
      cohort: { select: { cohortName: true } },
      template: { select: { name: true } },
    },
    orderBy: { issuedAt: 'desc' },
  });

  return certificates.map(cert => ({
    certificateId: cert.id,
    certificateNumber: cert.certificateNumber,
    candidateName: cert.candidate.fullName,
    candidateEmail: cert.candidate.user.email,
    courseName: cert.course.title,
    courseCode: cert.course.code,
    cohortName: cert.cohort?.cohortName || 'N/A',
    templateName: cert.template?.name || 'N/A',
    issuedDate: cert.issuedAt.toISOString().split('T')[0],
    expiryDate: cert.expiresAt?.toISOString().split('T')[0] || 'No Expiry',
    status: cert.revoked ? 'Revoked' : 'Active',
    revokedReason: cert.revokedReason || 'N/A',
  }));
}

/**
 * Generate Trainer Performance Report
 */
async function generateTrainerReport(startDate, endDate, tenantId) {
  const trainers = await prisma.user.findMany({
    where: {
      ...(tenantId && { tenantId }),
      role: { name: 'Trainer' },
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: {
      cohortsLed: {
        include: {
          course: { select: { title: true } },
          _count: { select: { enrollments: true, sessions: true } },
        },
      },
      _count: {
        select: { cohortsLed: true },
      },
    },
  });

  return trainers.map(t => {
    const totalCohorts = t.cohortsLed.length;
    const activeCohorts = t.cohortsLed.filter(c => c.status === 'IN_TRAINING').length;
    const totalStudents = t.cohortsLed.reduce((sum, c) => sum + c._count.enrollments, 0);
    const totalSessions = t.cohortsLed.reduce((sum, c) => sum + c._count.sessions, 0);

    return {
      trainerId: t.id,
      trainerName: `${t.firstName} ${t.lastName}`,
      trainerEmail: t.email,
      totalCohorts,
      activeCohorts,
      completedCohorts: t.cohortsLed.filter(c => c.status === 'COMPLETED').length,
      totalStudents,
      totalSessions,
      averageStudentsPerCohort: totalCohorts > 0 ? Math.round(totalStudents / totalCohorts) : 0,
      status: t.status,
      joinedDate: t.createdAt.toISOString().split('T')[0],
    };
  });
}

/**
 * Generate Cohort Summary Report
 */
async function generateCohortReport(startDate, endDate, tenantId) {
  const cohorts = await prisma.cohort.findMany({
    where: {
      ...(tenantId && { tenantId }),
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    },
    include: {
      course: { select: { title: true, code: true } },
      leadTrainer: { select: { firstName: true, lastName: true, email: true } },
      enrollments: true,
      _count: {
        select: { sessions: true, enrollments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return cohorts.map(cohort => {
    const totalEnrollments = cohort.enrollments.length;
    const enrolledCount = cohort.enrollments.filter(e => e.status === 'ENROLLED').length;
    const completedCount = cohort.enrollments.filter(e => e.status === 'COMPLETED').length;
    const withdrawnCount = cohort.enrollments.filter(e => e.status === 'WITHDRAWN').length;

    return {
      cohortId: cohort.id,
      cohortCode: cohort.cohortCode,
      cohortName: cohort.cohortName,
      courseName: cohort.course.title,
      courseCode: cohort.course.code,
      leadTrainer: cohort.leadTrainer
        ? `${cohort.leadTrainer.firstName} ${cohort.leadTrainer.lastName}`
        : 'N/A',
      startDate: cohort.startDate.toISOString().split('T')[0],
      endDate: cohort.endDate.toISOString().split('T')[0],
      maxCapacity: cohort.maxCapacity,
      currentEnrollment: cohort.currentEnrollment,
      totalApplications: totalEnrollments,
      enrolledStudents: enrolledCount,
      completedStudents: completedCount,
      withdrawnStudents: withdrawnCount,
      totalSessions: cohort._count.sessions,
      status: cohort.status,
      createdDate: cohort.createdAt.toISOString().split('T')[0],
    };
  });
}

/**
 * Generate Financial Overview Report
 */
async function generateFinancialReport(startDate, endDate, tenantId) {
  // This is a placeholder - implement based on your payment/transaction models
  const enrollments = await prisma.cohortEnrollment.findMany({
    where: {
      ...(tenantId && { cohort: { tenantId } }),
      applicationDate: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
      status: { in: ['ENROLLED', 'COMPLETED'] },
    },
    include: {
      cohort: {
        include: {
          course: { select: { title: true, code: true } },
        },
      },
    },
  });

  return enrollments.map(e => ({
    enrollmentId: e.id,
    cohortName: e.cohort.cohortName,
    courseName: e.cohort.course.title,
    enrollmentDate: e.applicationDate?.toISOString().split('T')[0],
    status: e.status,
    // Add payment fields when payment model is implemented
    amount: 'N/A',
    paymentStatus: 'N/A',
    paymentDate: 'N/A',
  }));
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Main report generation function
 */
async function generateReportData(type, startDate, endDate, tenantId) {
  let data;

  switch (type) {
    case 'enrollments':
      data = await generateEnrollmentReport(startDate, endDate, tenantId);
      break;
    case 'courses':
      data = await generateCourseReport(startDate, endDate, tenantId);
      break;
    case 'candidates':
      data = await generateCandidateReport(startDate, endDate, tenantId);
      break;
    case 'attendance':
      data = await generateAttendanceReport(startDate, endDate, tenantId);
      break;
    case 'vetting':
      data = await generateVettingReport(startDate, endDate, tenantId);
      break;
    case 'certificates':
      data = await generateCertificateReport(startDate, endDate, tenantId);
      break;
    case 'trainers':
      data = await generateTrainerReport(startDate, endDate, tenantId);
      break;
    case 'cohorts':
      data = await generateCohortReport(startDate, endDate, tenantId);
      break;
    case 'financial':
      data = await generateFinancialReport(startDate, endDate, tenantId);
      break;
    default:
      throw new Error(`Unknown report type: ${type}`);
  }

  return data;
}

/**
 * Save report to file
 */
async function saveReportToFile(data, format, fileName) {
  const filePath = path.join(REPORTS_DIR, fileName);

  if (format === 'csv') {
    const csvContent = convertToCSV(data);
    fs.writeFileSync(filePath, csvContent, 'utf8');
  } else if (format === 'json') {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }

  return filePath;
}

module.exports = {
  generateReportData,
  saveReportToFile,
  convertToCSV,
  REPORTS_DIR,
};
