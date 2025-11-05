const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and Trainer role
router.use(authenticate);
router.use(authorize(['Trainer']));

/**
 * Dashboard
 */
router.get('/dashboard', trainerController.getDashboard);

/**
 * Course Management
 */
router.get('/courses', trainerController.getMyCourses);
router.get('/courses/:courseId', trainerController.getCourseDetails);
router.get('/courses/:courseId/students', trainerController.getCourseStudents);
router.get('/courses/:courseId/attendance', trainerController.getCourseAttendance);

/**
 * Attendance
 */
router.post('/attendance', trainerController.recordAttendance);

/**
 * Assessments
 */
router.post('/assessments', trainerController.createAssessment);
router.put('/assessments/:id', trainerController.updateAssessment);

module.exports = router;
