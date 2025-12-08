import axios from './axios';

const API_URL = '/admin';

export const adminService = {
  // Dashboard
  getDashboard: () => axios.get(`${API_URL}/dashboard`),

  // User Management
  getAllUsers: (params) => axios.get(`${API_URL}/users`, { params }),
  getUserById: (id) => axios.get(`${API_URL}/users/${id}`),
  createUser: (data) => axios.post(`${API_URL}/users`, data),
  updateUser: (id, data) => axios.put(`${API_URL}/users/${id}`, data),
  deleteUser: (id) => axios.delete(`${API_URL}/users/${id}`),

  // Course Management
  getAllCourses: (params) => axios.get(`${API_URL}/courses`, { params }),
  getCourseById: (id) => axios.get(`${API_URL}/courses/${id}`),
  createCourse: (data) => axios.post(`${API_URL}/courses`, data),
  updateCourse: (id, data) => axios.put(`${API_URL}/courses/${id}`, data),
  deleteCourse: (id) => axios.delete(`${API_URL}/courses/${id}`),

  // Company Management
  getAllCompanies: (params) => axios.get(`${API_URL}/companies`, { params }),
  getCompanyById: (id) => axios.get(`${API_URL}/companies/${id}`),
  createCompany: (data) => axios.post(`${API_URL}/companies`, data),
  updateCompany: (id, data) => axios.put(`${API_URL}/companies/${id}`, data),
  deleteCompany: (id) => axios.delete(`${API_URL}/companies/${id}`),

  // Candidate Management
  getAllCandidates: (params) => axios.get(`${API_URL}/candidates`, { params }),

  // Enrollment Management
  getEnrollments: (status) => axios.get(`${API_URL}/enrollments`, { params: { status } }),
  updateEnrollmentStatus: (id, data) => axios.put(`${API_URL}/enrollments/${id}`, data),

  // Statistics
  getStatistics: (params) => axios.get(`${API_URL}/statistics`, { params }),
  getActivityLogs: (params) => axios.get(`${API_URL}/activity-logs`, { params }),

  // Certificate Management
  getCertificateRequests: (params) => axios.get(`${API_URL}/certificate-requests`, { params }),
  getCertificateStats: () => axios.get(`${API_URL}/certificate-stats`),
  processCertificateRequest: (id, data) => axios.put(`${API_URL}/certificate-requests/${id}`, data),

  // Attendance Management
  getAttendance: (courseId, date) => axios.get(`${API_URL}/attendance`, {
    params: { courseId, date }
  }),
  saveAttendance: (data) => axios.post(`${API_URL}/attendance`, data),
  getAttendanceStatistics: (courseId, startDate, endDate) => axios.get(`${API_URL}/attendance/statistics`, {
    params: { courseId, startDate, endDate }
  }),
  sendAttendanceNotifications: (data) => axios.post(`${API_URL}/attendance/notifications`, data),
  exportAttendance: (params) => axios.get(`${API_URL}/attendance/export`, {
    params,
    responseType: 'blob',
  }),

  // Certificate Management System
  getCertificates: (params) => axios.get(`${API_URL}/certificates`, { params }),
  getCertificateById: (id) => axios.get(`${API_URL}/certificates/${id}`),
  generateCertificate: (data) => axios.post(`${API_URL}/certificates/generate`, data),
  bulkGenerateCertificates: (data) => axios.post(`${API_URL}/certificates/bulk-generate`, data),
  updateCertificate: (id, data) => axios.put(`${API_URL}/certificates/${id}`, data),
  downloadCertificate: (id) => axios.get(`${API_URL}/certificates/${id}/download`, {
    responseType: 'blob',
  }),
  previewCertificate: (id, data) => axios.post(`${API_URL}/certificates/${id}/preview`, data, {
    responseType: 'blob',
  }),
  sendCertificate: (id, email) => axios.post(`${API_URL}/certificates/${id}/send`, { email }),
  verifyCertificate: (certificateNumber) => axios.post(`${API_URL}/certificates/verify`, { certificateNumber }),
  revokeCertificate: (id, reason) => axios.put(`${API_URL}/certificates/${id}/revoke`, { reason }),
  reissueCertificate: (id) => axios.post(`${API_URL}/certificates/${id}/reissue`),
  getCertificateStatistics: () => axios.get(`${API_URL}/certificates/statistics`),

  // Certificate Templates
  getCertificateTemplates: () => axios.get(`${API_URL}/certificate-templates`),
  getCertificateTemplateById: (id) => axios.get(`${API_URL}/certificate-templates/${id}`),
  createCertificateTemplate: (data) => axios.post(`${API_URL}/certificate-templates`, data),
  updateCertificateTemplate: (id, data) => axios.put(`${API_URL}/certificate-templates/${id}`, data),
  deleteCertificateTemplate: (id) => axios.delete(`${API_URL}/certificate-templates/${id}`),

  // Notifications
  getNotifications: (params) => axios.get(`${API_URL}/notifications`, { params }),
  markNotificationAsRead: (id) => axios.patch(`${API_URL}/notifications/${id}/read`),
  markAllNotificationsAsRead: () => axios.patch(`${API_URL}/notifications/mark-all-read`),
  deleteNotification: (id) => axios.delete(`${API_URL}/notifications/${id}`),

  // Vetting
  getVettingDashboard: (params) => axios.get(`${API_URL}/vetting/dashboard`, { params }),
  updateVettingRecord: (id, data) => axios.put(`${API_URL}/vetting/${id}`, data),

  // Reports
  generateReport: (data) => axios.post(`${API_URL}/reports/generate`, data),
  getReportStatus: (jobId) => axios.get(`${API_URL}/reports/status/${jobId}`),
  downloadReport: (jobId) => axios.get(`${API_URL}/reports/download/${jobId}`, {
    responseType: 'blob',
  }),
  getReports: (params) => axios.get(`${API_URL}/reports`, { params }),
};

export default adminService;
