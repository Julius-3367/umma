const prisma = require('../config/database');

/**
 * Create an activity log entry
 * @param {Object} logData - Activity log data
 * @param {Number} logData.userId - User ID
 * @param {String} logData.action - Action performed
 * @param {String} logData.resource - Resource affected
 * @param {Object} logData.details - Additional details
 * @param {String} logData.ipAddress - IP address
 * @param {String} logData.userAgent - User agent string
 */
const createActivityLog = async (logData) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: logData.userId,
        action: logData.action,
        resource: logData.resource,
        details: logData.details ? JSON.stringify(logData.details) : null,
        ipAddress: logData.ipAddress || null,
        userAgent: logData.userAgent || null
      }
    });
  } catch (error) {
    console.error('Failed to create activity log:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

/**
 * Get activity logs with pagination and filtering
 * @param {Object} options - Query options
 * @param {Number} options.page - Page number
 * @param {Number} options.limit - Items per page
 * @param {Number} options.userId - Filter by user ID
 * @param {String} options.action - Filter by action
 * @param {String} options.resource - Filter by resource
 * @param {Date} options.startDate - Start date filter
 * @param {Date} options.endDate - End date filter
 */
const getActivityLogs = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    userId,
    action,
    resource,
    startDate,
    endDate
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where = {};
  
  if (userId) where.userId = userId;
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (resource) where.resource = { contains: resource, mode: 'insensitive' };
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.activityLog.count({ where })
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get activity logs for a specific user
 * @param {Number} userId - User ID
 * @param {Object} options - Query options
 */
const getUserActivityLogs = async (userId, options = {}) => {
  return getActivityLogs({
    ...options,
    userId
  });
};

/**
 * Get recent activity logs
 * @param {Number} limit - Number of recent logs to fetch
 */
const getRecentActivityLogs = async (limit = 10) => {
  return prisma.activityLog.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

/**
 * Delete old activity logs (for cleanup)
 * @param {Number} daysOld - Delete logs older than this many days
 */
const cleanupOldLogs = async (daysOld = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.activityLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  });

  return result.count;
};

module.exports = {
  createActivityLog,
  getActivityLogs,
  getUserActivityLogs,
  getRecentActivityLogs,
  cleanupOldLogs
};
