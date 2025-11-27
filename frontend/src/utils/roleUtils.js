import { jwtDecode } from 'jwt-decode';

/**
 * Role-based utility functions for the Labour Mobility platform
 */

// Define available roles
export const ROLES = {
  ADMIN: 'admin',
  TRAINER: 'trainer',
  CANDIDATE: 'candidate',
  BROKER: 'broker',
  RECRUITER: 'recruiter',
  EMPLOYER: 'employer',
};

// Role hierarchy for permissions
export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 6,
  [ROLES.RECRUITER]: 5,
  [ROLES.EMPLOYER]: 5,
  [ROLES.TRAINER]: 4,
  [ROLES.BROKER]: 3,
  [ROLES.CANDIDATE]: 1,
};

/**
 * Get user role from token or user object
 * @param {string|Object} tokenOrUser - JWT token or user object
 * @returns {string|null} - User role or null
 */
export const getUserRole = (tokenOrUser) => {
  try {
    if (typeof tokenOrUser === 'string') {
      const decoded = jwtDecode(tokenOrUser);
      return decoded.role || null;
    }
    if (tokenOrUser && typeof tokenOrUser === 'object') {
      return tokenOrUser.role || null;
    }
    return null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if user has required role
 * @param {string|Object} tokenOrUser - JWT token or user object
 * @param {string|Array} requiredRoles - Required role(s)
 * @returns {boolean} - Whether user has required role
 */
export const hasRole = (tokenOrUser, requiredRoles) => {
  const userRole = getUserRole(tokenOrUser);
  if (!userRole) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
};

/**
 * Check if user has minimum role level
 * @param {string|Object} tokenOrUser - JWT token or user object
 * @param {string} minimumRole - Minimum required role
 * @returns {boolean} - Whether user meets minimum role level
 */
export const hasMinimumRole = (tokenOrUser, minimumRole) => {
  const userRole = getUserRole(tokenOrUser);
  if (!userRole) return false;
  
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
  
  return userLevel >= requiredLevel;
};

/**
 * Get role display name
 * @param {string} role - Role key
 * @returns {string} - Display name
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.TRAINER]: 'Trainer',
    [ROLES.CANDIDATE]: 'Candidate',
    [ROLES.BROKER]: 'Broker',
    [ROLES.RECRUITER]: 'Recruiter',
    [ROLES.EMPLOYER]: 'Employer',
  };
  
  return roleNames[role] || role;
};

/**
 * Get role color for UI components
 * @param {string} role - Role key
 * @returns {string} - Color code
 */
export const getRoleColor = (role) => {
  const roleColors = {
    [ROLES.ADMIN]: '#f44336', // Red
    [ROLES.TRAINER]: '#2196f3', // Blue
    [ROLES.CANDIDATE]: '#4caf50', // Green
    [ROLES.BROKER]: '#9c27b0', // Purple
    [ROLES.RECRUITER]: '#ff9800', // Orange
    [ROLES.EMPLOYER]: '#00bcd4', // Cyan
  };
  
  return roleColors[role] || '#757575'; // Default gray
};

/**
 * Get navigation items based on user role
 * @param {string} role - User role
 * @returns {Array} - Navigation items
 */
export const getNavigationItems = (role) => {
  const baseItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
  ];
  
  const roleBasedItems = {
    [ROLES.ADMIN]: [
      { label: 'Candidates', path: '/admin/candidates', icon: 'People' },
      { label: 'Courses', path: '/admin/courses', icon: 'School' },
      { label: 'Attendance', path: '/admin/attendance', icon: 'EventNote' },
      { label: 'Appeals', path: '/admin/appeals', icon: 'Gavel' },
      { label: 'Recruiters', path: '/admin/users', icon: 'Business' },
      { label: 'Brokers', path: '/admin/brokers', icon: 'AccountBalance' },
      { label: 'Users', path: '/admin/users', icon: 'ManageAccounts' },
      { label: 'Reports', path: '/admin/reports', icon: 'Assessment' },
    ],
    [ROLES.TRAINER]: [
      { label: 'My Courses', path: '/trainer/courses', icon: 'School' },
      { label: 'Attendance Tracking', path: '/trainer/attendance', icon: 'EventNote' },
      { label: 'Grading Assessments Reports', path: '/trainer/assessments', icon: 'Quiz' },
    ],
    [ROLES.CANDIDATE]: [
      { label: 'My Profile', path: '/candidate/profile', icon: 'Person' },
      { label: 'Documents', path: '/candidate/uploads', icon: 'Upload' },
      { label: 'Status', path: '/candidate/status', icon: 'Timeline' },
    ],
    [ROLES.BROKER]: [
      { label: 'My Candidates', path: '/broker/candidates', icon: 'People' },
      { label: 'Commissions', path: '/broker/commissions', icon: 'AttachMoney' },
    ],
    [ROLES.RECRUITER]: [
      { label: 'My Candidates', path: '/recruiter/candidates', icon: 'People' },
      { label: 'Submissions', path: '/recruiter/submissions', icon: 'Send' },
    ],
    [ROLES.EMPLOYER]: [
      { label: "Dashboard", path: "/employer/dashboard", icon: "Business" },
      { label: "Job Postings", path: "/employer/jobs", icon: "Work" },
      { label: "Candidates", path: "/employer/candidates", icon: "People" },
      { label: "Interviews", path: "/employer/interviews", icon: "VideoCall" },
      { label: "Messages", path: "/employer/messages", icon: "Chat" },
      { label: "Reports", path: "/employer/reports", icon: "Assessment" }
    ]
  };
  
  return [...baseItems, ...(roleBasedItems[role] || [])];
};
