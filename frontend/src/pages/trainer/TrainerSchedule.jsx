import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
  Stack,
  Button,
} from '@mui/material';
import {
  Event as EventIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import trainerService from '../../api/trainer';

const timeFilterOptions = ['upcoming', 'all', 'past'];

const TrainerSchedule = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await trainerService.getMyCourses();
        setCourses(response?.data?.data || []);
      } catch (error) {
        console.error('Failed to load schedule', error);
        enqueueSnackbar('Unable to load schedule data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [enqueueSnackbar]);

  const scheduleEvents = useMemo(() => {
    const items = courses.flatMap((course) => {
      const start = course.startDate ? new Date(course.startDate) : null;
      const end = course.endDate ? new Date(course.endDate) : null;

      return [
        start && {
          id: `${course.id}-kickoff`,
          type: 'Kickoff',
          date: start,
          course,
          description: 'Course kickoff and onboarding',
        },
        end && {
          id: `${course.id}-completion`,
          type: 'Completion',
          date: end,
          course,
          description: 'Final session and certification prep',
        },
      ].filter(Boolean);
    });

    return items.sort((a, b) => a.date - b.date);
  }, [courses]);

  const filteredEvents = useMemo(() => {
    if (timeFilter === 'all') {
      return scheduleEvents;
    }

    const now = new Date();
    return scheduleEvents.filter((event) => {
      return timeFilter === 'upcoming' ? event.date >= now : event.date < now;
    });
  }, [scheduleEvents, timeFilter]);

  const nextEvent = filteredEvents.find(() => true);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!courses.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">You have no scheduled courses at the moment.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Schedule</Typography>
          <Typography variant="body2" color="text.secondary">
            Track upcoming sessions, deadlines, and major milestones for your courses
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={timeFilter}
          exclusive
          onChange={(event, value) => value && setTimeFilter(value)}
          size="small"
        >
          {timeFilterOptions.map((option) => (
            <ToggleButton key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {nextEvent && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="overline" color="primary">Next Milestone</Typography>
                <Typography variant="h5">{nextEvent.course.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {nextEvent.type} • {nextEvent.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{nextEvent.description}</Typography>
              </Box>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(`/trainer/courses/${nextEvent.course.id}/attendance`)}
              >
                Open Course
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        {filteredEvents.map((event) => (
          <Grid item xs={12} md={6} lg={4} key={event.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EventIcon color="action" />
                  <Typography variant="subtitle1">{event.course.title}</Typography>
                </Box>
                <Typography variant="h6">{event.type}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.date.toLocaleString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{event.description}</Typography>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip icon={<ScheduleIcon />} label={`Duration: ${event.course.duration || 'N/A'}`} variant="outlined" />
                  <Chip icon={<CalendarIcon />} label={`Start ${event.course.startDate ? new Date(event.course.startDate).toLocaleDateString() : 'TBD'}`} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Course Overview</Typography>
        <Grid container spacing={2}>
          {courses.map((course) => (
            <Grid item xs={12} md={6} key={course.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1">{course.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {course.location || 'Virtual / TBD'}
                      </Typography>
                    </Box>
                    <Chip label={course.mode || 'Instructor Led'} color="primary" variant="outlined" />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      Start: {course.startDate ? new Date(course.startDate).toLocaleDateString() : 'TBD'}
                    </Typography>
                    <Typography variant="body2">
                      End: {course.endDate ? new Date(course.endDate).toLocaleDateString() : 'TBD'}
                    </Typography>
                    <Typography variant="body2">
                      Enrolled Students: {course._count?.enrollments ?? '—'}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default TrainerSchedule;
