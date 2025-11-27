const express = require('express');
const router = express.Router();
const recruiterController = require('../controllers/recruiterController');
const { authenticate, recruiterOrAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.use(authenticate);
router.use(recruiterOrAdmin);

router.get('/dashboard', recruiterController.getDashboard);
router.post('/jobs', validate(schemas.createJobOpening), recruiterController.createJobOpening);
router.get('/pipeline/candidates', recruiterController.getPipelineCandidates);
router.get(
	'/pipeline/:candidateId/events',
	validate(schemas.candidateIdParam, 'params'),
	recruiterController.getCandidatePipelineEvents,
);
router.post(
	'/pipeline/:candidateId/transition',
	validate(schemas.candidateIdParam, 'params'),
	validate(schemas.pipelineTransition),
	recruiterController.transitionCandidateStage,
);

module.exports = router;
