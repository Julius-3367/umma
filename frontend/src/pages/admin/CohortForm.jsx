import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Stack,
  Alert,
  CircularProgress,
  MenuItem,
  IconButton,
  Divider,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { cohortService } from '../../api/cohort';
import { adminService } from '../../api/admin';

const CohortForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);

  const [formData, setFormData] = useState({
    cohortCode: '',
    name: '',
    courseId: '',
    leadTrainerId: '',
    startDate: '',
    endDate: '',
    enrollmentDeadline: '',
    maxCapacity: '',
    description: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchDropdownData();
    if (isEditMode) {
      fetchCohortData();
    }
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const [coursesRes, usersRes] = await Promise.all([
        adminService.getAllCourses({ limit: 1000 }),
        adminService.getAllUsers({ role: 'TRAINER', limit: 1000 }),
      ]);
      
      console.log('Courses response:', coursesRes.data);
      console.log('Users response:', usersRes.data);
      
      const coursesList = coursesRes.data?.courses || [];
      const usersList = usersRes.data?.users || [];
      
      setCourses(coursesList);
      setTrainers(usersList);
      
      if (coursesList.length === 0) {
        setError('No courses found. Please create a course first.');
      }
      if (usersList.length === 0) {
        setError('No trainers found. Please create a trainer user first.');
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
      setError(`Failed to load form data: ${err.response?.data?.message || err.message}`);
    }
  };

  const fetchCohortData = async () => {
    try {
      setLoading(true);
      const response = await cohortService.getCohortById(id);
      const cohort = response.data;
      
      // Format dates for input fields
      setFormData({
        cohortCode: cohort.cohortCode || '',
        name: cohort.name || '',
        courseId: cohort.courseId || '',
        leadTrainerId: cohort.leadTrainerId || '',
        startDate: cohort.startDate ? cohort.startDate.split('T')[0] : '',
        endDate: cohort.endDate ? cohort.endDate.split('T')[0] : '',
        enrollmentDeadline: cohort.enrollmentDeadline ? cohort.enrollmentDeadline.split('T')[0] : '',
        maxCapacity: cohort.maxCapacity || '',
        description: cohort.description || '',
      });
    } catch (err) {
      console.error('Error fetching cohort:', err);
      setError(err.response?.data?.message || 'Failed to fetch cohort data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.cohortCode.trim()) {
      errors.cohortCode = 'Cohort code is required';
    }
    if (!formData.name.trim()) {
      errors.name = 'Cohort name is required';
    }
    if (!formData.courseId) {
      errors.courseId = 'Course is required';
    }
    if (!formData.leadTrainerId) {
      errors.leadTrainerId = 'Lead trainer is required';
    }
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }
    if (!formData.enrollmentDeadline) {
      errors.enrollmentDeadline = 'Enrollment deadline is required';
    }
    if (!formData.maxCapacity) {
      errors.maxCapacity = 'Max capacity is required';
    } else if (parseInt(formData.maxCapacity) <= 0) {
      errors.maxCapacity = 'Max capacity must be greater than 0';
    }

    // Date validations
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        errors.endDate = 'End date must be after start date';
      }
    }
    if (formData.enrollmentDeadline && formData.startDate) {
      if (new Date(formData.enrollmentDeadline) >= new Date(formData.startDate)) {
        errors.enrollmentDeadline = 'Enrollment deadline must be before start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submitData = {
        ...formData,
        courseId: parseInt(formData.courseId),
        leadTrainerId: parseInt(formData.leadTrainerId),
        maxCapacity: parseInt(formData.maxCapacity),
      };

      if (isEditMode) {
        await cohortService.updateCohort(id, submitData);
      } else {
        await cohortService.createCohort(submitData);
      }

      navigate('/admin/cohorts');
    } catch (err) {
      console.error('Error saving cohort:', err);
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} cohort`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate('/admin/cohorts')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          {isEditMode ? 'Edit Cohort' : 'Create New Cohort'}
        </Typography>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cohort Code"
              name="cohortCode"
              value={formData.cohortCode}
              onChange={handleChange}
              error={Boolean(formErrors.cohortCode)}
              helperText={formErrors.cohortCode || 'e.g., COH-2024-001'}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cohort Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={Boolean(formErrors.name)}
              helperText={formErrors.name || 'e.g., January 2024 Batch'}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Course"
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              error={Boolean(formErrors.courseId)}
              helperText={formErrors.courseId || `${courses.length} course(s) available`}
              required
              disabled={courses.length === 0}
            >
              <MenuItem value="">Select a course</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.title || course.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Lead Trainer"
              name="leadTrainerId"
              value={formData.leadTrainerId}
              onChange={handleChange}
              error={Boolean(formErrors.leadTrainerId)}
              helperText={formErrors.leadTrainerId || `${trainers.length} trainer(s) available`}
              required
              disabled={trainers.length === 0}
            >
              <MenuItem value="">Select a trainer</MenuItem>
              {trainers.map((trainer) => (
                <MenuItem key={trainer.id} value={trainer.id}>
                  {trainer.firstName} {trainer.lastName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Dates */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
              Schedule
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Enrollment Deadline"
              name="enrollmentDeadline"
              value={formData.enrollmentDeadline}
              onChange={handleChange}
              error={Boolean(formErrors.enrollmentDeadline)}
              helperText={formErrors.enrollmentDeadline}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              error={Boolean(formErrors.startDate)}
              helperText={formErrors.startDate}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              error={Boolean(formErrors.endDate)}
              helperText={formErrors.endDate}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          {/* Capacity & Description */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
              Additional Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Maximum Capacity"
              name="maxCapacity"
              value={formData.maxCapacity}
              onChange={handleChange}
              error={Boolean(formErrors.maxCapacity)}
              helperText={formErrors.maxCapacity}
              inputProps={{ min: 1 }}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              helperText="Optional description of the cohort"
            />
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/admin/cohorts')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={submitting}
              >
                {submitting
                  ? isEditMode
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditMode
                  ? 'Update Cohort'
                  : 'Create Cohort'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default CohortForm;
