import { createSlice } from '@reduxjs/toolkit';
import { 
  loginUser, 
  registerUser, 
  refreshTokens, 
  logoutUser, 
  getUserProfile, 
  checkAuth 
} from './authThunks';

// Load initial state from localStorage if available
const loadInitialState = () => {
  try {
    const storedAuth = localStorage.getItem('authState');
    if (storedAuth) {
      const parsedAuth = JSON.parse(storedAuth);
      // Only use stored state if it has a valid token
      if (parsedAuth.accessToken) {
        const normalizedUser = parsedAuth.user ? normalizeUser(parsedAuth.user) : null;
        return {
          ...parsedAuth,
          user: normalizedUser,
          isAuthenticated: !!parsedAuth.accessToken || !!normalizedUser,
          status: 'idle',
          error: null
        };
      }
    }
  } catch (error) {
    console.error('Failed to parse stored auth state', error);
    localStorage.removeItem('authState');
  }
  
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    status: 'idle',
    error: null
  };
};

const initialState = loadInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const { accessToken, refreshToken, user } = action.payload;
      if (accessToken !== undefined) {
        state.accessToken = accessToken;
      }
      if (refreshToken !== undefined) {
        state.refreshToken = refreshToken;
      }
      if (user) {
        state.user = normalizeUser(user);
      }
      state.isAuthenticated = !!state.accessToken || !!state.user;
      state.status = 'succeeded';
      state.error = null;
      // Store updated auth state in localStorage
      localStorage.setItem('authState', JSON.stringify({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      // Clear stored auth state on logout
      localStorage.removeItem('authState');
    },
    refreshTokenSuccess: (state, action) => {
      if (action.payload?.accessToken) {
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      }
      if (action.payload?.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      // Store updated auth state in localStorage
      localStorage.setItem('authState', JSON.stringify({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        const { isAuthenticated, accessToken, refreshToken, user } = action.payload;
        state.status = 'succeeded';
        state.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
          state.user = user;
        } else {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
        }
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to check authentication status';
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('Login fulfilled:', action.payload);
        state.status = 'succeeded';
        
        // Extract user and tokens from the payload
        const { user, accessToken, refreshToken } = action.payload || {};
        
        // Update state with the received data
        if (user) {
          state.user = normalizeUser(user);
        }
        if (accessToken) {
          state.accessToken = accessToken;
        }
        if (refreshToken) {
          state.refreshToken = refreshToken;
        }
        
        // Set authentication state
        state.isAuthenticated = true;
        state.error = null;
        
        console.log('Updated auth state:', {
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          hasToken: !!state.accessToken
        });
        // Store updated auth state in localStorage
        localStorage.setItem('authState', JSON.stringify({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }));
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.error('Login rejected:', action.payload || action.error);
        state.status = 'failed';
        state.error = action.payload || 'Login failed. Please try again.';
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const payload = extractAuthPayload(action.payload);
        state.user = payload.user ? normalizeUser(payload.user) : state.user;
        state.accessToken = payload.accessToken ?? state.accessToken;
        state.refreshToken = payload.refreshToken ?? state.refreshToken;
        state.isAuthenticated = !!state.accessToken || !!state.user;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.status = 'idle';
        state.error = null;
        state.isAuthenticated = false;
      })
      // Get Profile
      .addCase(getUserProfile.fulfilled, (state, action) => {
        const user = action.payload?.data?.user || action.payload?.user || action.payload;
        if (user) {
          state.user = normalizeUser(user);
        }
        state.isAuthenticated = true;
      });
  },
});

export const {
  setAuth,
  logout,
  refreshTokenSuccess,
  clearError,
} = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;

function extractAuthPayload(payload) {
  if (!payload) return {};
  if (payload.data) {
    return {
      user: payload.data.user,
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken,
    };
  }
  return payload;
}

function normalizeUser(user) {
  if (!user) return user;
  const normalizeRoleName = (value) => {
    if (!value || typeof value !== 'string') return value;
    const lower = value.toLowerCase();
    return lower === 'agent' ? 'recruiter' : lower;
  };
  if (user.role && typeof user.role === 'object') {
    const roleName = user.role.name || user.role;
    return {
      ...user,
      role: typeof roleName === 'string' ? normalizeRoleName(roleName) : roleName,
    };
  }
  if (typeof user.role === 'string') {
    return {
      ...user,
      role: normalizeRoleName(user.role),
    };
  }
  return user;
}
