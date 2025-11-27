const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateTokenPair, verifyRefreshToken } = require('../config/jwt');
const { createActivityLog } = require('../services/activityLogService');

/**
 * User registration
 */
const register = async (req, res) => {
  try {
    console.log('Registration attempt with data:', req.body); // Log incoming data
    
    const { email, password, firstName, lastName, phone, roleId, role: roleName } = req.body;
    console.log('Extracted roleName:', roleName, 'roleId:', roleId);

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        required: ['email', 'password', 'firstName', 'lastName'],
        received: { email: !!email, password: !!password, firstName: !!firstName, lastName: !!lastName }
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Find role by roleId, roleName, or default to Candidate
    let role;
    
    if (roleId) {
      // If roleId is provided, try to find it
      role = await prisma.role.findUnique({
        where: { id: roleId }
      });
    } else if (roleName) {
      // If role name is provided, find by name
      role = await prisma.role.findFirst({
        where: { name: roleName }
      });
    } else {
      // Default to Candidate role by name (use findFirst since name is not unique by itself)
      role = await prisma.role.findFirst({
        where: { name: 'Candidate' }
      });
    }

    if (!role) {
      console.log('Invalid role or role not found:', roleId || roleName || 'Candidate');
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified or Candidate role not found in database. Please run database seed.'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        roleId: role.id
      },
      include: {
        role: true
      }
    });

    // Check if auto-login is enabled
    const autoLoginEnabled = process.env.AUTH_AUTO_LOGIN_AFTER_REGISTER === 'true';

    if (autoLoginEnabled) {
      // Generate tokens
      const tokens = generateTokenPair(user);

      // Create session for refresh token
      await prisma.session.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Log activity
      await createActivityLog({
        userId: user.id,
        action: 'USER_REGISTERED',
        resource: 'User',
        details: { email, role: role.name }
      });

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        success: true,
        message: 'User registered successfully and logged in',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: role.name
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: role.name
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * User login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with role
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Create session for refresh token
    await prisma.session.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Log activity
    await createActivityLog({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'Auth',
      details: { email },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if session exists and is valid
    const session = await prisma.session.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.id,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: { role: true }
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    if (session.user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Generate new access token
    const tokens = generateTokenPair(session.user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      // Delete the session
      await prisma.session.deleteMany({
        where: { token: refreshToken }
      });
    }

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Log activity
    if (req.user) {
      await createActivityLog({
        userId: req.user.id,
        action: 'USER_LOGOUT',
        resource: 'Auth',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { 
        role: true,
        candidate: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
            gender: true,
            dob: true,
            county: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update profile basics
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone } = req.body;

    const data = {};
    if (typeof firstName !== 'undefined') data.firstName = firstName;
    if (typeof lastName !== 'undefined') data.lastName = lastName;
    if (typeof phone !== 'undefined') data.phone = phone;

    if (!Object.keys(data).length) {
      return res.status(400).json({
        success: false,
        message: 'No profile fields provided',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      include: { role: true },
    });

    await createActivityLog({
      userId,
      action: 'PROFILE_UPDATED',
      resource: 'User',
      details: { updatedFields: Object.keys(data) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    // Log activity
    await createActivityLog({
      userId,
      action: 'PASSWORD_CHANGED',
      resource: 'User',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current user profile from JWT
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  getCurrentUser,
  changePassword
};
