import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Button,
  Avatar,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Container,
  Stack,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  UserIcon,
  KeyIcon,
  BellIcon,
  CameraIcon,
  CheckCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import {
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';

// Validation schemas
const profileSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  phone: yup.string().optional(),
  bio: yup.string().max(500, 'Bio must be less than 500 characters').optional(),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Please confirm your new password'),
});

// Custom tab panel component
const TabPanel = ({ children, value, index, ...other }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </Box>
);

const Profile = () => {
  const theme = useTheme();
  const { user, changePassword, updateProfile, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    setValue: setProfileValue,
    watch: watchProfile,
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
  };

  const onProfileSubmit = async (data) => {
    try {
      setError('');
      // In a real app, this would call an API
      await updateProfile?.(data);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      setError('');
      await changePassword(data.currentPassword, data.newPassword);
      setSuccess('Password changed successfully!');
      resetPassword();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return theme.palette.error;
      case 'candidate':
        return theme.palette.primary;
      case 'trainer':
        return theme.palette.success;
      case 'agent':
      case 'recruiter':
        return theme.palette.info;
      case 'broker':
        return theme.palette.warning;
      case 'employer':
        return theme.palette.secondary;
      default:
        return theme.palette.grey;
    }
  };

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return 'U';
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Grid container alignItems="center" spacing={3}>
          <Grid item>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: '2.5rem',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '4px solid rgba(255,255,255,0.3)',
                }}
              >
                {getUserInitials()}
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: theme.palette.secondary.main,
                  color: 'white',
                  width: 32,
                  height: 32,
                  '&:hover': {
                    bgcolor: theme.palette.secondary.dark,
                  },
                }}
              >
                <CameraIcon style={{ width: 16, height: 16 }} />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              {user?.email}
            </Typography>
            <Chip
              label={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<UserIcon style={{ width: 20, height: 20 }} />}
            label="Personal Info"
            iconPosition="start"
          />
          <Tab
            icon={<KeyIcon style={{ width: 20, height: 20 }} />}
            label="Security"
            iconPosition="start"
          />
          <Tab
            icon={<BellIcon style={{ width: 20, height: 20 }} />}
            label="Notifications"
            iconPosition="start"
          />
        </Tabs>

        {/* Personal Information Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box component="form" onSubmit={handleProfileSubmit(onProfileSubmit)}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Personal Information
              </Typography>
              {!editMode ? (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditMode(false);
                      setError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={isLoading}
                  >
                    Save Changes
                  </Button>
                </Stack>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  {...registerProfile('firstName')}
                  error={!!profileErrors.firstName}
                  helperText={profileErrors.firstName?.message}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  {...registerProfile('lastName')}
                  error={!!profileErrors.lastName}
                  helperText={profileErrors.lastName?.message}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  variant="filled"
                  helperText="Email cannot be changed"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  {...registerProfile('phone')}
                  error={!!profileErrors.phone}
                  helperText={profileErrors.phone?.message}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Role"
                  value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || ''}
                  disabled
                  variant="filled"
                  helperText="Role is assigned by administrators"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Member Since"
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  disabled
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  {...registerProfile('bio')}
                  error={!!profileErrors.bio}
                  helperText={profileErrors.bio?.message || 'Tell us about yourself (optional)'}
                  multiline
                  rows={4}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Change Password
          </Typography>

          <Box component="form" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
            <Grid container spacing={3} sx={{ maxWidth: 600 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  {...registerPassword('currentPassword')}
                  error={!!passwordErrors.currentPassword}
                  helperText={passwordErrors.currentPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  {...registerPassword('newPassword')}
                  error={!!passwordErrors.newPassword}
                  helperText={passwordErrors.newPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...registerPassword('confirmPassword')}
                  error={!!passwordErrors.confirmPassword}
                  helperText={passwordErrors.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={<KeyIcon style={{ width: 20, height: 20 }} />}
                >
                  Change Password
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Security Information
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Last Login"
                secondary={user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Account Status"
                secondary="Active"
              />
              <ListItemSecondaryAction>
                <Chip
                  size="small"
                  label="Verified"
                  color="success"
                  icon={<CheckCircleIcon style={{ width: 16, height: 16 }} />}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Notification Preferences
          </Typography>

          <Stack spacing={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Email Notifications
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Job matches and opportunities"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Course updates and deadlines"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Weekly summary reports"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Account security alerts"
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Push Notifications
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Interview reminders"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="New messages"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="System announcements"
                  />
                </Stack>
              </CardContent>
            </Card>

            <Box sx={{ pt: 2 }}>
              <Button variant="contained" size="large">
                Save Notification Settings
              </Button>
            </Box>
          </Stack>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Profile;
