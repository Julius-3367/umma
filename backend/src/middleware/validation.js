const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema object
 * @param {String} property - Request property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails
      });
    }

    // Replace the original property with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // User registration
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).optional().allow(null, ''),
    phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).optional(),
    roleId: Joi.number().integer().positive().optional(),
    role: Joi.string().valid('Admin', 'Trainer', 'Candidate', 'Agent', 'Broker', 'Recruiter').optional()
  }),

  // User login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Password change
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  // Authenticated profile update
  updateProfile: Joi.object({
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional(),
    phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).optional(),
  }).min(1),

  // User update
  updateUser: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).optional(),
    isActive: Joi.boolean().optional()
  }),

  // Role creation
  createRole: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(255).optional(),
    permissions: Joi.object().optional()
  }),

  // Role update
  updateRole: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(255).optional(),
    permissions: Joi.object().optional()
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  createJobOpening: Joi.object({
    jobTitle: Joi.string().min(3).max(120).required(),
    employerName: Joi.string().min(2).max(120).required(),
    location: Joi.string().max(120).optional().allow('', null),
    jobType: Joi.string().max(60).optional().allow('', null),
    priority: Joi.string().valid('High', 'Medium', 'Low').optional(),
    openings: Joi.number().integer().min(1).max(500).optional(),
    salaryRange: Joi.string().max(120).optional().allow('', null),
    status: Joi.string().valid('OPEN', 'ON_HOLD', 'CLOSED').optional(),
    interviewDate: Joi.date().iso().optional(),
    description: Joi.string().max(2000).optional().allow('', null),
    requirements: Joi.string().max(2000).optional().allow('', null),
    metadata: Joi.object().optional(),
  }),

  // ID parameter
  idParam: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  candidateIdParam: Joi.object({
    candidateId: Joi.number().integer().positive().required(),
  }),

  pipelineTransition: Joi.object({
    nextStage: Joi.string().valid('APPLIED', 'UNDER_REVIEW', 'ENROLLED', 'WAITLISTED', 'PLACED', 'CANCELLED').required(),
    comment: Joi.string().max(1000).optional().allow('', null),
    isBlocked: Joi.boolean().optional(),
    blockerReason: Joi.when('isBlocked', {
      is: true,
      then: Joi.string().trim().min(5).max(500).required(),
      otherwise: Joi.string().max(500).optional().allow('', null),
    }),
  })
};

module.exports = {
  validate,
  schemas
};
