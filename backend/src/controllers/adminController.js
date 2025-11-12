const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Simple in-memory job tracker for report generation (keeps demo-lightweight)
const reportJobs = new Map();
const REPORTS_DIR = path.join(__dirname, '..', '..', 'uploads', 'reports');

// Ensure reports directory exists
try {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
} catch (err) {
  console.error('Failed to create reports directory:', err.message);
}

/**
 * Get admin dashboard overview
 */
const getDashboard = async (req, res) => {
  try {
    // Get counts
    const [
      totalUsers,
      totalCandidates,
      totalCourses,
      activeCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalPlacements,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.candidate.count(),
      prisma.course.count(),
      prisma.course.count({ where: { status: 'ACTIVE' } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { enrollmentStatus: 'ENROLLED' } }),
      prisma.enrollment.count({ where: { enrollmentStatus: 'COMPLETED' } }),
      prisma.placement.count(),
    ]);

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        role: {
          select: { name: true },
        },
      },
    });

    // Get recent enrollments
    const recentEnrollments = await prisma.enrollment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        candidate: {
          select: {
            fullName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        course: {
          select: {
            title: true,
            code: true,
          },
        },
      },
    });

    // Get activity logs
    const recentActivity = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCandidates,
          totalCourses,
          activeCourses,
          totalEnrollments,
          activeEnrollments,
          completedEnrollments,
          totalPlacements,
          enrollmentRate: totalCandidates > 0 ? ((activeEnrollments / totalCandidates) * 100).toFixed(1) : 0,
          completionRate: totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1) : 0,
        },
        recentUsers,
        recentEnrollments,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};

/**
 * Get all users with filtering and pagination
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (role) {
      where.role = { name: role };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          createdAt: true,
          lastLogin: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

/**
 * Get single user details
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        role: true,
        candidate: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

/**
 * Create new user
 */
const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, roleId } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        roleId: parseInt(roleId),
        status: 'ACTIVE',
      },
      include: {
        role: true,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone, roleId, status } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(email && { email }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(roleId && { roleId: parseInt(roleId) }),
        ...(status && { status }),
      },
      include: {
        role: true,
      },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};

/**
 * Delete user
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

/**
 * Get all courses
 */
const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        courses,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message,
    });
  }
};

/**
 * Get all companies
 */
const getAllCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, industry, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (industry) where.industry = industry;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { contactPerson: { contains: search } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.company.count({ where }),
    ]);

    // Return a flat structure expected by frontend (companies, totalCount, page, limit)
    res.json({
      success: true,
      companies,
      totalCount: total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ success: false, message: 'Error fetching companies', error: error.message });
  }
};

/**
 * Get company by ID
 */
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({ where: { id: parseInt(id) } });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ success: false, message: 'Error fetching company', error: error.message });
  }
};

/**
 * Create new company
 */
const createCompany = async (req, res) => {
  try {
    const { name, email, phone, country, industry, contactPerson, website, address, status } = req.body;
    
    // Validate required field
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const company = await prisma.company.create({
      data: {
        tenantId: 1,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        country: country?.trim() || null,
        industry: industry?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        website: website?.trim() || null,
        address: address?.trim() || null,
        status: status || 'ACTIVE',
        createdBy: req.user?.userId || null,
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        tenantId: 1,
        userId: req.user?.userId || null,
        action: 'CREATE',
        targetType: 'Company',
        targetId: company.id,
        details: `Created company: ${company.name}`,
      },
    }).catch(err => console.error('Activity log error:', err));

    res.status(201).json({ success: true, message: 'Company created successfully', data: company });
  } catch (error) {
    console.error('Error creating company:', error);
    console.error('Error details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating company', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Update company
 */
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, country, industry, contactPerson, website, address, status } = req.body;

    const existing = await prisma.company.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Company not found' });

    const company = await prisma.company.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        phone,
        country,
        industry,
        contactPerson,
        website,
        address,
        status: status || existing.status,
        updatedBy: req.user?.userId,
      },
    });

    await prisma.activityLog.create({
      data: {
        tenantId: 1,
        userId: req.user?.userId,
        action: 'UPDATE',
        targetType: 'Company',
        targetId: company.id,
        details: `Updated company: ${company.name}`,
      },
    }).catch(err => console.error('Activity log error:', err));

    res.json({ success: true, message: 'Company updated successfully', data: company });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ success: false, message: 'Error updating company', error: error.message });
  }
};

/**
 * Delete company
 */
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.company.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Company not found' });

    await prisma.company.delete({ where: { id: parseInt(id) } });

    await prisma.activityLog.create({
      data: {
        tenantId: 1,
        userId: req.user?.userId,
        action: 'DELETE',
        targetType: 'Company',
        targetId: parseInt(id),
        details: `Deleted company: ${existing.name}`,
      },
    }).catch(err => console.error('Activity log error:', err));

    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ success: false, message: 'Error deleting company', error: error.message });
  }
};

/**
 * Get course by ID
 */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        enrollments: {
          include: {
            candidate: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            assessments: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message,
    });
  }
};

/**
 * Create new course
 */
