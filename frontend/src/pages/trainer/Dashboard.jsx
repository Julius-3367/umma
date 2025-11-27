import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import {
  Event,
  Group,
  PendingActions,
  Refresh,
  School,
  TaskAlt,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import trainerService from '../../api/trainer';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const statusColorMap = {
  ACTIVE: 'success',
  COMPLETED: 'primary',
  SCHEDULED: 'warning',
};

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const user = useSelector((state) => state.auth.user);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      const response = await trainerService.getDashboard();
      setDashboardData(response?.data?.data || null);
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to load trainer dashboard';
      console.error(message, err);
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => dashboardData?.stats || {}, [dashboardData?.stats]);
  const courses = useMemo(() => (dashboardData?.courses || []).slice(0, 5), [dashboardData]);
  const enrollments = dashboardData?.recentEnrollments || [];
  const assessments = dashboardData?.upcomingAssessments || [];

  const statCards = useMemo(
    () => [
      {
        label: 'Active Courses',
        value: stats.totalCourses ?? 0,
        helper: 'Assigned to you',
        icon: <School fontSize="small" />,
      },
      {
        label: 'Total Students',
        value: stats.totalStudents ?? 0,
        helper: 'Unique enrollments',
        icon: <Group fontSize="small" />,
      },
      {
        label: 'Completion Rate',
        value: stats.completionRate ? `${stats.completionRate}%` : '0%',
        helper: 'Completed vs enrolled',
        icon: <TrendingUp fontSize="small" />,
      },
      {
        label: 'Pending Assessments',
        value: stats.pendingAssessments ?? 0,
        helper: 'Awaiting grading',
        icon: <PendingActions fontSize="small" />,
      },
      {
        label: 'Attendance Today',
        value: stats.todayAttendance ?? 0,
        helper: 'Sessions recorded',
        icon: <TaskAlt fontSize="small" />,
      },
    ],
    [stats]
  );

  const handleRefresh = () => {
    if (!loading) {
      loadDashboard(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={64} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Trainer Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Track cohorts, assessments, and attendance in one place.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button variant="contained" startIcon={<Event />} onClick={() => navigate('/trainer/attendance')}>
            Record Attendance
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                    {card.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {card.helper}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6">Course Snapshot</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Focused view of the next five courses assigned to you
                  </Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/trainer/my-courses')}>
                  View all
                </Button>
              </Stack>

              {!courses.length ? (
                <Alert severity="info">No active courses found for your account.</Alert>
              ) : (
                <Box>
                  {courses.map((course, index) => (
                    <Box key={course.id || index} sx={{ pb: index !== courses.length - 1 ? 2 : 0 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {course.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {course.code || 'No course code'}
                          </Typography>
                        </Box>
                        <Chip
                          label={course.status || 'UNSPECIFIED'}
                          color={statusColorMap[(course.status || '').toUpperCase()] || 'default'}
                          size="small"
                        />
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Schedule: {formatDate(course.startDate)} – {formatDate(course.endDate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Location: {course.location || 'TBD'}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => course.id && navigate(`/trainer/courses/${course.id}/students`)}
                        >
                          View students
                        </Button>
                        <Button
                          size="small"
                          onClick={() => course.id && navigate(`/trainer/courses/${course.id}/attendance`)}
                        >
                          Attendance history
                        </Button>
                      </Stack>

                      {index !== courses.length - 1 && <Divider sx={{ my: 2 }} />}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Quick actions
                </Typography>
                <Stack spacing={1.5}>
                  <Button variant="contained" onClick={() => navigate('/trainer/students')}>
                    Manage students
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/trainer/assessments')}>
                    Grade assessments
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/trainer/schedule')}>
                    View schedule
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h6">Upcoming assessments</Typography>
                  <Chip label={assessments.length} size="small" color="primary" />
                </Stack>
                {!assessments.length ? (
                  <Alert severity="info">No assessments scheduled.</Alert>
                ) : (
                  <List dense>
                    {assessments.map((assessment) => (
                      <ListItem key={assessment.id} disableGutters>
                        <ListItemAvatar>
                          <Avatar>
                            <PendingActions />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={assessment.course?.title || 'Course'}
                          secondary={`Due ${formatDateTime(assessment.date)}${assessment.enrollment?.candidate?.fullName ? ` • ${assessment.enrollment.candidate.fullName}` : ''}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">Recent enrollments</Typography>
                <Chip label={enrollments.length} size="small" />
              </Stack>
              {!enrollments.length ? (
                <Alert severity="info">No recent enrollments for your courses.</Alert>
              ) : (
                <List>
                  {enrollments.map((enrollment) => {
                    const initials = enrollment.candidate?.fullName
                      ? enrollment.candidate.fullName
                          .split(' ')
                          .map((namePart) => namePart.charAt(0))
                          .join('')
                          .slice(0, 2)
                      : 'C';

                    return (
                      <ListItem key={enrollment.id} divider>
                        <ListItemAvatar>
                          <Avatar>{initials}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={enrollment.candidate?.fullName || 'Candidate'}
                          secondary={
                            enrollment.course
                              ? `${enrollment.course.title}${enrollment.course.code ? ` • ${enrollment.course.code}` : ''}`
                              : 'Course not available'
                          }
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(enrollment.createdAt)}
                        </Typography>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Attendance at a glance
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Keep an eye on sessions you have logged today and outstanding actions.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.todayAttendance ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sessions recorded today
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.pendingAssessments ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assessments awaiting review
                  </Typography>
                </Box>
              </Stack>
              <Button sx={{ mt: 2 }} onClick={() => navigate('/trainer/attendance')}>
                Go to attendance workspace
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrainerDashboard;
