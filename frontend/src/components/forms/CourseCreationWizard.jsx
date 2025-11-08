import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Stack,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Autocomplete,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Save as SaveIcon,
  FileCopy as CloneIcon,
  Preview as PreviewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import adminService from '../../api/admin';

// Rich Text Editor (using a simple textarea for now - can be replaced with Quill/TinyMCE)
const RichTextEditor = ({ value, onChange, label }) => {
  return (
    <TextField
      fullWidth
      label={label}
      multiline
      rows={6}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter detailed course description..."
    />
  );
};

const CourseCreationWizard = ({ initialData = null, mode = 'create' }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    courseCode: '',
    category: '',
    description: '',
    objectives: [],
    prerequisites: [],
    
    // Step 2: Schedule & Duration
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    duration: '',
    durationUnit: 'weeks',
    schedule: 'weekdays',
    customSchedule: [],
    
    // Step 3: Capacity & Fees
    maxCapacity: '',
    minCapacity: '',
    courseFee: '',
  currency: 'KES',
    registrationDeadline: null,
    allowWaitlist: false,
    
    // Step 4: Trainer Assignment
    primaryTrainer: null,
    secondaryTrainers: [],
    
    // Step 5: Materials
  // materials and syllabus removed — materials upload moved out of wizard
  });

  const [trainers, setTrainers] = useState([]);
  const [categories] = useState([
    'IT & Software',
    'Healthcare',
    'Business',
    'Manufacturing',
    'Hospitality',
    'Construction',
    'Other',
  ]);

  const steps = [
    'Basic Information',
    'Schedule & Duration',
    'Capacity & Fees',
    'Trainer Assignment',
  ];

  const getCurrencyAdornment = (currency) => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'CAD':
        return '$';
      case 'KES':
      default:
        return 'KES';
    }
  };

  useEffect(() => {
    // Load initial data if editing or cloning
    if (initialData) {
      // Convert ISO date strings from initialData into Date objects for pickers
      const converted = { ...initialData };
      if (initialData.startDate) converted.startDate = new Date(initialData.startDate);
      if (initialData.endDate) converted.endDate = new Date(initialData.endDate);
      if (initialData.startTime) converted.startTime = new Date(initialData.startTime);
      if (initialData.endTime) converted.endTime = new Date(initialData.endTime);
      if (initialData.registrationDeadline) converted.registrationDeadline = new Date(initialData.registrationDeadline);
      setFormData((prev) => ({ ...prev, ...converted }));
    }
    
    // Fetch trainers
    fetchTrainers();
    
    // Auto-save setup
    const autoSaveInterval = setInterval(() => {
      handleAutoSave();
    }, 30000); // Auto-save every 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, []);

  const fetchTrainers = async () => {
    try {
      const response = await adminService.getAllUsers({ role: 'trainer', status: 'ACTIVE' });
      if (response.data.success) {
        const trainersData = response.data.data.map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          expertise: user.role?.name || 'Trainer',
        }));
        setTrainers(trainersData);
      }
    } catch (err) {
      console.error('Error fetching trainers:', err);
      // Fallback to demo data if API fails
      setTrainers([
        { id: 1, name: 'Demo Trainer 1', email: 'trainer1@example.com', expertise: 'IT' },
        { id: 2, name: 'Demo Trainer 2', email: 'trainer2@example.com', expertise: 'Healthcare' },
      ]);
    }
  };

  const handleAutoSave = async () => {
    if (mode === 'create' && formData.title) {
      try {
        setAutoSaving(true);
        // Save to localStorage as draft
        localStorage.setItem('courseDraft', JSON.stringify(formData));
        console.log('Auto-saved course draft');
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        setTimeout(() => setAutoSaving(false), 1000);
      }
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Basic Info
        if (!formData.title) {
          setError('Course title is required');
          return false;
        }
        if (!formData.courseCode) {
          setError('Course code is required');
          return false;
        }
        if (!formData.category) {
          setError('Category is required');
          return false;
        }
        break;
      case 1: // Schedule
        if (!formData.startDate) {
          setError('Start date is required');
          return false;
        }
        if (!formData.endDate) {
          setError('End date is required');
          return false;
        }
        if (!formData.duration) {
          setError('Duration is required');
          return false;
        }
        break;
      case 2: // Capacity
        if (!formData.maxCapacity || formData.maxCapacity <= 0) {
          setError('Maximum capacity must be greater than 0');
          return false;
        }
        if (formData.minCapacity && formData.minCapacity > formData.maxCapacity) {
          setError('Minimum capacity cannot exceed maximum capacity');
          return false;
        }
        if (!formData.courseFee || formData.courseFee < 0) {
          setError('Course fee must be 0 or greater');
          return false;
        }
        break;
      case 3: // Trainer
        if (!formData.primaryTrainer) {
          setError('Primary trainer is required');
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Prepare course data for API
      const courseData = {
        title: formData.title,
        courseCode: formData.courseCode,
        category: formData.category,
        description: formData.description,
        objectives: formData.objectives,
        prerequisites: formData.prerequisites,
        startDate: formData.startDate,
          endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: formData.duration,
        durationUnit: formData.durationUnit,
        schedule: formData.schedule,
        customSchedule: formData.customSchedule,
        maxCapacity: formData.maxCapacity,
        minCapacity: formData.minCapacity,
        courseFee: formData.courseFee,
        currency: formData.currency,
        registrationDeadline: formData.registrationDeadline,
        allowWaitlist: formData.allowWaitlist,
        primaryTrainer: formData.primaryTrainer,
        secondaryTrainers: formData.secondaryTrainers,
      };

      // When creating via the wizard's 'Create Course' action, treat it as publish
      // (Save Draft button uses localStorage). This automates activation for complete courses.
      if (mode === 'create') {
        courseData.status = 'ACTIVE';
      }

      // Normalize dates to ISO strings (backend expects ISO timestamps)
      const normalizeDate = (d) => (d instanceof Date ? d.toISOString() : d || null);
      courseData.startDate = normalizeDate(courseData.startDate);
      courseData.endDate = normalizeDate(courseData.endDate);
      courseData.startTime = normalizeDate(courseData.startTime);
      courseData.endTime = normalizeDate(courseData.endTime);
      courseData.registrationDeadline = normalizeDate(courseData.registrationDeadline);

      // Call API to create course
      const response = mode === 'edit' 
        ? await adminService.updateCourse(initialData?.id, courseData)
        : await adminService.createCourse(courseData);
      
      if (response.data.success) {
        setSuccess(mode === 'edit' ? 'Course updated successfully!' : 'Course created successfully!');
        localStorage.removeItem('courseDraft');

        // Ensure created course is published. Some backends may ignore status on create,
        // so perform a fallback update to set status to ACTIVE when needed.
        try {
          const created = response.data.data?.course || response.data.data;
          const createdId = created?.id;
          const createdStatus = created?.status;
          if (mode === 'create' && createdId && createdStatus !== 'ACTIVE') {
            await adminService.updateCourse(createdId, { status: 'ACTIVE' });
          }
        } catch (err) {
          // Non-fatal — log and continue navigation
          console.warn('Failed to ensure course active after create:', err);
        }
        
        // Clear any prior error and navigate to the created course's detail page
        setError('');
        const created = response.data.data?.course || response.data.data;
        const createdId = created?.id;
        setTimeout(() => {
          if (createdId) navigate(`/admin/courses/${createdId}`);
          else navigate('/admin/courses');
        }, 800);
      }
    } catch (err) {
      console.error('Error submitting course:', err);
      setError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleCloneCourse = async () => {
    // TODO: Implement clone functionality
    setCloneDialogOpen(false);
  };

  // File upload removed from wizard. Use a dedicated course materials management UI if needed.

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Course Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Advanced Web Development"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Course Code"
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                placeholder="e.g., CS101"
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <RichTextEditor
                label="Course Description"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.objectives}
                onChange={(e, newValue) => setFormData({ ...formData, objectives: newValue })}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Learning Objectives"
                    placeholder="Type and press Enter"
                    helperText="Add learning objectives for this course"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.prerequisites}
                onChange={(e, newValue) => setFormData({ ...formData, prerequisites: newValue })}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Prerequisites"
                    placeholder="Type and press Enter"
                    helperText="Add course prerequisites"
                  />
                )}
              />
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(newValue) => setFormData({ ...formData, startDate: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(newValue) => setFormData({ ...formData, endDate: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  minDate={formData.startDate}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(newValue) => setFormData({ ...formData, startTime: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="End Time"
                  value={formData.endTime}
                  onChange={(newValue) => setFormData({ ...formData, endTime: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Duration Unit</InputLabel>
                  <Select
                    value={formData.durationUnit}
                    label="Duration Unit"
                    onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value })}
                  >
                    <MenuItem value="days">Days</MenuItem>
                    <MenuItem value="weeks">Weeks</MenuItem>
                    <MenuItem value="months">Months</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Schedule Type</InputLabel>
                  <Select
                    value={formData.schedule}
                    label="Schedule Type"
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  >
                    <MenuItem value="weekdays">Weekdays (Mon-Fri)</MenuItem>
                    <MenuItem value="weekends">Weekends (Sat-Sun)</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="custom">Custom Schedule</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {formData.schedule === 'custom' && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Select days of the week:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <Chip
                        key={day}
                        label={day}
                        onClick={() => {
                          const schedule = formData.customSchedule.includes(day)
                            ? formData.customSchedule.filter((d) => d !== day)
                            : [...formData.customSchedule, day];
                          setFormData({ ...formData, customSchedule: schedule });
                        }}
                        color={formData.customSchedule.includes(day) ? 'primary' : 'default'}
                      />
                    ))}
                  </Stack>
                </Grid>
              )}
            </Grid>
          </LocalizationProvider>
        );
        
      case 2:
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Maximum Capacity"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                  inputProps={{ min: 1 }}
                  helperText="Maximum number of students"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Capacity"
                  value={formData.minCapacity}
                  onChange={(e) => setFormData({ ...formData, minCapacity: e.target.value })}
                  inputProps={{ min: 1 }}
                  helperText="Minimum students to start course"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Course Fee"
                  value={formData.courseFee}
                  onChange={(e) => setFormData({ ...formData, courseFee: e.target.value })}
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{getCurrencyAdornment(formData.currency)}</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.currency}
                    label="Currency"
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="CAD">CAD ($)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Registration Deadline"
                  value={formData.registrationDeadline}
                  onChange={(newValue) => setFormData({ ...formData, registrationDeadline: newValue })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  maxDate={formData.startDate}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.allowWaitlist}
                      onChange={(e) => setFormData({ ...formData, allowWaitlist: e.target.checked })}
                    />
                  }
                  label="Allow Waitlist when Full"
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        );
        
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Primary Trainer
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                options={trainers}
                getOptionLabel={(option) => `${option.name} (${option.expertise})`}
                value={formData.primaryTrainer}
                onChange={(e, newValue) => setFormData({ ...formData, primaryTrainer: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Primary Trainer"
                    required
                    helperText="Main instructor for this course"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email} • {option.expertise}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Secondary Trainers (Optional)
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={trainers.filter((t) => t.id !== formData.primaryTrainer?.id)}
                getOptionLabel={(option) => `${option.name} (${option.expertise})`}
                value={formData.secondaryTrainers}
                onChange={(e, newValue) => setFormData({ ...formData, secondaryTrainers: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Secondary Trainers"
                    helperText="Assistant instructors or guest lecturers"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>
          </Grid>
        );
        
      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">
            {mode === 'create' ? 'Create New Course' : 'Edit Course'}
          </Typography>
          <Stack direction="row" spacing={2}>
            {autoSaving && (
              <Chip
                label="Auto-saving..."
                size="small"
                color="primary"
                icon={<CircularProgress size={16} />}
              />
            )}
            <Button
              variant="outlined"
              startIcon={<CloneIcon />}
              onClick={() => setCloneDialogOpen(true)}
            >
              Clone Existing
            </Button>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setPreviewDialogOpen(true)}
            >
              Preview
            </Button>
          </Stack>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Stepper */}
        <Paper sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box sx={{ minHeight: 400 }}>
            {renderStepContent(activeStep)}
          </Box>

          {/* Navigation Buttons */}
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<BackIcon />}
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleAutoSave}
              >
                Save Draft
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {loading ? 'Creating...' : 'Create Course'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<NextIcon />}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Clone Dialog */}
        <Dialog
          open={cloneDialogOpen}
          onClose={() => setCloneDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Clone Existing Course</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select a course to use as a template
            </Typography>
            {/* TODO: Add course selection */}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCloneDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCloneCourse}>
              Clone
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Course Preview
            <IconButton
              sx={{ position: 'absolute', right: 8, top: 8 }}
              onClick={() => setPreviewDialogOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="h5" gutterBottom>
              {formData.title || 'Course Title'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {formData.courseCode} • {formData.category}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" paragraph>
              {formData.description || 'No description provided'}
            </Typography>
            {formData.objectives.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Learning Objectives
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {formData.objectives.map((obj, idx) => (
                    <Chip key={idx} label={obj} size="small" />
                  ))}
                </Stack>
              </>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CourseCreationWizard;