const createCourse = async (req, res) => {
  try {
    const {
      title,
      courseCode,
      category,
      description,
      objectives,
      prerequisites,
      startDate,
      endDate,
      startTime,
      endTime,
      duration,
      durationUnit,
      schedule,
      customSchedule,
      maxCapacity,
      minCapacity,
      courseFee,
      currency,
      registrationDeadline,
      allowWaitlist,
      primaryTrainer,
      secondaryTrainers,
      status,
    } = req.body;

    // Calculate duration in days
    let durationDays = duration;
    if (durationUnit === 'weeks') {
      durationDays = duration * 7;
    } else if (durationUnit === 'months') {
      durationDays = duration * 30;
    }

    // Prepare trainers data
    const trainersData = {
      primary: primaryTrainer,
      secondary: secondaryTrainers || [],
      schedule: schedule,
      customSchedule: customSchedule || [],
      startTime: startTime,
      endTime: endTime,
    };

    // Prepare additional data
    const additionalData = {
      objectives: objectives || [],
      prerequisites: prerequisites || [],
      minCapacity: minCapacity,
      courseFee: courseFee,
      currency: currency,
      registrationDeadline: registrationDeadline,
      allowWaitlist: allowWaitlist,
      durationUnit: durationUnit,
    };

    const course = await prisma.course.create({
      data: {
        tenantId: 1, // Default tenant
        title,
        code: courseCode,
        category,
        description,
        durationDays,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        trainers: trainersData,
        capacity: parseInt(maxCapacity),
        // Allow client to provide a status; default to ACTIVE so newly created courses are published
        status: status || 'ACTIVE',
        createdBy: req.user?.userId,
        // Store additional data in a custom field if available, or we'll need to modify schema
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: 1,
        userId: req.user?.userId,
        action: 'CREATE',
        targetType: 'Course',
        targetId: course.id,
        details: `Created course: ${course.title} (${course.code})`,
      },
    }).catch(err => console.error('Activity log error:', err));

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message,
    });
  }
};

/**
 * Update course
 */
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      courseCode,
      category,
      description,
      objectives,
      prerequisites,
      startDate,
      endDate,
      startTime,
      endTime,
      duration,
      durationUnit,
      schedule,
      customSchedule,
      maxCapacity,
      minCapacity,
      courseFee,
      currency,
      registrationDeadline,
      allowWaitlist,
      primaryTrainer,
      secondaryTrainers,
      status,
    } = req.body;

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Calculate duration in days
    let durationDays = duration;
    if (durationUnit === 'weeks') {
      durationDays = duration * 7;
    } else if (durationUnit === 'months') {
      durationDays = duration * 30;
    }

    // Prepare trainers data
    const trainersData = {
      primary: primaryTrainer,
      secondary: secondaryTrainers || [],
      schedule: schedule,
      customSchedule: customSchedule || [],
      startTime: startTime,
      endTime: endTime,
    };

    const course = await prisma.course.update({
      where: { id: parseInt(id) },
      data: {
        title,
        code: courseCode,
        category,
        description,
        durationDays,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        trainers: trainersData,
        capacity: parseInt(maxCapacity),
        status: status || existingCourse.status,
        updatedBy: req.user?.userId,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: 1,
        userId: req.user?.userId,
        action: 'UPDATE',
        targetType: 'Course',
        targetId: course.id,
        details: `Updated course: ${course.title} (${course.code})`,
      },
    }).catch(err => console.error('Activity log error:', err));

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message,
    });
  }
};

/**
 * Delete course
 */
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if course has enrollments
    if (course._count.enrollments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete course with existing enrollments. Please cancel or complete all enrollments first.',
      });
    }

    await prisma.course.delete({
      where: { id: parseInt(id) },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: 1,
        userId: req.user?.userId,
        action: 'DELETE',
        targetType: 'Course',
        targetId: parseInt(id),
        details: `Deleted course: ${course.title} (${course.code})`,
      },
    }).catch(err => console.error('Activity log error:', err));

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message,
    });
  }
};

/**
 * Get all candidates
 */
const getAllCandidates = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { nationalIdPassport: { contains: search } },
      ];
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      }),
      prisma.candidate.count({ where }),
    ]);

    res.json({
      success: true,
      data: candidates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching candidates',
      error: error.message,
    });
  }
};

/**
 * Get system statistics
 */
const getStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      userStats,
      enrollmentStats,
      courseStats,
      placementStats,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['roleId'],
        _count: true,
      }),
      prisma.enrollment.groupBy({
        by: ['enrollmentStatus'],
        _count: true,
      }),
      prisma.course.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.placement.groupBy({
        by: ['placementStatus'],
        _count: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        userStats,
        enrollmentStats,
        courseStats,
        placementStats,
        period: parseInt(period),
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};

/**
 * Get activity logs
 */
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.activityLog.count(),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity logs',
      error: error.message,
    });
  }
};

/**
 * Get certificate requests for approval
 */
const getCertificateRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      approvalStatus: status.toUpperCase(),
    };

    const [requests, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { requestedAt: 'desc' },
        include: {
          enrollment: {
            include: {
              candidate: {
                include: {
                  user: {
                    select: { email: true },
                  },
                },
              },
              course: {
                select: { id: true, title: true, code: true },
              },
            },
          },
          requestedByUser: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.certificate.count({ where }),
    ]);

    // Get assessments for each certificate
    const requestsWithAssessments = await Promise.all(
      requests.map(async (cert) => {
        const assessment = await prisma.assessment.findFirst({
          where: {
            enrollmentId: cert.enrollmentId,
          },
          orderBy: { createdAt: 'desc' },
        });

        return {
          id: cert.id,
          requestedAt: cert.requestedAt,
          approvalStatus: cert.approvalStatus,
          candidate: cert.enrollment.candidate,
          course: cert.enrollment.course,
          trainer: cert.requestedByUser,
          assessment,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        requests: requestsWithAssessments,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching certificate requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificate requests',
      error: error.message,
    });
  }
};

/**
 * Get certificate approval statistics
 */
