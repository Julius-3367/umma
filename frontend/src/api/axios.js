import axios from 'axios';

const DEFAULT_API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

console.log('🔧 Axios configuration:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  DEFAULT_API_BASE
});

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: DEFAULT_API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds
});

// Store reference for Redux store access
let store;

// Helper function to get auth tokens
const getTokens = () => ({
  accessToken: store?.getState?.()?.auth?.accessToken || localStorage.getItem('accessToken'),
  refreshToken: store?.getState?.()?.auth?.refreshToken || localStorage.getItem('refreshToken')
});

// Helper function to make URL
const makeUrl = (endpoint) => {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${DEFAULT_API_BASE}${normalized}`;
};

/**
 * Sets up axios interceptors with the Redux store
 * @param {Object} reduxStore - Redux store
 */
export const setupAxiosInterceptors = (reduxStore) => {
  store = reduxStore;

  // Clear any existing interceptors
  axiosInstance.interceptors.request.handlers = [];
  axiosInstance.interceptors.response.handlers = [];

  // Setup request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      console.log('📤 Axios request:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`
      });
      
      const { accessToken } = getTokens();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log('🔑 Added auth token to request');
      } else {
        console.log('⚠️ No access token available');
      }

      // If the data is FormData, delete Content-Type to let browser set it with boundary
      if (config.data instanceof FormData) {
        console.log('🔧 Axios interceptor: Detected FormData, removing Content-Type');
        delete config.headers['Content-Type'];
      } else {
        console.log('🔧 Axios interceptor: Not FormData, type:', typeof config.data, config.data);
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Setup response interceptor for token refresh
  axiosInstance.interceptors.response.use(
    (response) => {
      console.log('📥 Axios response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
      return response;
    },
    async (error) => {
      console.error('❌ Axios error:', {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
        fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        responseData: error.response?.data
      });
      
      const originalRequest = error.config;

      // If error is 401 and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const { refreshToken } = getTokens();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const refreshUrl = makeUrl(import.meta.env.VITE_AUTH_REFRESH_ENDPOINT || '/auth/refresh');
          const response = await axios.post(refreshUrl, { refreshToken });

          // Extract from nested data structure: { success, data: { accessToken, expiresIn } }
          const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;

          if (!newAccessToken) {
            throw new Error('No access token in refresh response');
          }

          // Update store with new tokens
          store.dispatch({
            type: 'auth/refreshTokenSuccess',
            payload: { accessToken: newAccessToken, refreshToken }
          });

          // Update the auth header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);

        } catch (error) {
          console.error('Token refresh failed:', error);
          // If refresh fails, clear auth state
          store.dispatch({ type: 'auth/logout' });
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );
};

export default axiosInstance;
