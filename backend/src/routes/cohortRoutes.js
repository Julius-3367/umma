const express = require('express');
const router = express.Router();
const cohortController = require('../controllers/cohortController');
const { authenticate, authorize } = require('../middleware/auth');

// All cohort routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/cohorts
 * @desc    Get all cohorts with filters
 * @access  Admin, Trainer
 */
router.get('/', authorize(['ADMIN', 'TRAINER']), cohortController.getCohorts);

/**
 * @route   POST /api/cohorts
 * @desc    Create a new cohort
 * @access  Admin
 */
router.post('/', authorize(['ADMIN']), cohortController.createCohort);

/**
 * @route   GET /api/cohorts/:id
 * @desc    Get cohort by ID with full details
 * @access  Admin, Trainer
 */
router.get('/:id', authorize(['ADMIN', 'TRAINER']), cohortController.getCohortById);

/**
 * @route   PUT /api/cohorts/:id
 * @desc    Update cohort
 * @access  Admin
 */
router.put('/:id', authorize(['ADMIN']), cohortController.updateCohort);

/**
 * @route   DELETE /api/cohorts/:id
 * @desc    Delete cohort
 * @access  Admin
 */
router.delete('/:id', authorize(['ADMIN']), cohortController.deleteCohort);

/**
 * @route   GET /api/cohorts/:id/progress
 * @desc    Get cohort progress/dashboard
 * @access  Admin, Trainer
 */
router.get('/:id/progress', authorize(['ADMIN', 'TRAINER']), cohortController.getCohortProgress);

/**
 * @route   POST /api/cohorts/:id/publish
 * @desc    Publish cohort
 * @access  Admin
 */
router.post('/:id/publish', authorize(['ADMIN']), cohortController.publishCohort);

/**
 * @route   POST /api/cohorts/:id/enrollment/open
 * @desc    Open enrollment for cohort
 * @access  Admin
 */
router.post('/:id/enrollment/open', authorize(['ADMIN']), cohortController.openEnrollment);

/**
 * @route   POST /api/cohorts/:id/enrollment/close
 * @desc    Close enrollment for cohort
 * @access  Admin
 */
router.post('/:id/enrollment/close', authorize(['ADMIN']), cohortController.closeEnrollment);

/**
 * @route   POST /api/cohorts/:id/enroll
 * @desc    Enroll student in cohort
 * @access  Admin
 */
router.post('/:id/enroll', authorize(['ADMIN']), cohortController.enrollStudent);

/**
 * @route   PUT /api/cohorts/:id/enrollments/:enrollmentId
 * @desc    Update cohort enrollment status
 * @access  Admin
 */
router.put('/:id/enrollments/:enrollmentId', authorize(['ADMIN']), cohortController.updateEnrollmentStatus);

/**
 * @route   POST /api/cohorts/:id/sessions
 * @desc    Create cohort session
 * @access  Admin, Trainer
 */
router.post('/:id/sessions', authorize(['ADMIN', 'TRAINER']), cohortController.createSession);

/**
 * @route   PUT /api/cohorts/:id/sessions/:sessionId
 * @desc    Update cohort session
 * @access  Admin, Trainer
 */
router.put('/:id/sessions/:sessionId', authorize(['ADMIN', 'TRAINER']), cohortController.updateSession);

/**
 * @route   POST /api/cohorts/:id/summary
 * @desc    Generate progress summary
 * @access  Admin
 */
router.post('/:id/summary', authorize(['ADMIN']), cohortController.generateProgressSummary);

/**
 * @route   POST /api/cohorts/:id/metrics/update
 * @desc    Update cohort metrics
 * @access  Admin
 */
router.post('/:id/metrics/update', authorize(['ADMIN']), cohortController.updateMetrics);

/**
 * @route   POST /api/cohorts/:id/archive
 * @desc    Archive cohort
 * @access  Admin
 */
router.post('/:id/archive', authorize(['ADMIN']), cohortController.archiveCohort);

module.exports = router;
