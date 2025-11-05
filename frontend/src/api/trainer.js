import axios from './axios';

const API_URL = '/trainer';

export const trainerService = {
  // Dashboard
  getDashboard: () => axios.get(`${API_URL}/dashboard`),

  // Courses
  getMyCourses: () => axios.get(`${API_URL}/courses`),
  getCourseDetails: (courseId) => axios.get(`${API_URL}/courses/${courseId}`),
  getCourseStudents: (courseId) => axios.get(`${API_URL}/courses/${courseId}/students`),
  getCourseAttendance: (courseId) => axios.get(`${API_URL}/courses/${courseId}/attendance`),

  // Attendance
  recordAttendance: (data) => axios.post(`${API_URL}/attendance`, data),

  // Assessments
  createAssessment: (data) => axios.post(`${API_URL}/assessments`, data),
  updateAssessment: (id, data) => axios.put(`${API_URL}/assessments/${id}`, data),
};

export default trainerService;
