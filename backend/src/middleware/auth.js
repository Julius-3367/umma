const { verifyAccessToken } = require('../config/jwt');
const prisma = require('../config/database');

/**
 * Authentication middleware - verifies JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token
    const decoded = verifyAccessToken(token);
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Role-based access control middleware
 * @param {Array} allowedRoles - Array of role names allowed to access the route
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (allowedRoles.length === 0) {
      // No specific roles required, just authenticated user
      return next();
    }

    const userRole = req.user.role?.name;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Admin only middleware
 */
const adminOnly = authorize(['Admin']);

/**
 * Trainer and Admin middleware
 */
const trainerOrAdmin = authorize(['Admin', 'Trainer']);

/**
 * Agent and Admin middleware
 */
const agentOrAdmin = authorize(['Admin', 'Agent']);

/**
 * Recruiter and Admin middleware
 */
const recruiterOrAdmin = authorize(['Admin', 'Recruiter']);

module.exports = {
  authenticate,
  authorize,
  adminOnly,
  trainerOrAdmin,
  agentOrAdmin,
  recruiterOrAdmin
};
