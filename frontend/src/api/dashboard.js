import api from './axios';

/**
 * Unified Dashboard Service
 * Provides dashboard data fetching for all user roles
 * Each role gets filtered data based on their permissions
 */

// Helper to unwrap API responses
const unwrap = (res) => res?.data?.data ?? res?.data ?? res;

/**
 * Admin Dashboard
 */
export const adminDashboard = {
  async getDashboard() {
    const res = await api.get('/admin/dashboard');
    return unwrap(res);
  },

  async getStats(period = 'month') {
    const res = await api.get('/admin/dashboard/stats', { params: { period } });
    return unwrap(res);
  },

  async getRecentActivity(limit = 10) {
    const res = await api.get('/admin/dashboard/activity', { params: { limit } });
    return unwrap(res);
  },
};

/**
 * Candidate Dashboard
 */
export const candidateDashboard = {
  async getDashboard() {
    const res = await api.get('/candidate/dashboard');
    return unwrap(res);
  },

  async getMyCourses() {
    const res = await api.get('/candidate/courses');
    return unwrap(res);
  },

  async getUpcomingEvents() {
    const res = await api.get('/candidate/events/upcoming');
    return unwrap(res);
  },
};

/**
 * Trainer Dashboard
 */
export const trainerDashboard = {
  async getDashboard() {
    const res = await api.get('/trainer/dashboard');
    return unwrap(res);
  },

  async getMyCourses() {
    const res = await api.get('/trainer/courses');
    return unwrap(res);
  },

  async getMyStudents() {
    const res = await api.get('/trainer/students');
    return unwrap(res);
  },

  async getUpcomingClasses() {
    const res = await api.get('/trainer/classes/upcoming');
    return unwrap(res);
  },
};

/**
 * Employer Dashboard
 */
export const employerDashboard = {
  async getDashboard() {
    const res = await api.get('/employer/dashboard');
    return unwrap(res);
  },

  async getJobPostings() {
    const res = await api.get('/employer/jobs');
    return unwrap(res);
  },

  async getApplications() {
    const res = await api.get('/employer/applications');
    return unwrap(res);
  },

  async getCandidateMatches() {
    const res = await api.get('/employer/candidates/matches');
    return unwrap(res);
  },
};

/**
 * Broker Dashboard
 */
export const brokerDashboard = {
  async getDashboard() {
    const res = await api.get('/broker/dashboard');
    return unwrap(res);
  },

  async getActivePlacements() {
    const res = await api.get('/broker/placements/active');
    return unwrap(res);
  },

  async getClients() {
    const res = await api.get('/broker/clients');
    return unwrap(res);
  },
};

/**
 * Recruiter Dashboard
 */
export const recruiterDashboard = {
  async getDashboard() {
    const res = await api.get('/recruiter/dashboard');
    return unwrap(res);
  },

  async getMyCandidates() {
    const res = await api.get('/recruiter/candidates');
    return unwrap(res);
  },

  async getPlacements() {
    const res = await api.get('/recruiter/placements');
    return unwrap(res);
  },
};

/**
 * Get dashboard service by role
 */
export const getDashboardService = (role) => {
  const services = {
    admin: adminDashboard,
    candidate: candidateDashboard,
    trainer: trainerDashboard,
    employer: employerDashboard,
    broker: brokerDashboard,
    recruiter: recruiterDashboard,
    agent: recruiterDashboard,
  };

  return services[role?.toLowerCase()] || null;
};

export default {
  admin: adminDashboard,
  candidate: candidateDashboard,
  trainer: trainerDashboard,
  employer: employerDashboard,
  broker: brokerDashboard,
  recruiter: recruiterDashboard,
  agent: recruiterDashboard,
  getDashboardService,
};
