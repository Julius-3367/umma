const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const appealController = require('../controllers/attendanceAppealController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and Admin role (unless overridden below)
router.use(authenticate);

/**
 * Dashboard
 */
router.get('/dashboard', authorize(['Admin', 'Recruiter']), adminController.getDashboard);

/**
 * User Management (Admin only)
 */
router.get('/users', authorize(['Admin']), adminController.getAllUsers);
router.get('/users/:id', authorize(['Admin']), adminController.getUserById);
router.post('/users', authorize(['Admin']), adminController.createUser);
router.put('/users/:id', authorize(['Admin']), adminController.updateUser);
router.delete('/users/:id', authorize(['Admin']), adminController.deleteUser);

/**
 * Course Management (Admin only)
 */
router.get('/courses', authorize(['Admin']), adminController.getAllCourses);
router.get('/courses/:id', authorize(['Admin']), adminController.getCourseById);
router.post('/courses', authorize(['Admin']), adminController.createCourse);
router.put('/courses/:id', authorize(['Admin']), adminController.updateCourse);
router.delete('/courses/:id', authorize(['Admin']), adminController.deleteCourse);

/**
 * Company Management (Admin + Recruiter)
 */
router.get('/companies', authorize(['Admin', 'Recruiter']), adminController.getAllCompanies);
router.get('/companies/:id', authorize(['Admin', 'Recruiter']), adminController.getCompanyById);
router.post('/companies', authorize(['Admin', 'Recruiter']), adminController.createCompany);
router.put('/companies/:id', authorize(['Admin', 'Recruiter']), adminController.updateCompany);
router.delete('/companies/:id', authorize(['Admin']), adminController.deleteCompany);

/**
 * Candidate Management (Admin + Recruiter)
 */
router.get('/candidates', authorize(['Admin', 'Recruiter']), adminController.getAllCandidates);
router.get('/candidates/:id', authorize(['Admin', 'Recruiter']), adminController.getCandidateById);
router.put('/candidates/:id', authorize(['Admin']), adminController.updateCandidate);
router.delete('/candidates/:id', authorize(['Admin']), adminController.deleteCandidate);

/**
 * Placement Management (Admin + Recruiter)
 */
router.get('/placements', authorize(['Admin', 'Recruiter']), adminController.getAllPlacements);
router.get('/placements/:id', authorize(['Admin', 'Recruiter']), adminController.getPlacementById);
router.post('/placements', authorize(['Admin', 'Recruiter']), adminController.createPlacement);
router.put('/placements/:id', authorize(['Admin', 'Recruiter']), adminController.updatePlacement);
router.delete('/placements/:id', authorize(['Admin']), adminController.deletePlacement);

/**
 * Enrollment Management (Admin only)
 */
router.get('/enrollments', authorize(['Admin']), adminController.getEnrollments);
router.put('/enrollments/:id', authorize(['Admin']), adminController.updateEnrollmentStatus);

/**
 * Statistics & Reports (Admin + Recruiter for read-only)
 */
router.get('/statistics', authorize(['Admin', 'Recruiter']), adminController.getStatistics);
// Report generation endpoints (async jobs)
router.post('/reports/generate', authorize(['Admin', 'Recruiter']), adminController.generateReport);
router.get('/reports/status/:jobId', authorize(['Admin', 'Recruiter']), adminController.getReportStatus);
router.get('/reports/download/:jobId', authorize(['Admin', 'Recruiter']), adminController.downloadReport);
router.get('/reports', authorize(['Admin', 'Recruiter']), adminController.getReports);
router.get('/activity-logs', authorize(['Admin']), adminController.getActivityLogs);

/**
 * Certificate Management (Admin only)
 */
router.get('/certificate-requests', authorize(['Admin']), adminController.getCertificateRequests);
router.get('/certificate-stats', authorize(['Admin']), adminController.getCertificateStats);
router.put('/certificate-requests/:id', authorize(['Admin']), adminController.processCertificateRequest);

/**
 * Attendance Management (Admin only)
 */
router.get('/attendance', authorize(['Admin']), adminController.getAttendance);
router.post('/attendance', authorize(['Admin']), adminController.saveAttendance);
router.get('/attendance/statistics', authorize(['Admin']), adminController.getAttendanceStatistics);
router.post('/attendance/notifications', authorize(['Admin']), adminController.sendAttendanceNotifications);
router.get('/attendance/export', authorize(['Admin']), adminController.exportAttendance);

/**
 * Certificate Management System (Admin only)
 */
router.get('/certificates', authorize(['Admin']), adminController.getCertificates);
router.get('/certificates/statistics', authorize(['Admin']), adminController.getCertificateStatistics);
router.get('/certificates/:id', authorize(['Admin']), adminController.getCertificateById);
router.post('/certificates/generate', authorize(['Admin']), adminController.generateCertificate);
router.put('/certificates/:id', authorize(['Admin']), adminController.updateCertificate);
router.post('/certificates/bulk-generate', authorize(['Admin']), adminController.bulkGenerateCertificates);
router.get('/certificates/:id/download', authorize(['Admin']), adminController.downloadCertificate);
router.post('/certificates/:id/send', authorize(['Admin']), adminController.sendCertificate);
router.post('/certificates/:id/preview', authorize(['Admin']), adminController.previewCertificate);
router.post('/certificates/verify', authorize(['Admin']), adminController.verifyCertificate);
router.put('/certificates/:id/revoke', authorize(['Admin']), adminController.revokeCertificate);
router.post('/certificates/:id/reissue', authorize(['Admin']), adminController.reissueCertificate);

/**
 * Certificate Templates (Admin only)
 */
router.get('/certificate-templates', authorize(['Admin']), adminController.getCertificateTemplates);
router.get('/certificate-templates/:id', authorize(['Admin']), adminController.getCertificateTemplateById);
router.post('/certificate-templates', authorize(['Admin']), adminController.createCertificateTemplate);
router.put('/certificate-templates/:id', authorize(['Admin']), adminController.updateCertificateTemplate);
router.delete('/certificate-templates/:id', authorize(['Admin']), adminController.deleteCertificateTemplate);

/**
 * Notifications (Admin only)
 */
router.get('/notifications', authorize(['Admin']), adminController.getNotifications);
router.patch('/notifications/:id/read', authorize(['Admin']), adminController.markNotificationAsRead);
router.patch('/notifications/mark-all-read', authorize(['Admin']), adminController.markAllNotificationsAsRead);
router.delete('/notifications/:id', authorize(['Admin']), adminController.deleteNotification);

/**
 * Attendance Appeals (Admin only)
 */
router.get('/attendance/appeals', authorize(['Admin']), appealController.getAdminAppeals);
router.put('/attendance/appeals/:appealId/override', authorize(['Admin']), appealController.overrideAppeal);

/**
 * Vetting Management (Admin only)
 */
router.get('/vetting/dashboard', authorize(['Admin']), adminController.getVettingDashboard);
router.put('/vetting/:id', authorize(['Admin']), adminController.updateVettingRecord);

/**
 * Cohort Application Management (Admin only)
 */
router.get('/cohort-applications', authorize(['Admin']), adminController.getCohortApplications);
router.post('/cohort-applications/:id/approve', authorize(['Admin']), adminController.approveCohortApplication);
router.post('/cohort-applications/:id/reject', authorize(['Admin']), adminController.rejectCohortApplication);

module.exports = router;
