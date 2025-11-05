import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  CircularProgress,
  Grow,
  FormHelperText,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  PersonOutline,
  Email,
  Lock,
  Google as GoogleIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { registerUser } from '../../features/auth/authThunks';
import { clearError } from '../../features/auth/authSlice';

const AUTO_LOGIN_AFTER_REGISTER = import.meta.env.VITE_AUTH_AUTO_LOGIN_AFTER_REGISTER === 'true';

const initialValues = {
  role: 'candidate',

  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const Register = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { status, error, isAuthenticated, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState(initialValues);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});

  const isLoading = status === 'loading';

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (AUTO_LOGIN_AFTER_REGISTER && isAuthenticated) {
      enqueueSnackbar('Registration successful. Redirecting...', { variant: 'success' });
      const rolePath = user?.role ? `/${user.role.toLowerCase() === 'employer' ? 'recruiter' : user.role.toLowerCase()}/dashboard` : '/dashboard';
      navigate(rolePath, { replace: true });
    }
  }, [AUTO_LOGIN_AFTER_REGISTER, enqueueSnackbar, isAuthenticated, navigate, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const validations = useMemo(() => {
    const errors = {};
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Enter a valid email';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  }, [formData]);

  const showError = (field) => touched[field] && validations[field];

  const canSubmit = useMemo(() => Object.keys(validations).length === 0, [validations]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!canSubmit) {
      enqueueSnackbar('Please fix validation errors before submitting.', { variant: 'warning' });
      return;
    }

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || null,
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      };

      const response = await dispatch(registerUser(payload)).unwrap();

      if (AUTO_LOGIN_AFTER_REGISTER) {
        // Success handled by authSlice state changes
        return;
      }

      enqueueSnackbar('Registration successful! Please sign in.', { variant: 'success' });
      navigate('/login', { replace: true });
    } catch (err) {
      enqueueSnackbar(err || 'Registration failed.', { variant: 'error' });
    }
  };

  const [googleOAuthEnabled, setGoogleOAuthEnabled] = useState(true);

  const handleGoogleSignIn = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 503) {
        // Google OAuth not configured
        enqueueSnackbar('Google OAuth is not configured on this server', { variant: 'warning' });
        setGoogleOAuthEnabled(false);
        return;
      }

      if (response.ok) {
        window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
      } else {
        throw new Error('Failed to initiate Google OAuth');
      }
    } catch (error) {
      enqueueSnackbar('Failed to connect to Google OAuth', { variant: 'error' });
      setGoogleOAuthEnabled(false);
    }
  };

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
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Join UMSL
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                Create your account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Start managing your mobility journey in minutes.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                required
                error={Boolean(showError('firstName'))}
                helperText={showError('firstName')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutline />
                    </InputAdornment>
                  ),
                }}
                disabled={isLoading}
              />

              <TextField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutline />
                    </InputAdornment>
                  ),
                }}
                disabled={isLoading}
              />

              <TextField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                required
                error={Boolean(showError('email'))}
                helperText={showError('email')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
                disabled={isLoading}
              />

              <TextField
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                required
                error={Boolean(showError('password'))}
                helperText={showError('password')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end" aria-label="toggle password visibility">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={isLoading}
              />

              <TextField
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                required
                error={Boolean(showError('confirmPassword'))}
                helperText={showError('confirmPassword')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword((prev) => !prev)} edge="end" aria-label="toggle confirm password visibility">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={isLoading}
              />

              {error && (
                <FormHelperText error sx={{ mt: -1 }}>
                  {error}
                </FormHelperText>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                sx={{ py: 1.3, fontWeight: 600 }}
              >
                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign Up'}
              </Button>
            </Box>

            <Divider sx={{ my: 2, color: 'text.secondary', fontSize: '0.85rem' }}>OR</Divider>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={!googleOAuthEnabled}
              sx={{ py: 1.2, fontWeight: 600 }}
            >
              {googleOAuthEnabled ? 'Continue with Google' : 'Google OAuth Not Available'}
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              By signing up, you agree to our <Link href="#" underline="hover">Terms</Link> and <Link href="#" underline="hover">Privacy Policy</Link>.
            </Typography>

            <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" underline="hover">
                Sign In
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Grow>
    </Box>
  );
};

export default Register;
