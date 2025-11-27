import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Grid, Chip, Button, CircularProgress, Box } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { useSnackbar } from 'notistack';
import trainerService from '../../api/trainer';

const MyCourses = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await trainerService.getMyCourses();
        setCourses(response?.data?.data || []);
      } catch (error) {
        enqueueSnackbar('Failed to load courses', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [enqueueSnackbar]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>My Courses</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {courses.length === 0 ? (
            <Typography variant="body1" color="textSecondary">No courses assigned.</Typography>
          ) : (
            courses.map(course => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <Card elevation={3}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <SchoolIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">{course.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">Code: {course.code}</Typography>
                    <Typography variant="body2" color="textSecondary">Start: {course.startDate?.slice(0, 10)}</Typography>
                    <Typography variant="body2" color="textSecondary">End: {course.endDate?.slice(0, 10)}</Typography>
                    <Typography variant="body2" color="textSecondary">Capacity: {course.capacity}</Typography>
                    <Chip label={course.status} color={course.status === 'ACTIVE' ? 'success' : 'default'} size="small" sx={{ mt: 1 }} />
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button variant="outlined" size="small" onClick={() => navigate(`/trainer/courses/${course.id}/students`)}>View Students</Button>
                      <Button variant="outlined" size="small" onClick={() => navigate(`/trainer/courses/${course.id}/attendance`)}>Attendance</Button>
                      <Button variant="outlined" size="small" onClick={() => navigate(`/trainer/courses/${course.id}/assessments`)}>Assessments</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default MyCourses;
