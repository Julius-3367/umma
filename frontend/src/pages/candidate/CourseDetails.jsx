import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  CalendarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import candidateService from '../../api/candidate';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-tabpanel-${index}`}
      aria-labelledby={`course-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CourseDetails = () => {
  const theme = useTheme();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await candidateService.getCourseDetails(courseId);
      setCourseData(data);
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError(err.response?.data?.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <CircularProgress size={64} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowLeftIcon style={{ width: 20, height: 20 }} />}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!courseData) {
    return null;
  }

  const { course, enrollment, assessments, attendance } = courseData;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Button
        onClick={() => navigate('/candidate/courses')}
        startIcon={<ArrowLeftIcon style={{ width: 20, height: 20 }} />}
        sx={{ mb: 3 }}
      >
        Back to Courses
      </Button>

      <Paper sx={{ p: 4, mb: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, color: 'white' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              {course.title}
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
              {course.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={enrollment.status}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
              <Chip
                label={`${enrollment.progress || 0}% Complete`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '2rem',
                  }}
                >
                  {course.trainer?.firstName?.[0] || 'T'}
                </Avatar>
                <Typography variant="h6">{course.trainer ? `${course.trainer.firstName} ${course.trainer.lastName}` : 'TBA'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Instructor
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Progress Bar */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">Course Progress</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {enrollment.progress || 0}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={enrollment.progress || 0}
            sx={{ height: 12, borderRadius: 6 }}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Overview" />
          <Tab label="Assessments" />
          <Tab label="Attendance" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Course Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon style={{ width: 24, height: 24 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Start Date"
                      secondary={course.startDate ? new Date(course.startDate).toLocaleDateString() : 'TBA'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon style={{ width: 24, height: 24 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="End Date"
                      secondary={course.endDate ? new Date(course.endDate).toLocaleDateString() : 'TBA'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ClockIcon style={{ width: 24, height: 24 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Duration"
                      secondary={course.duration || 'Not specified'}
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Your Progress
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Enrolled On"
                      secondary={new Date(enrollment.enrolledAt).toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={enrollment.status}
                    />
                  </ListItem>
                  {enrollment.completedAt && (
                    <ListItem>
                      <ListItemText
                        primary="Completed On"
                        secondary={new Date(enrollment.completedAt).toLocaleDateString()}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Assessments & Exams
            </Typography>
            {assessments && assessments.length > 0 ? (
              <List>
                {assessments.map((assessment, index) => (
                  <React.Fragment key={assessment.id}>
                    <ListItem sx={{ py: 2 }}>
                      <ListItemIcon>
                        <AcademicCapIcon style={{ width: 32, height: 32, color: theme.palette.primary.main }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="h6">{assessment.title}</Typography>}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {assessment.description || 'No description'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Scheduled: {assessment.scheduledDate ? new Date(assessment.scheduledDate).toLocaleString() : 'TBA'}
                            </Typography>
                          </>
                        }
                      />
                      <Chip
                        label={assessment.type || 'Assessment'}
                        color="primary"
                        variant="outlined"
                      />
                    </ListItem>
                    {index < assessments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Alert severity="info">No assessments scheduled yet</Alert>
            )}
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Attendance Record
            </Typography>
            {attendance && attendance.length > 0 ? (
              <List>
                {attendance.map((record, index) => (
                  <React.Fragment key={record.id}>
                    <ListItem sx={{ py: 2 }}>
                      <ListItemIcon>
                        {record.status === 'PRESENT' ? (
                          <CheckCircleIcon style={{ width: 28, height: 28, color: theme.palette.success.main }} />
                        ) : (
                          <ClockIcon style={{ width: 28, height: 28, color: theme.palette.error.main }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={new Date(record.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                        secondary={record.remarks || 'No remarks'}
                      />
                      <Chip
                        label={record.status}
                        color={record.status === 'PRESENT' ? 'success' : record.status === 'LATE' ? 'warning' : 'error'}
                        size="small"
                      />
                    </ListItem>
                    {index < attendance.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Alert severity="info">No attendance records yet</Alert>
            )}
          </CardContent>
        </TabPanel>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayIcon style={{ width: 20, height: 20 }} />}
          disabled={enrollment.status === 'COMPLETED'}
        >
          Continue Learning
        </Button>
        <Button variant="outlined" size="large">
          Download Certificate
        </Button>
      </Box>
    </Container>
  );
};

export default CourseDetails;
