import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const Settings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'Labour Mobility System',
    systemEmail: 'admin@labourmobility.com',
    timezone: 'UTC',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    currency: 'KES',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    enrollmentAlerts: true,
    certificateAlerts: true,
    systemAlerts: true,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    sessionTimeout: 30,
    twoFactorAuth: false,
    loginAttempts: 5,
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    senderName: 'Labour Mobility',
    senderEmail: 'noreply@labourmobility.com',
  });

  const handleSaveSettings = async (settingsType) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // TODO: Implement actual API call
      // await adminService.updateSettings(settingsType, settings);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ paddingTop: 24 }}>
      {value === index && children}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          {t('settings.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('settings.systemSettings')}
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Settings Tabs */}
      <Paper>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<SettingsIcon />} label={t('settings.general')} iconPosition="start" />
          <Tab icon={<NotificationsIcon />} label={t('settings.notifications')} iconPosition="start" />
          <Tab icon={<SecurityIcon />} label={t('settings.security')} iconPosition="start" />
          <Tab icon={<EmailIcon />} label={t('settings.email')} iconPosition="start" />
          <Tab icon={<PaletteIcon />} label={t('settings.appearance')} iconPosition="start" />
        </Tabs>

        {/* General Settings */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('settings.systemName')}
                  value={generalSettings.systemName}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, systemName: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('settings.systemEmail')}
                  type="email"
                  value={generalSettings.systemEmail}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, systemEmail: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('settings.timezone')}</InputLabel>
                  <Select
                    value={generalSettings.timezone}
                    label={t('settings.timezone')}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, timezone: e.target.value })
                    }
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('settings.language')}</InputLabel>
                  <Select
                    value={generalSettings.language}
                    label={t('settings.language')}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, language: e.target.value })
                    }
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={generalSettings.dateFormat}
                    label="Date Format"
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })
                    }
                  >
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={generalSettings.currency}
                    label="Currency"
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, currency: e.target.value })
                    }
                  >
                    <MenuItem value="KES">KES (KSh)</MenuItem>
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('general')}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Channels
            </Typography>
            <Stack spacing={2} mb={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: e.target.checked,
                      })
                    }
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        smsNotifications: e.target.checked,
                      })
                    }
                  />
                }
                label="SMS Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        pushNotifications: e.target.checked,
                      })
                    }
                  />
                }
                label="Push Notifications"
              />
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Alert Types
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.enrollmentAlerts}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        enrollmentAlerts: e.target.checked,
                      })
                    }
                  />
                }
                label="Enrollment Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.certificateAlerts}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        certificateAlerts: e.target.checked,
                      })
                    }
                  />
                }
                label="Certificate Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.systemAlerts}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        systemAlerts: e.target.checked,
                      })
                    }
                  />
                }
                label="System Alerts"
              />
            </Stack>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('notifications')}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Password Requirements
            </Typography>
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Password Length"
                  type="number"
                  value={securitySettings.passwordMinLength}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordMinLength: parseInt(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Login Attempts"
                  type="number"
                  value={securitySettings.loginAttempts}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      loginAttempts: parseInt(e.target.value),
                    })
                  }
                />
              </Grid>
            </Grid>

            <Stack spacing={2} mb={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.requireUppercase}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        requireUppercase: e.target.checked,
                      })
                    }
                  />
                }
                label="Require Uppercase Letters"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.requireNumbers}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        requireNumbers: e.target.checked,
                      })
                    }
                  />
                }
                label="Require Numbers"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.requireSpecialChars}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        requireSpecialChars: e.target.checked,
                      })
                    }
                  />
                }
                label="Require Special Characters"
              />
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Session & Authentication
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionTimeout: parseInt(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          twoFactorAuth: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Enable Two-Factor Authentication"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('security')}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Email Settings */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              SMTP Configuration
            </Typography>
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  value={emailSettings.smtpHost}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Port"
                  type="number"
                  value={emailSettings.smtpPort}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Username"
                  value={emailSettings.smtpUser}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, smtpUser: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Password"
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Sender Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sender Name"
                  value={emailSettings.senderName}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, senderName: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sender Email"
                  type="email"
                  value={emailSettings.senderEmail}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, senderEmail: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined">Test Email Configuration</Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('email')}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Appearance Settings */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Theme & Appearance
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Theme customization coming soon!
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Theme Mode</InputLabel>
                  <Select defaultValue="light" label="Theme Mode">
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="auto">Auto</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Primary Color</InputLabel>
                  <Select defaultValue="blue" label="Primary Color">
                    <MenuItem value="blue">Blue</MenuItem>
                    <MenuItem value="green">Green</MenuItem>
                    <MenuItem value="purple">Purple</MenuItem>
                    <MenuItem value="red">Red</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;
