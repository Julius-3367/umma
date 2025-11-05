import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
  Container,
  Stack,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  TrophyIcon,
  DocumentIcon,
  BriefcaseIcon,
  QuestionMarkCircleIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  EyeIcon,
  PlayIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  ArrowTrendingUpIcon,
  ClockIcon as ClockSolid,
  ExclamationTriangleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/solid';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import candidateService from '../../api/candidate';

const CandidateDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);

  // Real candidate data
  const [candidateData, setCandidateData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data and recommended jobs in parallel
      const [dashboardData, jobsData] = await Promise.all([
        candidateService.getDashboardData(),
        candidateService.getRecommendedJobs()
      ]);

      // Mock additional data that's not yet in the API
      setCandidateData({
        profile: dashboardData.profile || {
          completionRate: 0,
          skillsAssessed: 0,
          certificationsEarned: 0,
          jobApplications: 0,
          interviewsScheduled: 0,
        },
        stats: dashboardData.stats || {},
        currentCourses: dashboardData.currentCourses || [],
        upcomingEvents: dashboardData.upcomingEvents || [],
        recommendedJobs: jobsData || [],
        // Keep mock data for features not yet in API
        oldCourses: [
          {
            id: 1,
            title: 'Construction Safety Training',
            progress: 78,
            nextSession: '2024-01-15',
            instructor: 'Ahmed Hassan',
            status: 'In Progress',
          },
          {
            id: 2,
            title: 'UAE Labor Law Basics',
            progress: 95,
            nextSession: '2024-01-12',
            instructor: 'Sarah Al-Mahmoud',
            status: 'Almost Complete',
          },
          {
            id: 3,
            title: 'English Communication',
            progress: 45,
            nextSession: '2024-01-18',
            instructor: 'John Smith',
            status: 'In Progress',
          },
        ],
        learningProgress: [
          { month: 'Jul', completed: 2, target: 3 },
          { month: 'Aug', completed: 3, target: 3 },
          { month: 'Sep', completed: 1, target: 2 },
          { month: 'Oct', completed: 4, target: 4 },
          { month: 'Nov', completed: 2, target: 3 },
          { month: 'Dec', completed: 3, target: 3 },
        ],
        skillsData: [
          { skill: 'Construction Safety', level: 85, color: theme.palette.success.main },
          { skill: 'English Communication', level: 65, color: theme.palette.info.main },
          { skill: 'Technical Skills', level: 70, color: theme.palette.warning.main },
          { skill: 'UAE Labor Law', level: 90, color: theme.palette.primary.main },
        ],
        notifications: [
          {
            id: 1,
            title: 'New job match found!',
            message: 'Construction Worker at Emirates Construction (92% match)',
            time: '2 hours ago',
            type: 'success',
            unread: true,
          },
          {
            id: 2,
            title: 'Course deadline reminder',
            message: 'Construction Safety Training exam is due in 3 days',
            time: '5 hours ago',
            type: 'warning',
            unread: true,
          },
          {
            id: 3,
            title: 'Interview confirmed',
            message: 'Your interview with Al-Futtaim Construction has been confirmed',
            time: '1 day ago',
            type: 'info',
            unread: false,
          },
        ],
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return theme.palette.info;
      case 'Almost Complete':
        return theme.palette.warning;
      case 'Completed':
        return theme.palette.success;
      default:
        return theme.palette.grey;
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'interview':
        return <UserIcon style={{ width: 20, height: 20 }} />;
      case 'assessment':
        return <DocumentTextIcon style={{ width: 20, height: 20 }} />;
      case 'exam':
        return <AcademicCapIcon style={{ width: 20, height: 20 }} />;
      default:
        return <CalendarIcon style={{ width: 20, height: 20 }} />;
    }
  };

  const handleJobView = (job) => {
    setSelectedJob(job);
    setJobDialogOpen(true);
  };

  const handleJobApply = async (jobId) => {
    try {
      setApplying(true);
      await candidateService.applyForJob(jobId, {
        coverLetter: 'I am interested in this position',
      });
      alert('Application submitted successfully!');
      setJobDialogOpen(false);
      // Refresh data
      fetchDashboardData();
    } catch (err) {
      console.error('Error applying for job:', err);
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress size={64} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchDashboardData}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!candidateData) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Welcome Section */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Grid container alignItems="center" spacing={3}>
          <Grid item>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                fontSize: '2rem',
                bgcolor: 'rgba(255,255,255,0.2)',
              }}
            >
              {user?.firstName?.charAt(0) || 'C'}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Welcome back, {user?.firstName || 'Candidate'}!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
              Continue your journey to career success in the UAE
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={`${candidateData.profile.completionRate}% Profile Complete`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
              <Chip
                label={`${candidateData.profile.certificationsEarned} Certificates Earned`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Progress Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.light,
                  color: theme.palette.primary.main,
                  mx: 'auto',
                  mb: 2,
                  width: 56,
                  height: 56,
                }}
              >
                <BookOpenIcon style={{ width: 28, height: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {candidateData.currentCourses.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <Avatar
                sx={{
                  bgcolor: theme.palette.success.light,
                  color: theme.palette.success.main,
                  mx: 'auto',
                  mb: 2,
                  width: 56,
                  height: 56,
                }}
              >
                <TrophyIcon style={{ width: 28, height: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {candidateData.profile.certificationsEarned}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Certificates Earned
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <Avatar
                sx={{
                  bgcolor: theme.palette.warning.light,
                  color: theme.palette.warning.main,
                  mx: 'auto',
                  mb: 2,
                  width: 56,
                  height: 56,
                }}
              >
                <BriefcaseIcon style={{ width: 28, height: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {candidateData.profile.jobApplications}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Job Applications
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <Avatar
                sx={{
                  bgcolor: theme.palette.info.light,
                  color: theme.palette.info.main,
                  mx: 'auto',
                  mb: 2,
                  width: 56,
                  height: 56,
                }}
              >
                <CalendarIcon style={{ width: 28, height: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {candidateData.profile.interviewsScheduled}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming Interviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Current Courses */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    My Courses
                  </Typography>
                  <Button variant="outlined" size="small" onClick={() => navigate('/candidate/courses')}>
                    View All
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  {candidateData.currentCourses.map((course) => (
                    <Grid item xs={12} md={6} key={course.id}>
                      <Paper
                        sx={{
                          p: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {course.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={course.status}
                            sx={{
                              bgcolor: getStatusColor(course.status).light,
                              color: getStatusColor(course.status).dark,
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Instructor: {course.instructor}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Progress</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {course.progress}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={course.progress}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: theme.palette.grey[200],
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getStatusColor(course.status).main,
                              },
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Next session: {course.nextSession}
                          </Typography>
                          <Button size="small" variant="text" onClick={() => navigate(`/candidate/courses/${course.id}`)}>
                            Continue
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Learning Progress Chart */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Learning Progress
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={candidateData.learningProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[200]} />
                    <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip />
                    <Bar
                      dataKey="completed"
                      fill={theme.palette.primary.main}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="target"
                      fill={theme.palette.grey[300]}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recommended Jobs */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recommended Jobs
                  </Typography>
                  <Button variant="outlined" size="small">
                    View All Jobs
                  </Button>
                </Box>
                <Stack spacing={2}>
                  {candidateData.recommendedJobs.map((job) => (
                    <Paper
                      key={job.id}
                      sx={{
                        p: 3,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          boxShadow: theme.shadows[4],
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {job.title}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            {job.company}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Chip
                              size="small"
                              icon={<MapPinIcon style={{ width: 14, height: 14 }} />}
                              label={job.location}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                              {job.salary}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={`${job.match}% match`}
                            sx={{
                              bgcolor: theme.palette.success.light,
                              color: theme.palette.success.dark,
                              fontWeight: 600,
                              mb: 1,
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {job.posted}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {job.requirements.slice(0, 2).map((req, index) => (
                            <Chip key={index} size="small" label={req} variant="outlined" />
                          ))}
                          {job.requirements.length > 2 && (
                            <Chip size="small" label={`+${job.requirements.length - 2} more`} variant="outlined" />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined" onClick={() => handleJobView(job)}>
                            View Details
                          </Button>
                          <Button 
                            size="small" 
                            variant="contained"
                            onClick={() => handleJobApply(job.id)}
                            disabled={applying}
                          >
                            {applying ? 'Applying...' : 'Apply Now'}
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Skills Progress */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Skills Development
                </Typography>
                <Stack spacing={2}>
                  {candidateData.skillsData.map((skill, index) => (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{skill.skill}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {skill.level}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={skill.level}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            bgcolor: skill.color,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Upcoming Events
                </Typography>
                <Stack spacing={2}>
                  {candidateData.upcomingEvents.map((event) => (
                    <Paper
                      key={event.id}
                      sx={{
                        p: 2,
                        bgcolor: theme.palette.grey[50],
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.primary.light,
                            color: theme.palette.primary.main,
                            width: 32,
                            height: 32,
                          }}
                        >
                          {getEventIcon(event.type)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {event.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {event.date} at {event.time}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            📍 {event.location}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
                <Button 
                  variant="text" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/candidate/calendar')}
                >
                  View Full Calendar
                </Button>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Notifications
                </Typography>
                <List sx={{ p: 0 }}>
                  {candidateData.notifications.slice(0, 3).map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Badge
                            color="primary"
                            variant="dot"
                            invisible={!notification.unread}
                          >
                            <Avatar
                              sx={{
                                bgcolor:
                                  notification.type === 'success' ? theme.palette.success.light :
                                  notification.type === 'warning' ? theme.palette.warning.light :
                                  theme.palette.info.light,
                                color:
                                  notification.type === 'success' ? theme.palette.success.main :
                                  notification.type === 'warning' ? theme.palette.warning.main :
                                  theme.palette.info.main,
                                width: 32,
                                height: 32,
                              }}
                            >
                              <BellIcon style={{ width: 16, height: 16 }} />
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {notification.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {notification.time}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < candidateData.notifications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
                <Button 
                  variant="text" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/candidate/notifications')}
                >
                  View All Notifications
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Job Details Dialog */}
      <Dialog
        open={jobDialogOpen}
        onClose={() => setJobDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {selectedJob.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {selectedJob.company}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Job Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Location</Typography>
                      <Typography variant="body1">{selectedJob.location}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Salary Range</Typography>
                      <Typography variant="body1">{selectedJob.salary}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Match Score</Typography>
                      <Typography variant="body1">{selectedJob.match}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Posted</Typography>
                      <Typography variant="body1">{selectedJob.posted}</Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Requirements
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedJob.requirements.map((req, index) => (
                      <Chip key={index} label={req} variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setJobDialogOpen(false)}>
                Close
              </Button>
              <Button 
                variant="contained"
                onClick={() => handleJobApply(selectedJob.id)}
                disabled={applying}
              >
                {applying ? 'Applying...' : 'Apply for this Job'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default CandidateDashboard;
