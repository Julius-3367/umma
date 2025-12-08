const express = require('express');
const candidateController = require('../controllers/candidateController');
const appealController = require('../controllers/attendanceAppealController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/candidate/dashboard:
 *   get:
 *     summary: Get candidate dashboard data
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', candidateController.getDashboardData);

/**
 * @swagger
 * /api/candidate/courses:
 *   get:
 *     summary: Get candidate's enrolled courses
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 */
router.get('/courses', candidateController.getMyCourses);

/**
 * @swagger
 * /api/candidate/courses/available:
 *   get:
 *     summary: Get available courses for enrollment
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available courses retrieved successfully
 */
router.get('/courses/available', candidateController.getAvailableCourses);

/**
 * @swagger
 * /api/candidate/courses/{courseId}:
 *   get:
 *     summary: Get course details
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Course details retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get('/courses/:courseId', candidateController.getCourseDetails);

/**
 * @swagger
 * /api/candidate/jobs/recommended:
 *   get:
 *     summary: Get recommended jobs for candidate
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended jobs retrieved successfully
 */
router.get('/jobs/recommended', candidateController.getRecommendedJobs);

/**
 * @swagger
 * /api/candidate/jobs/{jobId}/apply:
 *   post:
 *     summary: Apply for a job
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *               resume:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Already applied
 */
router.post('/jobs/:jobId/apply', candidateController.applyForJob);

/**
 * @swagger
 * /api/candidate/notifications:
 *   get:
 *     summary: Get candidate notifications
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/notifications', candidateController.getNotifications);

/**
 * @swagger
 * /api/candidate/notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/notifications/:notificationId/read', candidateController.markNotificationAsRead);

/**
 * @swagger
 * /api/candidate/profile:
 *   get:
 *     summary: Get candidate profile
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: Profile not found
 */
router.get('/profile', candidateController.getProfile);

/**
 * @swagger
 * /api/candidate/profile:
 *   patch:
 *     summary: Update candidate profile
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch('/profile', candidateController.updateProfile);

/**
 * @swagger
 * /api/candidate/documents:
 *   get:
 *     summary: Get candidate documents
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 */
router.get('/documents', candidateController.getDocuments);

/**
 * @swagger
 * /api/candidate/documents:
 *   post:
 *     summary: Upload a document
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 description: Type of document (profile_photo, passport, etc.)
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
router.post('/documents', upload.single('file'), candidateController.uploadDocument);

/**
 * @swagger
 * /api/candidate/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document deleted successfully
 */
router.delete('/documents/:id', candidateController.deleteDocument);

/**
 * @swagger
 * /api/candidate/attendance:
 *   get:
 *     summary: Get attendance records
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 */
router.get('/attendance', candidateController.getAttendance);

/**
 * @swagger
 * /api/candidate/assessments:
 *   get:
 *     summary: Get assessment records
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assessment records retrieved successfully
 */
router.get('/assessments', candidateController.getAssessments);

/**
 * @swagger
 * /api/candidate/certificates:
 *   get:
 *     summary: Get candidate certificates
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Certificates retrieved successfully
 */
router.get('/certificates', candidateController.getCertificates);

/**
 * @swagger
 * /api/candidate/enrollments:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courseId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Successfully enrolled in course
 *       400:
 *         description: Already enrolled
 */
router.post('/enrollments', candidateController.enrollInCourse);

/**
 * @swagger
 * /api/candidate/attendance/records:
 *   get:
 *     summary: Get comprehensive attendance records
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (e.g., 2025)
 *     responses:
 *       200:
 *         description: Attendance records with stats
 */
router.get('/attendance/records', candidateController.getAttendanceRecords);

/**
 * @swagger
 * /api/candidate/assessments/results:
 *   get:
 *     summary: Get comprehensive assessment results
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assessment results with performance data
 */
router.get('/assessments/results', candidateController.getAssessmentResults);

/**
 * @swagger
 * /api/candidate/certificates-documents:
 *   get:
 *     summary: Get certificates and documents
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Certificates and documents retrieved
 */
router.get('/certificates-documents', candidateController.getCertificatesAndDocuments);

/**
 * @swagger
 * /api/candidate/placement:
 *   get:
 *     summary: Get placement and job application data
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Placement data with job applications
 */
router.get('/placement', candidateController.getPlacementData);

/**
 * @swagger
 * /api/candidate/attendance/{attendanceId}/appeal:
 *   post:
 *     summary: Submit attendance appeal
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *               requestedStatus:
 *                 type: string
 *                 enum: [PRESENT, EXCUSED, LATE]
 *               supportingDocuments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Appeal submitted successfully
 */
router.post('/attendance/:attendanceId/appeal', appealController.submitAppeal);

/**
 * @swagger
 * /api/candidate/attendance/appeals:
 *   get:
 *     summary: Get my attendance appeals
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appeals retrieved successfully
 */
router.get('/attendance/appeals', appealController.getMyAppeals);

/**
 * @swagger
 * /api/candidate/attendance/appeals/{appealId}:
 *   delete:
 *     summary: Cancel pending appeal
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appealId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appeal cancelled successfully
 */
router.delete('/attendance/appeals/:appealId', appealController.cancelAppeal);

/**
 * @swagger
 * /api/candidate/cohorts/available:
 *   get:
 *     summary: Get available cohorts for enrollment
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available cohorts retrieved successfully
 */
router.get('/cohorts/available', candidateController.getAvailableCohorts);

/**
 * @swagger
 * /api/candidate/cohorts:
 *   get:
 *     summary: Get candidate's cohorts
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cohorts retrieved successfully
 */
router.get('/cohorts', candidateController.getMyCohorts);

/**
 * @swagger
 * /api/candidate/cohorts/{cohortId}/apply:
 *   post:
 *     summary: Apply for a cohort
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cohortId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *       400:
 *         description: Already applied or cohort full
 */
router.post('/cohorts/:cohortId/apply', candidateController.applyForCohort);

/**
 * @swagger
 * /api/candidate/vetting:
 *   get:
 *     summary: Get candidate's vetting status
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vetting status retrieved successfully
 */
router.get('/vetting', candidateController.getVettingStatus);

/**
 * @swagger
 * /api/candidate/vetting/apply:
 *   post:
 *     summary: Apply for vetting
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enrollmentId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Vetting application submitted successfully
 */
router.post('/vetting/apply', candidateController.applyForVetting);

/**
 * @swagger
 * /api/candidate/vetting/{vettingId}/documents:
 *   put:
 *     summary: Upload vetting documents
 *     tags: [Candidate]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vettingId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               policeDocument:
 *                 type: string
 *                 format: binary
 *               medicalReport:
 *                 type: string
 *                 format: binary
 *               vaccinationProof:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 */
router.put('/vetting/:vettingId/documents', 
  upload.fields([
    { name: 'policeDocument', maxCount: 1 },
    { name: 'medicalReport', maxCount: 1 },
    { name: 'vaccinationProof', maxCount: 1 }
  ]), 
  candidateController.updateVettingDocuments
);

module.exports = router;