const getCertificateStats = async (req, res) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      prisma.certificate.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.certificate.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.certificate.count({ where: { approvalStatus: 'REJECTED' } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
      },
    });
  } catch (error) {
    console.error('Error fetching certificate stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificate statistics',
      error: error.message,
    });
  }
};

/**
 * Process certificate request (approve/reject)
 */
const processCertificateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"',
      });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: parseInt(id) },
      include: {
        enrollment: {
          include: {
            candidate: {
              include: { user: true },
            },
            course: true,
          },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate request not found',
      });
    }

    if (certificate.approvalStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Certificate request has already been processed',
      });
    }

    const updateData = {
      approvalStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      ...(action === 'reject' && reason && { rejectionReason: reason }),
      ...(action === 'approve' && { issuedDate: new Date() }),
    };

    const updatedCertificate = await prisma.certificate.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Create notification for candidate
    await prisma.notification.create({
      data: {
        userId: certificate.enrollment.candidate.userId,
        type: action === 'approve' ? 'certificate_approved' : 'certificate_rejected',
        title: `Certificate ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message:
          action === 'approve'
            ? `Your certificate for ${certificate.enrollment.course.title} has been approved!`
            : `Your certificate request for ${certificate.enrollment.course.title} has been rejected. ${reason || ''}`,
        relatedEntityType: 'certificate',
        relatedEntityId: certificate.id,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `CERTIFICATE_${action.toUpperCase()}`,
        resource: 'Certificate',
        details: {
          certificateId: certificate.id,
          candidateId: certificate.enrollment.candidateId,
          courseId: certificate.enrollment.courseId,
          ...(reason && { reason }),
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(200).json({
      success: true,
      message: `Certificate request ${action}d successfully`,
      data: updatedCertificate,
    });
  } catch (error) {
    console.error('Error processing certificate request:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing certificate request',
      error: error.message,
    });
  }
};

/**
 * Get attendance for a specific course and date
 */
const getAttendance = async (req, res) => {
  try {
    const { courseId, date } = req.query;

    if (!courseId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and date are required',
      });
    }

    const parsedCourseId = parseInt(courseId);
    const attendanceDate = new Date(date);

    // Get user's tenant ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    if (!user || !user.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User tenant not found',
      });
    }

    // Get all enrolled students for the course
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: parsedCourseId,
        tenantId: user.tenantId,
        enrollmentStatus: 'ENROLLED',
      },
      include: {
        candidate: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Get attendance records for the date
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        courseId: parsedCourseId,
        tenantId: user.tenantId,
        date: attendanceDate,
      },
      include: {
        enrollment: {
          include: {
            candidate: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    // Create a map of userId to attendance record
    const userAttendanceMap = {};
    attendanceRecords.forEach(record => {
      if (record.enrollment && record.enrollment.candidate) {
        userAttendanceMap[record.enrollment.candidate.userId] = {
          status: record.status.toLowerCase(),
          remarks: record.remarks,
        };
      }
    });

    // Map students with their attendance
    const students = enrollments.map(enrollment => ({
      id: enrollment.candidate.user.id,
      firstName: enrollment.candidate.user.firstName,
      lastName: enrollment.candidate.user.lastName,
      email: enrollment.candidate.user.email,
      candidateId: enrollment.candidateId,
    }));

    const attendance = students.map(student => ({
      studentId: student.id,
      status: userAttendanceMap[student.id]?.status || 'present',
      remarks: userAttendanceMap[student.id]?.remarks || '',
    }));

    res.status(200).json({
      success: true,
      data: {
        students,
        attendance,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message,
    });
  }
};

/**
 * Save attendance records
 */
const saveAttendance = async (req, res) => {
  try {
    const { courseId, date, records } = req.body;

    if (!courseId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, date, and attendance records are required',
      });
    }

    const attendanceDate = new Date(date);
    const parsedCourseId = parseInt(courseId);

    // Get user's tenant ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    if (!user || !user.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User tenant not found',
      });
    }

    // Get enrollments for the course to map students to enrollment IDs
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: parsedCourseId,
        tenantId: user.tenantId,
      },
      include: {
        candidate: {
          select: { userId: true },
        },
      },
    });

    // Create a map of userId to enrollmentId
    const userToEnrollmentMap = {};
    enrollments.forEach(enrollment => {
      if (enrollment.candidate) {
        userToEnrollmentMap[enrollment.candidate.userId] = enrollment.id;
      }
    });

    // Delete existing attendance for the date
    await prisma.attendanceRecord.deleteMany({
      where: {
        tenantId: user.tenantId,
        courseId: parsedCourseId,
        date: attendanceDate,
      },
    });

    // Create new attendance records
    const attendanceData = records
      .filter(record => userToEnrollmentMap[record.studentId]) // Only include students with enrollments
      .map(record => ({
        tenantId: user.tenantId,
        enrollmentId: userToEnrollmentMap[record.studentId],
        courseId: parsedCourseId,
        date: attendanceDate,
        status: record.status.toUpperCase(),
        remarks: record.remarks || null,
        recordedBy: req.user.id,
      }));

    if (attendanceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid enrollments found for the provided students',
      });
    }

    await prisma.attendanceRecord.createMany({
      data: attendanceData,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'ATTENDANCE_MARKED',
        entity: 'Attendance',
        entityId: parsedCourseId,
        details: `Marked attendance for ${attendanceData.length} students on ${date}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Attendance saved successfully',
      data: { recordsCount: attendanceData.length },
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving attendance',
      error: error.message,
    });
  }
};

/**
 * Get attendance statistics
 */
