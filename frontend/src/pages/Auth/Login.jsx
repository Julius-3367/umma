import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  Divider,
  Grow,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Business as BusinessIcon,
  Google as GoogleIcon,
} from '@mui/icons-material';
import { loginUser } from '../../features/auth/authThunks';

/**
 * Login page component
 * Handles user authentication with email/password
 */
const Login = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { status, error, isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [googleOAuthEnabled, setGoogleOAuthEnabled] = useState(true);

  const handleGoogleSignIn = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 503) {
        // Google OAuth not configured
        setGoogleOAuthEnabled(false);
        return;
      }

      if (response.ok) {
        window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
      } else {
        throw new Error('Failed to initiate Google OAuth');
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      setGoogleOAuthEnabled(false);
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      try {
        console.log('User authenticated, redirecting...', { user, role: user.role });
        // Map role to correct path
        const rolePathMap = {
          admin: '/admin/dashboard',
          candidate: '/candidate/dashboard',
          trainer: '/trainer/dashboard',
          recruiter: '/recruiter/dashboard',
          broker: '/broker/dashboard',
          employer: '/recruiter/dashboard',
        };
        const rolePath = rolePathMap[user.role?.toLowerCase()] || '/candidate/dashboard';
        const from = location.state?.from?.pathname || rolePath;
        console.log('Navigating to:', from);
        navigate(from, { replace: true });
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback navigation
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(''); // Clear previous errors
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const resultAction = await dispatch(loginUser(formData));
      
      if (loginUser.fulfilled.match(resultAction)) {
        // Success - navigation handled by useEffect
        return;
      } else if (loginUser.rejected.match(resultAction)) {
        // Handle specific error messages from the backend
        const errorPayload = resultAction.payload || {};
        if (errorPayload.message) {
          setServerError(errorPayload.message);
        } else if (errorPayload.error) {
          setServerError(errorPayload.error);
        } else {
          setServerError('Login failed. Please check your credentials and try again.');
        }
        
        // Log detailed error for debugging
        console.error('Login error:', {
          status: errorPayload.status,
          message: errorPayload.message,
          data: errorPayload.data
        });
      }
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setServerError('An unexpected error occurred. Please try again later.');
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#ffffff',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(120, 190, 33, 0.05) 0%, transparent 50%)',
        p: 2,
      }}
    >
      <Grow in timeout={600}>
        <Card
          sx={{
            maxWidth: 420,
            width: '100%',
            boxShadow: theme.shadows[8],
            borderRadius: 3,
            bgcolor: 'background.paper',
          }}
        >
          <CardContent
            sx={{
              p: { xs: 3, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <BusinessIcon
              sx={{
                fontSize: 48,
                color: 'primary.main',
                mb: 2,
              }}
            />
            <Typography
              variant="subtitle1"
              component="div"
              sx={{
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'primary.main',
                textTransform: 'uppercase',
              }}
            >
              UMSL Platform
            </Typography>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                mt: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 320, mx: 'auto' }}
            >
              Sign in to continue to UMSL Platform.
            </Typography>
          </Box>

          {/* Demo Mode Notice */}
          {isDemoMode && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Demo Mode:</strong> Use any email/password to login
              </Typography>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              disabled={status === 'loading'}
              aria-label="email address"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
              inputProps={{ 'aria-required': 'true' }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              disabled={status === 'loading'}
              aria-label="password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              inputProps={{ 'aria-required': 'true', minLength: 6 }}
            />

            <Box sx={{ textAlign: 'right' }}>
              <Link
                href="/forgot-password"
                underline="hover"
                color="secondary"
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'color 0.2s ease',
                  '&:hover': { color: 'secondary.dark' },
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={status === 'loading'}
              aria-label="login"
              sx={{
                py: 1.5,
                fontWeight: 600,
                bgcolor: 'primary.main',
                boxShadow: theme.shadows[6],
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: theme.shadows[8],
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {status === 'loading' ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Login'
              )}
            </Button>

            <Divider sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>OR</Divider>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={!googleOAuthEnabled}
              aria-label="continue with Google"
              sx={{
                py: 1.4,
                fontWeight: 600,
                backgroundColor: 'background.paper',
                borderColor: 'grey.300',
                color: 'text.primary',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                '&:hover': {
                  backgroundColor: 'background.paper',
                  borderColor: 'grey.300',
                  boxShadow: '0 6px 18px rgba(60, 64, 67, 0.2)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {googleOAuthEnabled ? 'Continue with Google' : 'Google OAuth Not Available'}
            </Button>
          </Box>

          {/* Demo Credentials */}
          {isDemoMode && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'text.primary', fontWeight: 700, mt: 1 }}>
              Welcome Back
            </Typography>
            
            {/* Server error message */}
            {serverError && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 2,
                  '& .MuiAlert-message': { width: '100%' },
                  textAlign: 'left'
                }}
                onClose={() => setServerError('')}
              >
                {serverError}
              </Alert>
            )}
            
            {/* Loading indicator */}
            {status === 'loading' && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Signing in...
                </Typography>
              </Box>
            )}
            
            <Typography variant="subtitle2" gutterBottom>
              Demo Credentials:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin: admin@labourmobility.com / admin123
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trainer: trainer@labourmobility.com / trainer123
            </Typography>
          </Box>
          )}

          {/* Footer Links */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link href="/register" underline="hover">
                Sign Up
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
      </Grow>
    </Box>
  );
};

export default Login;
