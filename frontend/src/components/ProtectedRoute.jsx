import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const theme = useTheme();
  const location = useLocation();
  const { isAuthenticated, user, status } = useSelector((state) => state.auth);
  const resolveUserRole = () => {
    const rawRole = user?.role?.name || user?.role;
    if (typeof rawRole !== 'string') return '';
    const normalized = rawRole.toLowerCase();
    return normalized === 'agent' ? 'recruiter' : normalized;
  };
  const userRole = resolveUserRole();

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Stack spacing={3} alignItems="center">
          <CircularProgress size={64} thickness={4} />
          <Typography variant="h6" color="text.secondary">
            Loading...
          </Typography>
        </Stack>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.some((role) => role.toLowerCase() === userRole)) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          py: 3,
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={3}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <ShieldExclamationIcon
                style={{
                  width: 80,
                  height: 80,
                  color: theme.palette.error.main,
                }}
              />
            </Box>

            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 2,
              }}
            >
              Access Denied
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              You don't have permission to access this page.
            </Typography>

            <Alert
              severity="error"
              icon={
                <ExclamationTriangleIcon
                  style={{ width: 20, height: 20 }}
                />
              }
              sx={{
                mb: 4,
                textAlign: 'left',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Insufficient Permissions
              </Typography>
              <Typography variant="body2">
                Your role ({user?.role || 'Unknown'}) doesn't have access to
                this resource. Please contact your administrator if you
                believe this is an error.
              </Typography>
            </Alert>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="outlined"
                startIcon={<ArrowLeftIcon style={{ width: 20, height: 20 }} />}
                onClick={() => window.history.back()}
                size="large"
              >
                Go Back
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  const destinationRole = userRole || 'candidate';
                  window.location.href = `/dashboard/${destinationRole}`;
                }}
                size="large"
              >
                Go to Dashboard
              </Button>
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 3 }}
            >
              If you believe this is an error, please contact support.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  // User is authenticated and authorized, render children
  return children;
};

export default ProtectedRoute;
