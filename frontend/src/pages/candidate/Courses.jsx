import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import candidateService from '../../api/candidate';

const Courses = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await candidateService.getMyCourses();
      setCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ENROLLED':
        return theme.palette.info;
      case 'COMPLETED':
        return theme.palette.success;
      case 'WITHDRAWN':
        return theme.palette.error;
      default:
        return theme.palette.grey;
    }
  };

  const getStatusLabel = (status, progress) => {
    if (status === 'COMPLETED') return 'Completed';
    if (progress > 80) return 'Almost Complete';
    if (progress > 0) return 'In Progress';
    return 'Not Started';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <CircularProgress size={64} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          My Courses
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Track your learning progress and continue where you left off
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Courses Grid */}
      {courses.length > 0 ? (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <BookOpenIcon
                      style={{
                        width: 40,
                        height: 40,
                        color: theme.palette.primary.main,
                      }}
                    />
                    <Chip
                      size="small"
                      label={getStatusLabel(course.status, course.progress)}
                      sx={{
                        bgcolor: getStatusColor(course.status).light,
                        color: getStatusColor(course.status).dark,
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    {course.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {course.description || 'No description available'}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {course.progress || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={course.progress || 0}
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

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ClockIcon style={{ width: 16, height: 16 }} />
                      <Typography variant="caption" color="text.secondary">
                        Enrolled: {new Date(course.enrolledAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Instructor: {course.instructor}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate(`/candidate/courses/${course.id}`)}
                    startIcon={course.status === 'COMPLETED' ? 
                      <CheckCircleIcon style={{ width: 20, height: 20 }} /> : 
                      <PlayIcon style={{ width: 20, height: 20 }} />
                    }
                  >
                    {course.status === 'COMPLETED' ? 'View Course' : 'Continue Learning'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BookOpenIcon style={{ width: 64, height: 64, color: theme.palette.grey[400], margin: '0 auto 16px' }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No courses enrolled yet
          </Typography>
          <Button variant="contained" onClick={() => navigate('/candidate/dashboard')}>
            Back to Dashboard
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default Courses;