const getAttendanceStatistics = async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;

    if (!courseId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, start date, and end date are required',
      });
    }

    // Get user's tenant ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    if (!user || !user.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User tenant not found',
      });
    }

    const attendance = await prisma.attendanceRecord.findMany({
      where: {
        tenantId: user.tenantId,
        courseId: parseInt(courseId),
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
    };

    // Group by date
    const byDate = {};
    attendance.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = { present: 0, absent: 0, late: 0 };
      }
      byDate[dateKey][record.status.toLowerCase()]++;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: stats,
        byDate,
      },
    });
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};

/**
 * Send absence notifications
 */
const sendAttendanceNotifications = async (req, res) => {
  try {
    const { courseId, date, studentIds } = req.body;

    if (!courseId || !date || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, date, and student IDs are required',
      });
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
    });

    // Get student details
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Create notifications
    const notifications = students.map(student => ({
      userId: student.id,
      type: 'ABSENCE_ALERT',
      title: 'Absence Notification',
      message: `You were marked absent for ${course.title} on ${date}. Please contact your trainer if this is incorrect.`,
      relatedEntity: 'Course',
      relatedEntityId: courseId,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'NOTIFICATIONS_SENT',
        entity: 'Attendance',
        entityId: courseId,
        details: `Sent absence notifications to ${studentIds.length} students for ${date}`,
      },
    });

    res.status(200).json({
      success: true,
      message: `Notifications sent to ${studentIds.length} students`,
      data: { notificationCount: studentIds.length },
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notifications',
      error: error.message,
    });
  }
};

/**
 * Export attendance to CSV
 */
const exportAttendance = async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;

    if (!courseId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, start date, and end date are required',
      });
    }

    // Get attendance records
    const attendance = await prisma.attendanceRecord.findMany({
      where: {
        courseId: parseInt(courseId),
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { user: { lastName: 'asc' } },
      ],
    });

    // Generate CSV
    const csvHeaders = 'Date,Student Name,Email,Status,Remarks\n';
    const csvRows = attendance.map(record => {
      const date = record.date.toISOString().split('T')[0];
      const name = `${record.user.firstName} ${record.user.lastName}`;
      const email = record.user.email;
      const status = record.status;
      const remarks = record.remarks || '';
      return `${date},"${name}",${email},${status},"${remarks}"`;
    }).join('\n');

    const csv = csvHeaders + csvRows;

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${courseId}_${startDate}_${endDate}.csv`);
    
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting attendance',
      error: error.message,
    });
  }
};

/**
 * ============================================
 * CERTIFICATE MANAGEMENT SYSTEM
 * ============================================
 */

/**
 * Get all certificates with filtering
 */
const getCertificates = async (req, res) => {
  try {
    const { status, courseId, candidateId, search } = req.query;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    // Default to tenant 1 if user doesn't have tenantId
    const tenantId = user.tenantId || 1;

    const where = {
      tenantId,
    };

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (courseId) {
      where.courseId = parseInt(courseId);
    }

    if (candidateId) {
      where.enrollment = {
        candidateId: parseInt(candidateId),
      };
    }

    if (search) {
      where.OR = [
        { certificateNumber: { contains: search } },
        { enrollment: {
          candidate: {
            user: {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
              ],
            },
          },
        }},
      ];
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        enrollment: {
          include: {
            candidate: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            course: {
              select: {
                title: true,
                code: true,
              },
            },
          },
        },
        template: {
          select: {
            name: true,
          },
        },
        issuedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    // Format response
    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      candidateName: `${cert.enrollment.candidate.user.firstName} ${cert.enrollment.candidate.user.lastName}`,
      candidateEmail: cert.enrollment.candidate.user.email,
      courseName: cert.enrollment.course.title,
      courseCode: cert.enrollment.course.code,
      templateName: cert.template?.name,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      status: cert.status,
      grade: cert.grade,
      qrCode: cert.qrCode,
      digitalSignature: cert.digitalSignature,
      issuedBy: cert.issuedByUser ? `${cert.issuedByUser.firstName} ${cert.issuedByUser.lastName}` : null,
      createdAt: cert.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedCertificates,
      count: formattedCertificates.length,
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificates',
      error: error.message,
    });
  }
};

/**
 * Get certificate by ID
 */
const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    const certificate = await prisma.certificate.findFirst({
      where: {
        id: parseInt(id),
        tenantId: user.tenantId,
      },
      include: {
        enrollment: {
          include: {
            candidate: {
              include: {
                user: true,
              },
            },
            course: true,
          },
        },
        template: true,
        issuedByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificate',
      error: error.message,
    });
  }
};

/**
 * Generate single certificate
 */
const generateCertificate = async (req, res) => {
  try {
    const { templateId, candidateId, courseId, enrollmentId, issueDate, expiryDate, grade, remarks } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    let enrollment;

    // Get enrollment either by enrollmentId or by candidateId + courseId
    if (enrollmentId) {
      enrollment = await prisma.enrollment.findFirst({
        where: {
          id: parseInt(enrollmentId),
          tenantId: user.tenantId,
        },
        include: {
          candidate: {
            include: {
              user: true,
            },
          },
          course: true,
        },
      });
    } else if (candidateId && courseId) {
      enrollment = await prisma.enrollment.findFirst({
        where: {
          candidateId: parseInt(candidateId),
          courseId: parseInt(courseId),
          tenantId: user.tenantId,
        },
        include: {
          candidate: {
            include: {
              user: true,
            },
          },
          course: true,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either enrollmentId or (candidateId and courseId) are required',
      });
    }

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Check if certificate already exists for this enrollment
    const existingCertificate = await prisma.certificate.findUnique({
      where: {
        tenantId_enrollmentId: {
          tenantId: user.tenantId,
          enrollmentId: enrollment.id,
        },
      },
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already exists for this enrollment. Use reissue if you need to generate a new one.',
      });
    }

    // Generate certificate number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const certificateNumber = `CERT-${timestamp}-${random}`;

    // Generate QR code data (simplified - in production use proper QR library)
    const qrCodeData = JSON.stringify({
      certificateNumber,
      candidateId: enrollment.candidateId,
      courseId: enrollment.courseId,
      issueDate: issueDate || new Date(),
    });

    // Generate digital signature (simplified - in production use proper crypto)
    const crypto = require('crypto');
    const signatureData = `${certificateNumber}${enrollment.candidateId}${enrollment.courseId}${issueDate || new Date()}`;
    const digitalSignature = crypto.createHash('sha256').update(signatureData).digest('hex');

    // Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        tenantId: user.tenantId,
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        templateId: templateId ? parseInt(templateId) : null,
        certificateNumber,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: 'ISSUED',
        grade: grade || null,
        remarks: remarks || null,
        qrCode: qrCodeData,
        digitalSignature,
        issuedBy: req.user.id,
      },
      include: {
        enrollment: {
          include: {
            candidate: {
              include: {
                user: true,
              },
            },
            course: true,
          },
        },
        template: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: user.tenantId,
        userId: req.user.id,
        action: 'CERTIFICATE_GENERATED',
        entityType: 'Certificate',
        entityId: certificate.id,
        description: `Generated certificate ${certificateNumber} for ${enrollment.candidate.user.firstName} ${enrollment.candidate.user.lastName}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      data: certificate,
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating certificate',
      error: error.message,
    });
  }
};

