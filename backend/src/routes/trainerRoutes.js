const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const appealController = require('../controllers/attendanceAppealController');
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
 * Candidate Management
 */
router.get('/candidates', trainerController.getAllMyCandidates);
router.get('/candidates/:candidateId', trainerController.getCandidateProfile);
router.post('/candidates/:candidateId/assessments', trainerController.createCandidateAssessment);

/**
 * Attendance
 */
router.post('/attendance', trainerController.recordAttendance);

/**
 * Assessments
 */
router.post('/assessments', trainerController.createAssessment);
router.put('/assessments/:id', trainerController.updateAssessment);

/**
 * Attendance Appeals
 */
router.get('/attendance/appeals', appealController.getTrainerAppeals);
router.put('/attendance/appeals/:appealId/review', appealController.reviewAppeal);

/**
 * Cohort Management
 */
router.get('/cohorts', trainerController.getMyCohorts);
router.get('/cohorts/:cohortId/sessions', trainerController.getCohortSessions);
router.put('/cohorts/:cohortId/sessions/:sessionId', trainerController.updateCohortSession);

module.exports = router;
