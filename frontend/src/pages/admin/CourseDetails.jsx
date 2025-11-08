import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { adminService } from '../../api/admin';

const AdminCourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await adminService.getCourseById(courseId);
      const data = resp.data?.data?.course || resp.data?.data || resp.data;
      setCourse(data);
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!course) return;
    try {
      setActionLoading(true);
      const resp = await adminService.updateCourse(course.id, { status: 'ACTIVE' });
      if (resp.data.success) {
        setCourse((c) => ({ ...c, status: 'ACTIVE' }));
        enqueueSnackbar('Course published', { variant: 'success' });
      }
    } catch (err) {
      console.error('Publish error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to publish', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!course) return;
    try {
      setActionLoading(true);
      const resp = await adminService.deleteCourse(course.id);
      if (resp.status === 200 || resp.data?.success) {
        enqueueSnackbar('Course deleted', { variant: 'success' });
        navigate('/admin/courses');
      } else {
        enqueueSnackbar('Failed to delete course', { variant: 'error' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete course', { variant: 'error' });
    } finally {
      setActionLoading(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/admin/courses')}>Back to Courses</Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>{course.title}</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>Edit</Button>
          {course.status === 'DRAFT' && (
            <Button variant="contained" color="primary" onClick={handlePublish} disabled={actionLoading}>
              {actionLoading ? 'Publishing...' : 'Publish'}
            </Button>
          )}
          <Button variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </Stack>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6">Description</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>{course.description || 'No description provided'}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2"><strong>Category:</strong> {course.category || '-'}</Typography>
              <Typography variant="body2"><strong>Duration:</strong> {course.duration || '-'} {course.durationUnit || ''}</Typography>
              <Typography variant="body2"><strong>Capacity:</strong> {course.maxCapacity || 'Unlimited'}</Typography>
              <Typography variant="body2"><strong>Fee:</strong> {course.currency || 'KES'} {course.courseFee ?? '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2"><strong>Status:</strong> <Chip label={course.status} sx={{ ml: 1 }} /></Typography>
              <Typography variant="body2" sx={{ mt: 2 }}><strong>Start Date:</strong> {course.startDate ? new Date(course.startDate).toLocaleDateString() : 'TBA'}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}><strong>End Date:</strong> {course.endDate ? new Date(course.endDate).toLocaleDateString() : 'TBA'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete this course? This action cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCourseDetails;