/**
 * Bulk generate certificates
 */
const bulkGenerateCertificates = async (req, res) => {
  try {
    const { templateId, courseId, candidateIds, issueDate } = req.body;

    if (!templateId || !courseId || !candidateIds || !Array.isArray(candidateIds)) {
      return res.status(400).json({
        success: false,
        message: 'Template ID, course ID, and candidate IDs array are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    // Get all enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        candidateId: { in: candidateIds.map(id => parseInt(id)) },
        courseId: parseInt(courseId),
        tenantId: user.tenantId,
      },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid enrollments found',
      });
    }

    const crypto = require('crypto');
    const certificates = [];

    // Generate certificates for each enrollment
    for (const enrollment of enrollments) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const certificateNumber = `CERT-${timestamp}-${random}`;

      const qrCodeData = JSON.stringify({
        certificateNumber,
        candidateId: enrollment.candidateId,
        courseId,
        issueDate: issueDate || new Date(),
      });

      const signatureData = `${certificateNumber}${enrollment.candidateId}${courseId}${issueDate}`;
      const digitalSignature = crypto.createHash('sha256').update(signatureData).digest('hex');

      const certificate = await prisma.certificate.create({
        data: {
          tenantId: user.tenantId,
          enrollmentId: enrollment.id,
          templateId: parseInt(templateId),
          certificateNumber,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          status: 'ISSUED',
          qrCode: qrCodeData,
          digitalSignature,
          issuedBy: req.user.id,
        },
      });

      certificates.push(certificate);

      // Log activity
      await prisma.activityLog.create({
        data: {
          tenantId: user.tenantId,
          userId: req.user.id,
          action: 'CERTIFICATE_GENERATED',
          entityType: 'Certificate',
          entityId: certificate.id,
          description: `Bulk generated certificate ${certificateNumber} for ${enrollment.candidate.user.firstName} ${enrollment.candidate.user.lastName}`,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully generated ${certificates.length} certificates`,
      data: certificates,
      count: certificates.length,
    });
  } catch (error) {
    console.error('Error bulk generating certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk generating certificates',
      error: error.message,
    });
  }
};

/**
 * Download certificate as PDF
 */
const downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    // Build the where clause - if user has no tenantId, don't filter by it
    const whereClause = {
      id: parseInt(id),
    };
    
    if (user.tenantId) {
      whereClause.tenantId = user.tenantId;
    }

    const certificate = await prisma.certificate.findFirst({
      where: whereClause,
      include: {
        enrollment: {
          include: {
            candidate: true,
            course: true,
          },
        },
        template: true,
        Course: true,
      },
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    // Get candidate name and course title
    const candidateName = certificate.enrollment?.candidate?.fullName || 'N/A';
    const courseTitle = certificate.enrollment?.course?.title || 
                       certificate.Course?.title || 
                       certificate.enrollment?.course?.name || 
                       'Course Name';
    const issueDate = certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : 'N/A';

    // In production, use a proper PDF generation library like puppeteer or pdfkit
    // For now, send a simple text-based certificate
    const pdfContent = `
================================================================================
                        CERTIFICATE OF COMPLETION
================================================================================

Certificate Number: ${certificate.certificateNumber}

This is to certify that

                            ${candidateName}

has successfully completed the training program

                            ${courseTitle}

Issue Date: ${issueDate}
Status: ${certificate.status}

${certificate.remarks || ''}

${certificate.digitalSignature ? 'Digital Signature: ' + certificate.digitalSignature : ''}
${certificate.qrCode ? 'QR Code: ' + certificate.qrCode : ''}

================================================================================
    `.trim();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.certificateNumber}.pdf`);
    res.status(200).send(pdfContent);

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          tenantId: user.tenantId || certificate.tenantId || 1,
          userId: req.user.id,
          action: 'CERTIFICATE_DOWNLOADED',
          entityType: 'Certificate',
          entityId: certificate.id,
          description: `Downloaded certificate ${certificate.certificateNumber}`,
        },
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
      // Don't fail the download if logging fails
    }
  } catch (error) {
    console.error('Error downloading certificate:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error downloading certificate',
      error: error.message,
    });
  }
};

