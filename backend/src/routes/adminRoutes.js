const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and Admin role
router.use(authenticate);
router.use(authorize(['Admin']));

/**
 * Dashboard
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * User Management
 */
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

/**
 * Course Management
 */
router.get('/courses', adminController.getAllCourses);
router.get('/courses/:id', adminController.getCourseById);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

/**
 * Company Management
 */
router.get('/companies', adminController.getAllCompanies);
router.get('/companies/:id', adminController.getCompanyById);
router.post('/companies', adminController.createCompany);
router.put('/companies/:id', adminController.updateCompany);
router.delete('/companies/:id', adminController.deleteCompany);

/**
 * Candidate Management
 */
router.get('/candidates', adminController.getAllCandidates);

/**
 * Statistics & Reports
 */
router.get('/statistics', adminController.getStatistics);
// Report generation endpoints (async jobs)
router.post('/reports/generate', adminController.generateReport);
router.get('/reports/status/:jobId', adminController.getReportStatus);
router.get('/reports/download/:jobId', adminController.downloadReport);
router.get('/reports', adminController.getReports);
router.get('/activity-logs', adminController.getActivityLogs);

/**
 * Certificate Management
 */
router.get('/certificate-requests', adminController.getCertificateRequests);
router.get('/certificate-stats', adminController.getCertificateStats);
router.put('/certificate-requests/:id', adminController.processCertificateRequest);

/**
 * Attendance Management
 */
router.get('/attendance', adminController.getAttendance);
router.post('/attendance', adminController.saveAttendance);
router.get('/attendance/statistics', adminController.getAttendanceStatistics);
router.post('/attendance/notifications', adminController.sendAttendanceNotifications);
router.get('/attendance/export', adminController.exportAttendance);

/**
 * Certificate Management System
 */
router.get('/certificates', adminController.getCertificates);
router.get('/certificates/statistics', adminController.getCertificateStatistics);
router.get('/certificates/:id', adminController.getCertificateById);
router.post('/certificates/generate', adminController.generateCertificate);
router.post('/certificates/bulk-generate', adminController.bulkGenerateCertificates);
router.get('/certificates/:id/download', adminController.downloadCertificate);
router.post('/certificates/:id/send', adminController.sendCertificate);
router.post('/certificates/verify', adminController.verifyCertificate);
router.put('/certificates/:id/revoke', adminController.revokeCertificate);
router.post('/certificates/:id/reissue', adminController.reissueCertificate);

/**
 * Certificate Templates
 */
router.get('/certificate-templates', adminController.getCertificateTemplates);
router.get('/certificate-templates/:id', adminController.getCertificateTemplateById);
router.post('/certificate-templates', adminController.createCertificateTemplate);
router.put('/certificate-templates/:id', adminController.updateCertificateTemplate);
router.delete('/certificate-templates/:id', adminController.deleteCertificateTemplate);

module.exports = router;
