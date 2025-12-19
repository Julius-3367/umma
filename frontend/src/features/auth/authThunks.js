import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from './authService';
import { setAuth, logout as logoutAction } from './authSlice';

/**
 * Async thunk for user login
 */
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      // Clear any existing auth data before login
      console.log('🧹 Clearing existing auth data before login...');
      localStorage.removeItem('authState');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      const response = await authService.login(credentials);
      
      console.log('✅ Login response received:', {
        hasUser: !!response.user,
        hasAccessToken: !!response.accessToken,
        userEmail: response.user?.email,
        userId: response.user?.id,
        userName: `${response.user?.firstName} ${response.user?.lastName}`
      });
      
      // Store tokens in localStorage
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
      }
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      // Fetch user profile if not included in the response
      if (!response.user && response.accessToken) {
        try {
          const profile = await authService.getProfile();
          response.user = profile;
        } catch (profileError) {
          console.error('Failed to fetch user profile:', profileError);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login error in thunk:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Login failed'
      );
    }
  }
);

/**
 * Async thunk for user registration
 */
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      // Clear any existing auth data before registration
      console.log('🧹 Clearing existing auth data before registration...');
      localStorage.removeItem('authState');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      const response = await authService.register(userData);
      
      console.log('✅ Registration response received:', {
        hasUser: !!response.user,
        hasAccessToken: !!response.accessToken,
        userEmail: response.user?.email,
        userId: response.user?.id,
        userName: `${response.user?.firstName} ${response.user?.lastName}`
      });
      
      // Automatically log in after successful registration if tokens are provided
      if (response.accessToken) {
        dispatch(setAuth({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user
        }));
      }
      
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

/**
 * Async thunk for refreshing tokens
 */
export const refreshTokens = createAsyncThunk(
  'auth/refreshTokens',
  async (refreshToken, { rejectWithValue, dispatch }) => {
    try {
      const response = await authService.refreshToken(refreshToken);
      dispatch({ type: 'auth/refreshTokenSuccess', payload: response });
      return response;
    } catch (error) {
      dispatch({ type: 'auth/logout' });
      return rejectWithValue('Session expired. Please login again.');
    }
  }
);

/**
 * Async thunk for user logout
 */
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch }) => {
    try {
      await authService.logout();
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.warn('Logout request failed:', error);
    }

    dispatch({ type: 'auth/logout' });
  }
);

/**
 * Async thunk for getting user profile
 */
export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch profile'
      );
    }
  }
);

/**
 * Async thunk to check authentication status
 */
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const { refreshToken } = getState().auth;
      
      if (!refreshToken) {
        return { isAuthenticated: false };
      }
      
      try {
        // Try to refresh the token
        const { accessToken } = await authService.refreshToken(refreshToken);
        
        if (accessToken) {
          // Get the user profile with the new access token
          const user = await authService.getProfile();
          return { 
            isAuthenticated: true, 
            accessToken, 
            refreshToken,
            user 
          };
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, clear the auth state
        dispatch(logoutAction());
        return { isAuthenticated: false };
      }
      
      return { isAuthenticated: false };
    } catch (error) {
      console.error('Auth check failed:', error);
      return rejectWithValue('Failed to check authentication status');
    }
  }
);