/**
 * Send certificate via email
 */
const sendCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    const certificate = await prisma.certificate.findFirst({
      where: {
        id: parseInt(id),
        tenantId: user.tenantId,
      },
      include: {
        enrollment: {
          include: {
            candidate: {
              include: {
                user: true,
              },
            },
            course: true,
          },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    // For now, log the action
    console.log(`Sending certificate ${certificate.certificateNumber} to ${certificate.enrollment.candidate.user.email}`);

    // Update certificate status if it was pending
    if (certificate.status === 'PENDING') {
      await prisma.certificate.update({
        where: { id: certificate.id },
        data: { status: 'ISSUED' },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: user.tenantId,
        userId: req.user.id,
        action: 'CERTIFICATE_SENT',
        entityType: 'Certificate',
        entityId: certificate.id,
        description: `Sent certificate ${certificate.certificateNumber} to ${certificate.enrollment.candidate.user.email}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Certificate sent successfully',
    });
  } catch (error) {
    console.error('Error sending certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending certificate',
      error: error.message,
    });
  }
};

/**
 * Verify certificate
 */
const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber, qrCode } = req.body;

    if (!certificateNumber && !qrCode) {
      return res.status(400).json({
        success: false,
        message: 'Certificate number or QR code is required',
      });
    }

    const where = {};
    if (certificateNumber) {
      where.certificateNumber = certificateNumber;
    }
    if (qrCode) {
      where.qrCode = { contains: certificateNumber || '' };
    }

    const certificate = await prisma.certificate.findFirst({
      where,
      include: {
        enrollment: {
          include: {
            candidate: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            course: {
              select: {
                title: true,
                code: true,
              },
            },
          },
        },
        template: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid',
      });
    }

    // Check if certificate is revoked or expired
    const isRevoked = certificate.status === 'REVOKED';
    const isExpired = certificate.expiryDate && new Date(certificate.expiryDate) < new Date();

    res.status(200).json({
      success: true,
      data: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        candidateName: `${certificate.enrollment.candidate.user.firstName} ${certificate.enrollment.candidate.user.lastName}`,
        candidateEmail: certificate.enrollment.candidate.user.email,
        courseName: certificate.enrollment.course.title,
        courseCode: certificate.enrollment.course.code,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        status: certificate.status,
        grade: certificate.grade,
        isValid: !isRevoked && !isExpired,
        isRevoked,
        isExpired,
      },
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying certificate',
      error: error.message,
    });
  }
};

/**
 * Revoke certificate
 */
const revokeCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    const certificate = await prisma.certificate.findFirst({
      where: {
        id: parseInt(id),
        tenantId: user.tenantId,
      },
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    // Update certificate status
    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        status: 'REVOKED',
        remarks: reason || 'Revoked by administrator',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: user.tenantId,
        userId: req.user.id,
        action: 'CERTIFICATE_REVOKED',
        entityType: 'Certificate',
        entityId: certificate.id,
        description: `Revoked certificate ${certificate.certificateNumber}. Reason: ${reason || 'Not specified'}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully',
      data: updatedCertificate,
    });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking certificate',
      error: error.message,
    });
  }
};

/**
 * Reissue certificate
 */
const reissueCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    const oldCertificate = await prisma.certificate.findFirst({
      where: {
        id: parseInt(id),
        tenantId: user.tenantId,
      },
      include: {
        enrollment: true,
      },
    });

    if (!oldCertificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    const crypto = require('crypto');
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const newCertificateNumber = `CERT-${timestamp}-${random}`;

    const qrCodeData = JSON.stringify({
      certificateNumber: newCertificateNumber,
      candidateId: oldCertificate.enrollment.candidateId,
      courseId: oldCertificate.enrollment.courseId,
      issueDate: new Date(),
      reissuedFrom: oldCertificate.certificateNumber,
    });

    const signatureData = `${newCertificateNumber}${oldCertificate.enrollment.candidateId}${oldCertificate.enrollment.courseId}${new Date()}`;
    const digitalSignature = crypto.createHash('sha256').update(signatureData).digest('hex');

    // Mark old certificate as reissued
    await prisma.certificate.update({
      where: { id: oldCertificate.id },
      data: {
        status: 'REISSUED',
        remarks: `Reissued as ${newCertificateNumber}`,
      },
    });

    // Create new certificate
    const newCertificate = await prisma.certificate.create({
      data: {
        tenantId: user.tenantId,
        enrollmentId: oldCertificate.enrollmentId,
        templateId: oldCertificate.templateId,
        certificateNumber: newCertificateNumber,
        issueDate: new Date(),
        expiryDate: oldCertificate.expiryDate,
        status: 'ISSUED',
        grade: oldCertificate.grade,
        remarks: `Reissued from ${oldCertificate.certificateNumber}`,
        qrCode: qrCodeData,
        digitalSignature,
        issuedBy: req.user.id,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: user.tenantId,
        userId: req.user.id,
        action: 'CERTIFICATE_REISSUED',
        entityType: 'Certificate',
        entityId: newCertificate.id,
        description: `Reissued certificate ${oldCertificate.certificateNumber} as ${newCertificateNumber}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Certificate reissued successfully',
      data: newCertificate,
    });
  } catch (error) {
    console.error('Error reissuing certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error reissuing certificate',
      error: error.message,
    });
  }
};

/**
 * Get certificate statistics
 */
const getCertificateStatistics = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    // Default to tenant 1 if user doesn't have tenantId
    const tenantId = user.tenantId || 1;

    const [total, issued, pending, revoked] = await Promise.all([
      prisma.certificate.count({
        where: { tenantId },
      }),
      prisma.certificate.count({
        where: { tenantId, status: 'ISSUED' },
      }),
      prisma.certificate.count({
        where: { tenantId, status: 'PENDING' },
      }),
      prisma.certificate.count({
        where: { tenantId, status: 'REVOKED' },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        issued,
        pending,
        revoked,
      },
    });
  } catch (error) {
    console.error('Error fetching certificate statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificate statistics',
      error: error.message,
    });
  }
};

/**
 * ============================================
 * CERTIFICATE TEMPLATES
 * ============================================
 */

/**
 * Get all certificate templates
 */
const getCertificateTemplates = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    const templates = await prisma.certificateTemplate.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching certificate templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificate templates',
      error: error.message,
    });
  }
};

/**
 * Get certificate template by ID
 */
const getCertificateTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    const template = await prisma.certificateTemplate.findFirst({
      where: {
        id: parseInt(id),
        tenantId: user.tenantId,
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error fetching certificate template:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching certificate template',
      error: error.message,
    });
  }
};

/**
 * Create certificate template
 */
const createCertificateTemplate = async (req, res) => {
  try {
    const { name, description, design, content } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    const template = await prisma.certificateTemplate.create({
      data: {
        tenantId: user.tenantId,
        name,
        description: description || null,
        design: design || {},
        content: content || {},
        createdBy: req.user.id,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: user.tenantId,
        userId: req.user.id,
        action: 'TEMPLATE_CREATED',
        entityType: 'CertificateTemplate',
        entityId: template.id,
        description: `Created certificate template: ${name}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template,
    });
  } catch (error) {
    console.error('Error creating certificate template:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating certificate template',
      error: error.message,
    });
  }
};

