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

  // Update candidate profile
  async updateProfile(profileData) {
    const res = await api.patch('/candidate/profile', profileData);
    return unwrap(res);
  },

  // Get candidate documents
  async getDocuments() {
    const res = await api.get('/candidate/documents');
    return unwrap(res);
  },

  // Upload document
  async uploadDocument(formData) {
    // Use native fetch for file uploads to avoid axios transforming FormData
    const token = localStorage.getItem('accessToken');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const response = await fetch(`${baseURL}/candidate/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();
    return unwrap(result);
  },

  // Delete document
  async deleteDocument(documentId) {
    const res = await api.delete(`/candidate/documents/${documentId}`);
    return unwrap(res);
  },

  // Get attendance records
  async getAttendance(courseId) {
    const res = await api.get('/candidate/attendance', { params: { courseId } });
    return unwrap(res);
  },

  // Get assessments
  async getAssessments(courseId) {
    const res = await api.get('/candidate/assessments', { params: { courseId } });
    return unwrap(res);
  },

  // Get certificates
  async getCertificates() {
    const res = await api.get('/candidate/certificates');
    return unwrap(res);
  },

  // Get available courses for enrollment
  async getAvailableCourses() {
    const res = await api.get('/candidate/courses/available');
    return unwrap(res);
  },

  // Enroll in course
  async enrollInCourse(courseId) {
    const res = await api.post('/candidate/enrollments', { courseId });
    return unwrap(res);
  },

  // NEW COMPREHENSIVE ENDPOINTS

  // Get detailed attendance records with stats
  async getAttendanceRecords(month, year) {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await api.get('/candidate/attendance/records', { params });
    return unwrap(res);
  },

  // Get comprehensive assessment results
  async getAssessmentResults() {
    const res = await api.get('/candidate/assessments/results');
    return unwrap(res);
  },

  // Get certificates and documents
  async getCertificatesAndDocuments() {
    const res = await api.get('/candidate/certificates-documents');
    return unwrap(res);
  },

  // Get placement and job application data
  async getPlacementData() {
    const res = await api.get('/candidate/placement');
    return unwrap(res);
  },

  // COHORT ENDPOINTS

  // Get available cohorts for enrollment
  async getAvailableCohorts() {
    const res = await api.get('/candidate/cohorts/available');
    return unwrap(res);
  },

  // Get my cohorts
  async getMyCohorts() {
    const res = await api.get('/candidate/cohorts');
    return unwrap(res);
  },

  // Apply for a cohort
  async applyForCohort(cohortId) {
    const res = await api.post(`/candidate/cohorts/${cohortId}/apply`);
    return unwrap(res);
  },

  // VETTING ENDPOINTS

  // Get vetting status
  async getVettingStatus() {
    const res = await api.get('/candidate/vetting');
    return unwrap(res);
  },

  // Apply for vetting (creates vetting record)
  async applyForVetting(enrollmentId, vettingData) {
    const res = await api.post('/candidate/vetting/apply', {
      enrollmentId,
      ...vettingData,
    });
    return unwrap(res);
  },

  // Update vetting documents
  async updateVettingDocuments(vettingId, formData) {
    const token = localStorage.getItem('accessToken');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const response = await fetch(`${baseURL}/candidate/vetting/${vettingId}/documents`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Document upload failed');
    }

    const result = await response.json();
    return unwrap(result);
  },
};

export default candidateService;
