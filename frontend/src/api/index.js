/**
 * API Service Layer
 * Provides a consistent interface for data fetching
 * Switches between demo data and real API calls based on environment
 */

import axios from 'axios';
import { mockApiResponses } from '../seed/demoData';

// API Configuration
// Ensure the default points to the backend dev server + `/api` prefix
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authStorage = localStorage.getItem('authState');
    if (authStorage) {
      const authState = JSON.parse(authStorage);
      if (authState?.accessToken) {
        config.headers.Authorization = `Bearer ${authState.accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authStorage = localStorage.getItem('authState');
        if (authStorage) {
          const authState = JSON.parse(authStorage);
          if (authState?.refreshToken) {
            const response = await api.post('/auth/refresh', {
              refreshToken: authState.refreshToken,
            });

            const { accessToken } = response.data;

            // Update stored token
            const updatedAuth = {
              ...authState,
              accessToken
            };
            localStorage.setItem('authState', JSON.stringify(updatedAuth));

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('authState');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Demo data delay simulation
const simulateDelay = (ms = 500) =>
  new Promise(resolve => setTimeout(resolve, ms));

// API Service Class
class ApiService {
  // Authentication
  async login(credentials) {
    if (DEMO_MODE) {
      await simulateDelay();
      try {
        return mockApiResponses.login(credentials);
      } catch (error) {
        throw new Error(error.message);
      }
    }

    const response = await api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData) {
    if (DEMO_MODE) {
      await simulateDelay();
      return {
        success: true,
        message: 'Registration successful',
        data: { id: Date.now(), ...userData }
      };
    }

    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  async logout(refreshToken) {
    if (DEMO_MODE) {
      await simulateDelay(200);
      return { success: true };
    }

    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  }

  async refreshToken(refreshToken) {
    if (DEMO_MODE) {
      await simulateDelay(200);
      return {
        success: true,
        data: { accessToken: `demo-token-${Date.now()}` }
      };
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  async getProfile() {
    if (DEMO_MODE) {
      await simulateDelay();
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state?.user) {
          return { success: true, data: state.user };
        }
      }
      throw new Error('No user found');
    }

    const response = await api.get('/auth/profile');
    return response.data;
  }

  // Dashboard Data
  async getDashboardData(role) {
    if (DEMO_MODE) {
      await simulateDelay();
      return mockApiResponses.getDashboard(role);
    }

    const response = await api.get(`/dashboard/${role}`);
    return response.data;
  }

  // Candidates
  async getCandidates(params = {}) {
    if (DEMO_MODE) {
      await simulateDelay();
      return mockApiResponses.getCandidates(params);
    }

    const response = await api.get('/candidates', { params });
    return response.data;
  }

  async getCandidate(id) {
    if (DEMO_MODE) {
      await simulateDelay();
      const candidates = mockApiResponses.getCandidates().candidates;
      const candidate = candidates.find(c => c.id === parseInt(id));
      if (!candidate) throw new Error('Candidate not found');
      return { success: true, data: candidate };
    }

    const response = await api.get(`/candidates/${id}`);
    return response.data;
  }

  async createCandidate(data) {
    if (DEMO_MODE) {
      await simulateDelay();
      return {
        success: true,
        data: { id: Date.now(), ...data, createdAt: new Date().toISOString() }
      };
    }

    const response = await api.post('/candidates', data);
    return response.data;
  }

  async updateCandidate(id, data) {
    if (DEMO_MODE) {
      await simulateDelay();
      return {
        success: true,
        data: { id, ...data, updatedAt: new Date().toISOString() }
      };
    }

    const response = await api.put(`/candidates/${id}`, data);
    return response.data;
  }

  // Courses
  async getCourses(params = {}) {
    if (DEMO_MODE) {
      await simulateDelay();
      return mockApiResponses.getCourses(params);
    }

    const response = await api.get('/courses', { params });
    return response.data;
  }

  async getCourse(id) {
    if (DEMO_MODE) {
      await simulateDelay();
      const courses = mockApiResponses.getCourses().courses;
      const course = courses.find(c => c.id === parseInt(id));
      if (!course) throw new Error('Course not found');
      return { success: true, data: course };
    }

    const response = await api.get(`/courses/${id}`);
    return response.data;
  }

  // Employers
  async getEmployers(params = {}) {
    if (DEMO_MODE) {
      await simulateDelay();
      return mockApiResponses.getEmployers(params);
    }

    const response = await api.get('/employers', { params });
    return response.data;
  }

  // Job Postings
  async getJobPostings(params = {}) {
    if (DEMO_MODE) {
      await simulateDelay();
      return mockApiResponses.getJobPostings(params);
    }

    const response = await api.get('/jobs', { params });
    return response.data;
  }

  async createJobPosting(data) {
    if (DEMO_MODE) {
      await simulateDelay();
      return {
        success: true,
        data: { id: Date.now(), ...data, createdAt: new Date().toISOString() }
      };
    }

    const response = await api.post('/jobs', data);
    return response.data;
  }

  // Notifications
  async getNotifications(userId) {
    if (DEMO_MODE) {
      await simulateDelay();
      return mockApiResponses.getNotifications(userId);
    }

    const response = await api.get('/notifications');
    return response.data;
  }

  async markNotificationRead(id) {
    if (DEMO_MODE) {
      await simulateDelay(200);
      return { success: true };
    }

    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  }

  // Attendance
  async getAttendance(params = {}) {
    if (DEMO_MODE) {
      await simulateDelay();
      return mockApiResponses.getAttendance(params);
    }

    const response = await api.get('/attendance', { params });
    return response.data;
  }

  // Assessments
  async getAssessments(params = {}) {
    if (DEMO_MODE) {
      await simulateDelay();
      return mockApiResponses.getAssessments(params);
    }

    const response = await api.get('/assessments', { params });
    return response.data;
  }

  // File Upload
  async uploadFile(file, type = 'document') {
    if (DEMO_MODE) {
      await simulateDelay(1000);
      return {
        success: true,
        data: {
          id: Date.now(),
          filename: file.name,
          url: URL.createObjectURL(file),
          type,
          uploadedAt: new Date().toISOString()
        }
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Reports
  async generateReport(type, params = {}) {
    if (DEMO_MODE) {
      await simulateDelay(2000);
      return {
        success: true,
        data: {
          reportId: Date.now(),
          type,
          generatedAt: new Date().toISOString(),
          downloadUrl: '#'
        }
      };
    }

    const response = await api.post('/reports/generate', { type, ...params });
    return response.data;
  }

  // System Health (Admin only)
  async getSystemHealth() {
    if (DEMO_MODE) {
      await simulateDelay();
      return {
        success: true,
        data: {
          uptime: '99.9%',
          responseTime: '142ms',
          activeUsers: 1847,
          serverLoad: 78,
          memoryUsage: 65,
          diskUsage: 45,
          apiCalls: 125000,
          errorRate: 0.1,
        }
      };
    }

    const response = await api.get('/admin/system-health');
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export individual auth methods for convenience
export const authAPI = {
  login: (credentials) => apiService.login(credentials),
  register: (userData) => apiService.register(userData),
  logout: (refreshToken) => apiService.logout(refreshToken),
  refreshToken: (refreshToken) => apiService.refreshToken(refreshToken),
  getProfile: () => apiService.getProfile(),
};

// Export recruiter API methods
export const recruiterAPI = {
  // Dashboard
  getDashboard: () => api.get('/recruiter/dashboard'),
  
  // Pipeline management
  getPipelineCandidates: () => api.get('/recruiter/pipeline/candidates'),
  getCandidateEvents: (candidateId) => api.get(`/recruiter/pipeline/${candidateId}/events`),
  transitionCandidate: (candidateId, data) => api.post(`/recruiter/pipeline/${candidateId}/transition`, data),
  
  // Job openings
  createJobOpening: (data) => api.post('/recruiter/jobs', data),
  getJobOpenings: () => api.get('/recruiter/jobs'),
};

// Export admin API methods
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Companies
  getCompanies: () => api.get('/admin/companies'),
  getCompanyById: (id) => api.get(`/admin/companies/${id}`),
  createCompany: (data) => api.post('/admin/companies', data),
  updateCompany: (id, data) => api.put(`/admin/companies/${id}`, data),
  deleteCompany: (id) => api.delete(`/admin/companies/${id}`),
  
  // Placements
  getPlacements: () => api.get('/admin/placements'),
  getPlacementById: (id) => api.get(`/admin/placements/${id}`),
  createPlacement: (data) => api.post('/admin/placements', data),
  updatePlacement: (id, data) => api.put(`/admin/placements/${id}`, data),
  deletePlacement: (id) => api.delete(`/admin/placements/${id}`),
  
  // Candidates
  getCandidates: () => api.get('/admin/candidates'),
  
  // Reports
  getStatistics: () => api.get('/admin/statistics'),
  generateReport: (data) => api.post('/admin/reports/generate', data),
  getReports: () => api.get('/admin/reports'),
};

// Export axios instance for custom requests
export { api };

// Export demo mode flag
export { DEMO_MODE };

export default apiService;
