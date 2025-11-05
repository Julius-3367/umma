import api from './axios';

// Helper to unwrap API payloads consistently
const unwrap = (res) => res?.data?.data ?? res?.data ?? res;

export const candidateService = {
  // Get dashboard data
  async getDashboardData() {
    const res = await api.get('/candidate/dashboard');
    return unwrap(res);
  },

  // Get all enrolled courses
  async getMyCourses() {
    const res = await api.get('/candidate/courses');
    return unwrap(res);
  },

  // Get course details
  async getCourseDetails(courseId) {
    const res = await api.get(`/candidate/courses/${courseId}`);
    return unwrap(res);
  },

  // Get recommended jobs
  async getRecommendedJobs() {
    const res = await api.get('/candidate/jobs/recommended');
    return unwrap(res);
  },

  // Apply for a job
  async applyForJob(jobId, applicationData) {
    const res = await api.post(`/candidate/jobs/${jobId}/apply`, applicationData);
    return unwrap(res);
  },

  // Get notifications
  async getNotifications() {
    const res = await api.get('/candidate/notifications');
    return unwrap(res);
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    const res = await api.patch(`/candidate/notifications/${notificationId}/read`);
    return unwrap(res);
  },

  // Get candidate profile
  async getProfile() {
    const res = await api.get('/candidate/profile');
    return unwrap(res);
  },
};

export default candidateService;