/**
 * Update certificate template
 */
const updateCertificateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, design, content } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    const existingTemplate = await prisma.certificateTemplate.findFirst({
      where: {
        id: parseInt(id),
        tenantId: user.tenantId,
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    const template = await prisma.certificateTemplate.update({
      where: { id: existingTemplate.id },
      data: {
        name: name || existingTemplate.name,
        description: description !== undefined ? description : existingTemplate.description,
        design: design || existingTemplate.design,
        content: content || existingTemplate.content,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: user.tenantId,
        userId: req.user.id,
        action: 'TEMPLATE_UPDATED',
        entityType: 'CertificateTemplate',
        entityId: template.id,
        description: `Updated certificate template: ${template.name}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: template,
    });
  } catch (error) {
    console.error('Error updating certificate template:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating certificate template',
      error: error.message,
    });
  }
};

/**
 * Delete certificate template
 */
const deleteCertificateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { tenantId: true },
    });

    const template = await prisma.certificateTemplate.findFirst({
      where: {
        id: parseInt(id),
        tenantId: user.tenantId,
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Check if template is in use
    const certificatesUsingTemplate = await prisma.certificate.count({
      where: { templateId: template.id },
    });

    if (certificatesUsingTemplate > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete template. It is used by ${certificatesUsingTemplate} certificate(s)`,
      });
    }

    await prisma.certificateTemplate.delete({
      where: { id: template.id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId: user.tenantId,
        userId: req.user.id,
        action: 'TEMPLATE_DELETED',
        entityType: 'CertificateTemplate',
        entityId: template.id,
        description: `Deleted certificate template: ${template.name}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting certificate template:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting certificate template',
      error: error.message,
    });
  }
};

/**
 * Generate report (queues job and returns job id)
 */
const generateReport = async (req, res) => {
  try {
    const { type = 'generic', format = 'csv', startDate, endDate } = req.body || {};

      const jobId = `r_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const createdAt = new Date();

      // Persist a job record in the database so it survives restarts
      const dbJob = await prisma.reportJob.create({
        data: {
          tenantId: req.user?.tenantId || 1,
          type,
          format,
          status: 'queued',
          downloadUrl: null,
          meta: { startDate: startDate || null, endDate: endDate || null },
        },
      });

      const job = {
        id: `r_${dbJob.id}_${Date.now()}`, // keep a friendly unique id for file naming
        dbId: dbJob.id,
        type,
        format,
        status: 'queued',
        createdAt: createdAt.toISOString(),
        downloadUrl: null,
      };

      // keep an in-memory mirror for quick lookups while process runs
      reportJobs.set(job.id, job);

      // Respond quickly with job id, then process asynchronously
      res.status(202).json({ success: true, data: { jobId: job.id, ...job } });

      // Async processing (fire-and-forget)
      (async () => {
        try {
          const startedAt = new Date();

          // update DB status -> processing
          await prisma.reportJob.update({ where: { id: dbJob.id }, data: { status: 'processing', startedAt } });

          const processingJob = { ...job, status: 'processing', startedAt: startedAt.toISOString() };
          reportJobs.set(job.id, processingJob);

          // Data selection based on type (simple examples)
        let rows = [];
        if (type === 'users') {
          rows = await prisma.user.findMany({
            select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1000,
          });
        } else if (type === 'courses') {
          rows = await prisma.course.findMany({
            select: { id: true, title: true, code: true, category: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1000,
          });
        } else {
          // default sample
          rows = [{ info: `Report for type '${type}' not implemented; this is a sample row.` }];
        }

        // Ensure directory exists (best-effort)
        try { fs.mkdirSync(REPORTS_DIR, { recursive: true }); } catch (e) { /* ignore */ }

        // Write CSV file (simple, no external deps)
  const fileName = `${job.id}.csv`;
  const filePath = path.join(REPORTS_DIR, fileName);
        const out = fs.createWriteStream(filePath, { encoding: 'utf8' });

        if (rows.length > 0) {
          const headers = Object.keys(rows[0]);
          out.write(headers.join(',') + '\n');
          for (const r of rows) {
            const line = headers.map(h => {
              const v = r[h] === null || r[h] === undefined ? '' : String(r[h]);
              // basic sanitization: remove newlines and commas
              return v.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/,/g, ' ');
            }).join(',');
            out.write(line + '\n');
          }
        } else {
          out.write('message\n');
          out.write('no-data\n');
        }

        out.end();
        await new Promise((resolve) => out.on('finish', resolve));

        const downloadUrl = `/uploads/reports/${fileName}`;
        const completedAt = new Date();

        // update DB record
        await prisma.reportJob.update({ where: { id: dbJob.id }, data: { status: 'completed', completedAt, downloadUrl } });

        const completedJob = { ...processingJob, status: 'completed', completedAt: completedAt.toISOString(), downloadUrl };
        reportJobs.set(job.id, completedJob);
      } catch (err) {
        const failedAt = new Date();
        // try update DB
        try {
          await prisma.reportJob.update({ where: { id: dbJob.id }, data: { status: 'failed', error: err.message, completedAt: failedAt } });
        } catch (uerr) {
          console.error('Failed to update DB report job status:', uerr.message);
        }

        const failedJob = { ...reportJobs.get(job.id), status: 'failed', error: err.message, failedAt: failedAt.toISOString() };
        reportJobs.set(job.id, failedJob);
        console.error('Report processing failed for job', job.id, err);
      }
    })();

  } catch (error) {
    console.error('Error queueing report:', error);
    res.status(500).json({ success: false, message: 'Failed to queue report', error: error.message });
  }
};

/**
 * Get report status
 */
const getReportStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' });

    // First try in-memory mirror
    const mem = reportJobs.get(jobId);
    if (mem) return res.json({ success: true, data: mem });

    // If not in memory, try DB (jobId was created with pattern r_<dbId>_<ts>)
    const parts = jobId.split('_');
    const dbIdPart = parts.length >= 2 ? parseInt(parts[1], 10) : null;
    if (!dbIdPart) return res.status(404).json({ success: false, message: 'Report job not found' });

    const job = await prisma.reportJob.findUnique({ where: { id: dbIdPart } });
    if (!job) return res.status(404).json({ success: false, message: 'Report job not found' });

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Error fetching report status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch report status', error: error.message });
  }
};

/**
 * Download generated report file
 */
const downloadReport = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' });
    // Check in-memory first
    let job = reportJobs.get(jobId);
    let dbId = null;
    if (!job) {
      // parse db id from jobId (r_<dbId>_<ts>)
      const parts = jobId.split('_');
      dbId = parts.length >= 2 ? parseInt(parts[1], 10) : null;
      if (!dbId) return res.status(404).json({ success: false, message: 'Report job not found' });

      job = await prisma.reportJob.findUnique({ where: { id: dbId } });
      if (!job) return res.status(404).json({ success: false, message: 'Report job not found' });
    }

    const status = job.status || job.status;
    const downloadUrl = job.downloadUrl || job.downloadUrl;

    if (status !== 'completed' || !downloadUrl) {
      return res.status(400).json({ success: false, message: 'Report not ready for download', job });
    }

    const fileName = path.basename(downloadUrl);
    const filePath = path.join(REPORTS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Report file not found' });
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ success: false, message: 'Failed to download report', error: error.message });
  }
};

