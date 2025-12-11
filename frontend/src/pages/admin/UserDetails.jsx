import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Email,
  Phone,
  Person,
  Badge,
  CalendarToday,
  Login,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { adminService } from '../../api/admin';
import { format } from 'date-fns';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getUserById(id);
      setUser(response.data.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(err.response?.data?.message || 'Failed to load user details');
      enqueueSnackbar('Failed to load user details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'default';
      case 'SUSPENDED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle />;
      case 'SUSPENDED':
        return <Block />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'User not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin/users')}
        >
          Back to Users
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin/users')}
          >
            Back
          </Button>
          <Typography variant="h4" fontWeight="bold">
            User Details
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate(`/admin/users/${id}/edit`)}
        >
          Edit User
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                  }}
                >
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" justifyContent="center">
                  <Chip
                    label={user.role?.name || 'No Role'}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={user.status}
                    color={getStatusColor(user.status)}
                    size="small"
                    icon={getStatusIcon(user.status)}
                  />
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary="User ID"
                    secondary={`#${user.id}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={user.email}
                  />
                </ListItem>
                {user.phone && (
                  <ListItem>
                    <ListItemIcon>
                      <Phone />
                    </ListItemIcon>
                    <ListItemText
                      primary="Phone"
                      secondary={user.phone}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon>
                    <Badge />
                  </ListItemIcon>
                  <ListItemText
                    primary="Role"
                    secondary={user.role?.name || 'Not Assigned'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Details Card */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Account Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        First Name
                      </Typography>
                      <Typography variant="body1">
                        {user.firstName || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Name
                      </Typography>
                      <Typography variant="body1">
                        {user.lastName || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email Address
                      </Typography>
                      <Typography variant="body1">
                        {user.email}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone Number
                      </Typography>
                      <Typography variant="body1">
                        {user.phone || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Role
                      </Typography>
                      <Typography variant="body1">
                        {user.role?.name || 'Not assigned'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body1">
                        <Chip
                          label={user.status}
                          size="small"
                          color={getStatusColor(user.status)}
                        />
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Activity Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Activity Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarToday />
                        </ListItemIcon>
                        <ListItemText
                          primary="Account Created"
                          secondary={
                            user.createdAt
                              ? format(new Date(user.createdAt), 'PPP p')
                              : 'N/A'
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarToday />
                        </ListItemIcon>
                        <ListItemText
                          primary="Last Updated"
                          secondary={
                            user.updatedAt
                              ? format(new Date(user.updatedAt), 'PPP p')
                              : 'N/A'
                          }
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <Login />
                        </ListItemIcon>
                        <ListItemText
                          primary="Last Login"
                          secondary={
                            user.lastLogin
                              ? format(new Date(user.lastLogin), 'PPP p')
                              : 'Never logged in'
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Badge />
                        </ListItemIcon>
                        <ListItemText
                          primary="Tenant ID"
                          secondary={user.tenantId || 'N/A'}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Additional Details based on role */}
            {user.role?.name === 'Candidate' && user.candidateProfile && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Candidate Profile
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/admin/candidates/${user.candidateProfile.id}`)}
                  >
                    View Candidate Details
                  </Button>
                </CardContent>
              </Card>
            )}

            {user.role?.name === 'Trainer' && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Trainer Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    This user has trainer privileges and can manage courses and assessments.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDetails;
