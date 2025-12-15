import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  School as EducationIcon,
  Work as WorkIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import candidateService from '../../api/candidate';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

const COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia', 'Other'];
const COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika',
  'Malindi', 'Kitale', 'Garissa', 'Kakamega', 'Machakos', 'Other'
];
const EDUCATION_LEVELS = [
  'Primary', 'Secondary', 'Certificate', 'Diploma',
  'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other'
];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];

const ProfileSettings = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dob: null,
    nationalIdPassport: '',
    county: '',
    maritalStatus: '',
    highestEducation: '',
    relevantSkills: '',
    previousEmployer: '',
    previousRole: '',
    previousDuration: '',
    preferredCountry: '',
    jobTypePreference: '',
    willingToRelocate: false,
    languages: [],
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await candidateService.getProfile();
      setProfile(response);

      // Populate form data
      setFormData({
        fullName: response.fullName || '',
        gender: response.gender || '',
        dob: response.dob ? new Date(response.dob) : null,
        nationalIdPassport: response.nationalIdPassport || '',
        county: response.county || '',
        maritalStatus: response.maritalStatus || '',
        highestEducation: response.highestEducation || '',
        relevantSkills: response.relevantSkills || '',
        previousEmployer: response.previousEmployer || '',
        previousRole: response.previousRole || '',
        previousDuration: response.previousDuration || '',
        preferredCountry: response.preferredCountry || '',
        jobTypePreference: response.jobTypePreference || '',
        willingToRelocate: response.willingToRelocate || false,
        languages: response.languages || [],
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      enqueueSnackbar(t('profile.loadFailed'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await candidateService.updateProfile(formData);
      enqueueSnackbar(t('profile.updateSuccess'), { variant: 'success' });
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      enqueueSnackbar(error.response?.data?.message || t('profile.updateFailed'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar(t('profile.fileSizeError'), { variant: 'error' });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar(t('profile.fileTypeError'), { variant: 'error' });
      return;
    }

    try {
      setSaving(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'profile_photo');

      console.log('📤 Frontend sending:', {
        isFormData: uploadFormData instanceof FormData,
        file: file,
        type: 'profile_photo'
      });

      const response = await candidateService.uploadDocument(uploadFormData);

      console.log('📸 Upload response:', response);

      // Update profile with new photo URL
      await candidateService.updateProfile({
        profilePhotoUrl: response.data?.fileUrl || response.fileUrl
      });

      enqueueSnackbar(t('profile.photoUploadSuccess'), { variant: 'success' });
      fetchProfile();
    } catch (error) {
      console.error('Error uploading photo:', error);
      enqueueSnackbar(error.response?.data?.message || t('profile.photoUploadFailed'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderPersonalInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" alignItems="center" gap={3} mb={3}>
          <Avatar
            src={profile?.profilePhotoUrl ? `${BACKEND_URL}${profile.profilePhotoUrl}` : undefined}
            sx={{ width: 100, height: 100 }}
          >
            {!profile?.profilePhotoUrl && profile?.fullName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('profile.profilePhoto')}
            </Typography>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-photo-upload"
              type="file"
              onChange={handlePhotoUpload}
            />
            <label htmlFor="profile-photo-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CameraIcon />}
                size="small"
                disabled={saving}
              >
                {t('profile.uploadPhoto')}
              </Button>
            </label>
            {profile?.profilePhotoUrl && (
              <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                {t('profile.current')}: {profile.profilePhotoUrl.split('/').pop()}
              </Typography>
            )}
          </Box>
        </Box>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={t('profile.fullName')}
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          required
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>{t('profile.gender')}</InputLabel>
          <Select
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            label={t('profile.gender')}
          >
            <MenuItem value="Male">{t('profile.male')}</MenuItem>
            <MenuItem value="Female">{t('profile.female')}</MenuItem>
            <MenuItem value="Other">{t('profile.other')}</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label={t('profile.dateOfBirth')}
            value={formData.dob}
            onChange={(date) => handleChange('dob', date)}
            slotProps={{
              textField: { fullWidth: true }
            }}
          />
        </LocalizationProvider>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={t('profile.nationalIdPassport')}
          value={formData.nationalIdPassport}
          onChange={(e) => handleChange('nationalIdPassport', e.target.value)}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>{t('profile.county')}</InputLabel>
          <Select
            value={formData.county}
            onChange={(e) => handleChange('county', e.target.value)}
            label={t('profile.county')}
          >
            {COUNTIES.map(county => (
              <MenuItem key={county} value={county}>{county}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>{t('profile.maritalStatus')}</InputLabel>
          <Select
            value={formData.maritalStatus}
            onChange={(e) => handleChange('maritalStatus', e.target.value)}
            label={t('profile.maritalStatus')}
          >
            {MARITAL_STATUS.map(status => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label={t('profile.phoneNumber')}
          value={profile?.user?.phone || ''}
          disabled
          helperText={t('profile.contactAdminPhone')}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label={t('profile.emailAddress')}
          value={profile?.user?.email || ''}
          disabled
          helperText={t('profile.contactAdminEmail')}
        />
      </Grid>
    </Grid>
  );

  const renderEducation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>{t('profile.highestEducation')}</InputLabel>
          <Select
            value={formData.highestEducation}
            onChange={(e) => handleChange('highestEducation', e.target.value)}
            label={t('profile.highestEducation')}
          >
            {EDUCATION_LEVELS.map(level => (
              <MenuItem key={level} value={level}>{level}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label={t('profile.relevantSkills')}
          value={formData.relevantSkills}
          onChange={(e) => handleChange('relevantSkills', e.target.value)}
          multiline
          rows={4}
          helperText={t('profile.skillsHelper')}
          placeholder={t('profile.skillsPlaceholder')}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>
          {t('profile.languagesSpoken')}
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {['English', 'Swahili', 'Arabic', 'French', 'Other'].map(lang => (
            <Chip
              key={lang}
              label={lang}
              onClick={() => {
                const languages = formData.languages || [];
                const updated = languages.includes(lang)
                  ? languages.filter(l => l !== lang)
                  : [...languages, lang];
                handleChange('languages', updated);
              }}
              color={formData.languages?.includes(lang) ? 'primary' : 'default'}
              variant={formData.languages?.includes(lang) ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Grid>
    </Grid>
  );

  const renderWorkHistory = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info">
          {t('profile.workHistoryInfo')}
        </Alert>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={t('profile.previousEmployer')}
          value={formData.previousEmployer}
          onChange={(e) => handleChange('previousEmployer', e.target.value)}
          placeholder={t('profile.previousEmployerPlaceholder')}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={t('profile.previousRole')}
          value={formData.previousRole}
          onChange={(e) => handleChange('previousRole', e.target.value)}
          placeholder={t('profile.previousRolePlaceholder')}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={t('profile.duration')}
          value={formData.previousDuration}
          onChange={(e) => handleChange('previousDuration', e.target.value)}
          placeholder={t('profile.durationPlaceholder')}
        />
      </Grid>
    </Grid>
  );

  const renderPreferences = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info">
          {t('profile.preferencesInfo')}
        </Alert>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>{t('profile.preferredCountry')}</InputLabel>
          <Select
            value={formData.preferredCountry}
            onChange={(e) => handleChange('preferredCountry', e.target.value)}
            label={t('profile.preferredCountry')}
          >
            {COUNTRIES.map(country => (
              <MenuItem key={country} value={country}>{country}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={t('profile.jobTypePreference')}
          value={formData.jobTypePreference}
          onChange={(e) => handleChange('jobTypePreference', e.target.value)}
          placeholder={t('profile.jobTypePlaceholder')}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.willingToRelocate}
              onChange={(e) => handleChange('willingToRelocate', e.target.checked)}
            />
          }
          label={t('profile.willingToRelocate')}
        />
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          {t('profile.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('profile.subtitle')}
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<PersonIcon />} label={t('profile.personalInfo')} />
          <Tab icon={<EducationIcon />} label={t('profile.educationSkills')} />
          <Tab icon={<WorkIcon />} label={t('profile.workHistory')} />
          <Tab icon={<SettingsIcon />} label={t('profile.preferences')} />
        </Tabs>
      </Paper>

      {/* Content */}
      <Paper sx={{ p: 3 }}>
        {tabValue === 0 && renderPersonalInfo()}
        {tabValue === 1 && renderEducation()}
        {tabValue === 2 && renderWorkHistory()}
        {tabValue === 3 && renderPreferences()}

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button
            variant="outlined"
            onClick={fetchProfile}
            disabled={saving}
          >
            {t('profile.reset')}
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t('profile.saving') : t('profile.saveChanges')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfileSettings;
