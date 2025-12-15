import React, { useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  Alert,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Paper,
  Avatar,
  Chip,
  Divider,
  alpha,
  Stack,
} from '@mui/material';
import {
  School as CourseIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as TrophyIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Work as WorkIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  BookmarkBorder as BookmarkIcon,
  LocalLibrary as LibraryIcon,
  Groups,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useDashboard from '../../hooks/useDashboard';
import candidateService from '../../api/candidate';
import { format } from 'date-fns';

const CandidateDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Memoize the fetch function to prevent infinite loops
  const fetchDashboardData = useCallback(async () => {
    console.log('🔄 Fetching dashboard data...');

    const dashData = await candidateService.getDashboardData();
    const coursesData = await candidateService.getMyCourses();

    console.log('✅ Dashboard data received:', dashData);
    console.log('✅ Courses data received:', coursesData);

    // Ensure we return a proper object with courses array
    const result = {
      profile: dashData?.profile || {},
      stats: dashData?.stats || {},
      currentCourses: dashData?.currentCourses || [],
      upcomingEvents: dashData?.upcomingEvents || [],
      journeyStage: dashData?.journeyStage,
      completedStages: dashData?.completedStages || [],
      stageDates: dashData?.stageDates || {},
      stageProgress: dashData?.stageProgress || {},
      courses: Array.isArray(coursesData) ? coursesData : []
    };

    console.log('🔀 Merged result:', result);
    console.log('🔀 Merged result.courses:', result.courses);
    console.log('🔀 Merged result.courses length:', result.courses?.length);
    return result;
  }, []);

  const { data, loading, error, lastUpdated, refresh } = useDashboard(
    fetchDashboardData,
    { refreshInterval: 0, autoRefresh: false }
  );

  // Debug: log when data changes
  useEffect(() => {
    console.log('🔔 Data changed! New data:', data);
    console.log('🔔 Data.courses:', data?.courses);
    console.log('🔔 Data.courses.length:', data?.courses?.length);
  }, [data]);

  console.log('⚡ useDashboard state:', { loading, hasData: !!data, hasError: !!error });
  console.log('⚡ useDashboard data:', data);

  const profile = data?.profile || {};
  const backendStats = data?.stats || {};
  const currentCourses = data?.currentCourses || [];
  const courses = data?.courses || [];
  const upcomingEvents = data?.upcomingEvents || [];
  const myCohorts = data?.myCohorts || [];
  const availableCohorts = data?.availableCohorts || [];
  const profileCompletion = profile.completionRate || 0;
  
  console.log('👤 Profile data:', profile);
  console.log('👤 Profile.user:', profile.user);
  console.log('👤 First name from user:', profile.user?.firstName);
  console.log('👤 First name direct:', profile.firstName);
  
  console.log('📚 Dashboard courses data:', { 
    coursesCount: courses.length, 
    courses: courses.map(c => ({ title: c.title, status: c.enrollmentStatus || c.status })),
    backendStats,
  });  // Debug: Log courses data
  console.log('📚 Dashboard data state:', {
    loading,
    error: error?.message,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    coursesCount: courses.length,
    courses,
    rawData: data
  });

  // Memoize stats calculations
  const statsCalculated = useMemo(() => {
    const enrolledCourses = courses.length;
    const completedCourses = courses.filter(c => {
      const status = c.status || c.enrollmentStatus;
      return status === 'COMPLETED';
    }).length;
    const activeEnrolledCourses = courses.filter(c => {
      const status = c.status || c.enrollmentStatus;
      return status === 'ENROLLED';
    }).length;
    const avgAttendanceRate = courses.length > 0
      ? Math.round(courses.reduce((sum, c) => sum + (c.attendanceRate || 0), 0) / courses.length)
      : 0;

    console.log('📊 Stats calculated:', { enrolledCourses, completedCourses, activeEnrolledCourses, avgAttendanceRate });

    return {
      enrolledCourses,
      completedCourses,
      activeEnrolledCourses,
      avgAttendanceRate,
    };
  }, [courses]);

  // Memoize journey tracker data
  const journeyData = useMemo(() => ({
    currentStage: data?.journeyStage || 'registration',
    completedStages: data?.completedStages || [],
    stageDates: data?.stageDates || {},
    stageProgress: data?.stageProgress || {
      registration: profileCompletion,
      training: statsCalculated.completedCourses > 0 ? Math.min((statsCalculated.completedCourses / 3) * 100, 100) : 0,
      assessment: backendStats.assessmentsPassed || 0,
      vetting: profile.isVerified ? 100 : 0,
      job_matching: backendStats.jobApplications || 0,
      placed: backendStats.isPlaced ? 100 : 0,
    },
  }), [data, profileCompletion, statsCalculated, backendStats, profile]);

  // Memoize active courses
  const activeCourses = useMemo(() => {
    console.log('🔍 Filtering active courses from:', courses);
    console.log('🔍 Total courses available:', courses.length);

    // Filter for ENROLLED courses only - check 'status' field first (backend returns this)
    const filtered = courses.filter(c => {
      const status = c.status || c.enrollmentStatus;
      console.log('📚 Course:', c.title, 'status:', c.status, 'enrollmentStatus:', c.enrollmentStatus);
      return status === 'ENROLLED';
    });

    console.log('✅ Filtered ENROLLED courses:', filtered.length);

    const mapped = filtered.map(course => ({
      id: course.courseId || course.id,
      enrollmentId: course.id,
      title: course.title || 'Untitled Course',
      progress: course.progress || 0,
      instructor: course.trainer || course.instructor || 'TBA',
      status: course.progress >= 80 ? 'Almost Complete' : 'In Progress',
      nextSession: course.startDate || new Date().toISOString(),
      attendanceRate: course.attendanceRate || 0,
    }));

    console.log('✅ Active courses mapped:', mapped);
    return mapped;
  }, [courses]);

  // Memoize formatted events
  const formattedEvents = useMemo(() => upcomingEvents.map(event => ({
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location || 'Online',
    type: event.type,
  })), [upcomingEvents]);

  // Memoize recent activity
  const recentActivity = useMemo(() => currentCourses.slice(0, 5).map(course => ({
    id: `course-${course.id}`,
    type: 'enrollment',
    title: `Enrolled in ${course.title}`,
    description: `Progress: ${course.progress}%`,
    timestamp: new Date(course.nextSession).toISOString(),
    status: course.status,
  })), [currentCourses]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleStageClick = useCallback((stage, status) => {
    console.log('Clicked stage:', stage.label, status);
    if (stage.id === 'registration') navigate('/candidate/profile');
    else if (stage.id === 'training') navigate('/candidate/courses');
    else if (stage.id === 'assessment') navigate('/candidate/assessments');
    else if (stage.id === 'vetting') navigate('/candidate/documents');
    else if (stage.id === 'job_matching') navigate('/candidate/jobs');
  }, [navigate]);

  const handleCourseClick = useCallback((course) => {
    navigate(`/candidate/courses/${course.id}`);
  }, [navigate]);

  const handleEventClick = useCallback((event) => {
    if (event.type === 'assessment') navigate('/candidate/assessments');
  }, [navigate]);

  const handleProfileClick = useCallback(() => {
    navigate('/candidate/profile');
  }, [navigate]);

  const handleQuickAction = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  // Modern stat card component
  const ModernStatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={700} color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            <Icon sx={{ fontSize: 28 }} />
          </Avatar>
        </Box>
        {trend && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="caption" color="success.main" fontWeight={600}>
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Modern course card component
  const CourseCard = ({ course }) => (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          borderColor: 'primary.main',
        }
      }}
      onClick={() => handleCourseClick(course)}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {course.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {course.instructor}
            </Typography>
            <Chip
              label={course.status}
              size="small"
              color={course.progress >= 80 ? 'success' : 'primary'}
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <LibraryIcon />
          </Avatar>
        </Box>
        <Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {course.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={course.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha('#2196F3', 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #2196F3 0%, #1976D2 100%)',
              }
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load dashboard data. {error.message}
          <Button onClick={refresh} size="small" sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Header Section */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back, {profile?.firstName || 'Candidate'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your training journey today
        </Typography>
      </Box>

      {/* Profile Completion Alert */}
      {profileCompletion < 100 && (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleProfileClick} variant="outlined">
              Complete Now
            </Button>
          }
        >
          <Box>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Complete Your Profile ({profileCompletion}%)
            </Typography>
            <LinearProgress
              variant="determinate"
              value={profileCompletion}
              sx={{
                height: 6,
                borderRadius: 3,
                mb: 1,
                bgcolor: alpha('#0288d1', 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                }
              }}
            />
            <Typography variant="caption" color="text.secondary">
              A complete profile helps us match you with better opportunities
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {loading && !data ? (
          // Loading skeleton
          [1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ height: '100%', p: 3 }}>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.disabled">Loading...</Typography>
                    <Typography variant="h3" color="text.disabled">--</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'grey.200', width: 56, height: 56 }} />
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <ModernStatCard
                title="Enrolled Courses"
                value={statsCalculated.enrolledCourses}
                subtitle={`${statsCalculated.activeEnrolledCourses} active now`}
                icon={CourseIcon}
                color="#2196F3"
                trend={statsCalculated.activeEnrolledCourses > 0 ? '+12% this month' : null}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ModernStatCard
                title="My Cohorts"
                value={backendStats.activeCohorts || 0}
                subtitle={`${backendStats.pendingCohortApplications || 0} pending approval`}
                icon={Groups}
                color="#2196F3"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ModernStatCard
                title="Completed"
                value={statsCalculated.completedCourses}
                subtitle={`${backendStats.completedCohorts || 0} cohorts finished`}
                icon={CheckCircleIcon}
                color="#4CAF50"
                trend={statsCalculated.completedCourses > 0 ? '+2 this month' : null}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ModernStatCard
                title="Certificates"
                value={backendStats.certificates || 0}
                subtitle="Earned so far"
                icon={TrophyIcon}
                color="#FF9800"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* New Cohorts Available Alert */}
      {availableCohorts && availableCohorts.length > 0 && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'success.main',
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => handleQuickAction('/candidate/browse-cohorts')}
              endIcon={<ArrowForwardIcon />}
            >
              Browse All
            </Button>
          }
        >
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            🎉 New Training Cohorts Available!
          </Typography>
          <Typography variant="body2">
            {availableCohorts.length} new cohort{availableCohorts.length !== 1 && 's'} ready for enrollment. 
            Apply now to secure your spot before {' '}
            {availableCohorts[0]?.enrollmentDeadline && 
              format(new Date(availableCohorts[0].enrollmentDeadline), 'MMM dd, yyyy')}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Active Courses Section */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  My Active Courses
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Continue where you left off
                </Typography>
              </Box>
              <Button
                endIcon={<ArrowForwardIcon />}
                onClick={() => handleQuickAction('/candidate/courses')}
              >
                View All
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <Typography color="text.secondary">Loading courses...</Typography>
              </Box>
            ) : activeCourses.length === 0 ? (
              <Box textAlign="center" py={6}>
                <BookmarkIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Active Courses
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Explore available courses and start your learning journey
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CourseIcon />}
                  onClick={() => handleQuickAction('/candidate/courses')}
                >
                  Browse Courses
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {activeCourses.slice(0, 3).map(course => (
                  <Grid item xs={12} key={course.id}>
                    <CourseCard course={course} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions & Upcoming */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Quick Actions */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Navigate to key areas
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Groups />}
                  onClick={() => handleQuickAction('/candidate/browse-cohorts')}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.5,
                    borderColor: alpha('#9C27B0', 0.3),
                    '&:hover': {
                      borderColor: '#9C27B0',
                      bgcolor: alpha('#9C27B0', 0.05),
                    }
                  }}
                >
                  Browse Cohorts
                  {availableCohorts && availableCohorts.length > 0 && (
                    <Chip
                      label={availableCohorts.length}
                      size="small"
                      color="error"
                      sx={{ ml: 'auto', height: 20, minWidth: 20 }}
                    />
                  )}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => handleQuickAction('/candidate/my-applications')}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.5,
                    borderColor: alpha('#3F51B5', 0.3),
                    '&:hover': {
                      borderColor: '#3F51B5',
                      bgcolor: alpha('#3F51B5', 0.05),
                    }
                  }}
                >
                  My Applications
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CourseIcon />}
                  onClick={() => handleQuickAction('/candidate/courses')}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.5,
                    borderColor: alpha('#2196F3', 0.3),
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: alpha('#2196F3', 0.05),
                    }
                  }}
                >
                  My Courses
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => handleQuickAction('/candidate/assessments')}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.5,
                    borderColor: alpha('#FF9800', 0.3),
                    '&:hover': {
                      borderColor: '#FF9800',
                      bgcolor: alpha('#FF9800', 0.05),
                    }
                  }}
                >
                  Assessments
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TrophyIcon />}
                  onClick={() => handleQuickAction('/candidate/certificates')}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.5,
                    borderColor: alpha('#4CAF50', 0.3),
                    '&:hover': {
                      borderColor: '#4CAF50',
                      bgcolor: alpha('#4CAF50', 0.05),
                    }
                  }}
                >
                  Documents
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CalendarIcon />}
                  onClick={() => handleQuickAction('/candidate/attendance')}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.5,
                    borderColor: alpha('#9C27B0', 0.3),
                    '&:hover': {
                      borderColor: '#9C27B0',
                      bgcolor: alpha('#9C27B0', 0.05),
                    }
                  }}
                >
                  Attendance
                </Button>
              </Stack>
            </Paper>

            {/* Upcoming Events */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Upcoming Events
              </Typography>
              {formattedEvents.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <ScheduleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No upcoming events
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2} mt={2}>
                  {formattedEvents.slice(0, 3).map(event => (
                    <Box
                      key={event.id}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: alpha('#2196F3', 0.05),
                        border: '1px solid',
                        borderColor: alpha('#2196F3', 0.2),
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        {event.title}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {event.date} • {event.time}
                        </Typography>
                      </Box>
                      {event.location && (
                        <Typography variant="caption" color="text.secondary">
                          📍 {event.location}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Grid>

        {/* My Cohorts Section */}
        {myCohorts.length > 0 && (
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignments="center" mb={3}>
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    My Cohorts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your enrolled cohort programs
                  </Typography>
                </Box>
                <Button
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => handleQuickAction('/candidate/cohorts')}
                >
                  View All
                </Button>
              </Box>
              <Stack spacing={2}>
                {myCohorts.slice(0, 3).map(cohort => (
                  <Card
                    key={cohort.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 2,
                      }
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {cohort.cohortName}
                        </Typography>
                        <Chip
                          label={cohort.status}
                          size="small"
                          color={cohort.status === 'ENROLLED' ? 'success' : cohort.status === 'APPLIED' ? 'warning' : 'default'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {cohort.course.title} • {cohort.cohortCode}
                      </Typography>
                      <Box display="flex" gap={2} mt={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Trainer
                          </Typography>
                          <Typography variant="body2">
                            {cohort.leadTrainer.firstName} {cohort.leadTrainer.lastName}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            {cohort.progress || 0}%
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Paper>
          </Grid>
        )}

        {/* Available Cohorts Section */}
        {availableCohorts.length > 0 && (
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Available Cohorts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open for enrollment
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={2}>
                {availableCohorts.slice(0, 2).map(cohort => (
                  <Card
                    key={cohort.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'success.main',
                        boxShadow: 2,
                      }
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {cohort.cohortName}
                        </Typography>
                        <Chip
                          label={`${cohort.spotsLeft} spots left`}
                          size="small"
                          color={cohort.spotsLeft < 5 ? 'error' : 'success'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {cohort.course.title}
                      </Typography>
                      <Box display="flex" gap={2} mt={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Start Date
                          </Typography>
                          <Typography variant="body2">
                            {format(new Date(cohort.startDate), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Deadline
                          </Typography>
                          <Typography variant="body2" color="error.main">
                            {format(new Date(cohort.enrollmentDeadline), 'MMM dd')}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={async () => {
                          try {
                            await candidateService.applyForCohort(cohort.id);
                            refresh();
                          } catch (err) {
                            console.error('Apply error:', err);
                          }
                        }}
                      >
                        Apply Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CandidateDashboard;
