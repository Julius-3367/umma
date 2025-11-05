const express = require('express');
const candidateController = require('../controllers/candidateController');
const { authenticate, authorize } = require('../middleware/auth');

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

module.exports = router;