/**
 * List recent reports (in-memory)
 */
const getReports = async (req, res) => {
  try {
    // Prefer persisted records so jobs survive restarts
    const dbJobs = await prisma.reportJob.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });

    // Map DB jobs to the API shape, and include the friendly in-memory id if present
    const reports = dbJobs.map((j) => {
      const friendlyId = `r_${j.id}_${new Date(j.createdAt).getTime()}`;
      const mem = reportJobs.get(friendlyId);
      return {
        id: mem ? mem.id : friendlyId,
        dbId: j.id,
        type: j.type,
        format: j.format,
        status: j.status,
        downloadUrl: j.downloadUrl,
        error: j.error,
        meta: j.meta,
        createdAt: j.createdAt,
        startedAt: j.startedAt,
        completedAt: j.completedAt,
      };
    });

    res.json({ success: true, data: { reports } });
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({ success: false, message: 'Failed to list reports', error: error.message });
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCandidates,
  getStatistics,
  getActivityLogs,
  getCertificateRequests,
  getCertificateStats,
  processCertificateRequest,
  getAttendance,
  saveAttendance,
  getAttendanceStatistics,
  sendAttendanceNotifications,
  exportAttendance,
  // Certificate Management
  getCertificates,
  getCertificateById,
  generateCertificate,
  bulkGenerateCertificates,
  downloadCertificate,
  sendCertificate,
  verifyCertificate,
  revokeCertificate,
  reissueCertificate,
  getCertificateStatistics,
  // Certificate Templates
  getCertificateTemplates,
  getCertificateTemplateById,
  createCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate,
  // Company Management
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  // Reports
  getReports,
  // Reports
  generateReport,
  getReportStatus,
  downloadReport,
  getReports,
};
