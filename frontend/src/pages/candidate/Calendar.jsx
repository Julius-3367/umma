import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  AcademicCapIcon,
  UserIcon,
  BriefcaseIcon,
  ArrowLeftIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import candidateService from '../../api/candidate';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Calendar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await candidateService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'interview':
        return <UserIcon style={{ width: 24, height: 24 }} />;
      case 'assessment':
        return <AcademicCapIcon style={{ width: 24, height: 24 }} />;
      case 'exam':
        return <AcademicCapIcon style={{ width: 24, height: 24 }} />;
      case 'training':
        return <BriefcaseIcon style={{ width: 24, height: 24 }} />;
      default:
        return <CalendarIcon style={{ width: 24, height: 24 }} />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'interview':
        return theme.palette.success;
      case 'assessment':
        return theme.palette.info;
      case 'exam':
        return theme.palette.warning;
      case 'training':
        return theme.palette.primary;
      default:
        return theme.palette.grey;
    }
  };

  const groupEventsByDate = (events) => {
    const grouped = {};
    events?.forEach((event) => {
      const date = event.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    return grouped;
  };

  const filterEventsByType = (events, type) => {
    if (type === 'all') return events;
    return events?.filter((event) => event.type === type) || [];
  };

  const getFilteredEvents = () => {
    const allEvents = dashboardData?.upcomingEvents || [];
    switch (tabValue) {
      case 0:
        return allEvents;
      case 1:
        return filterEventsByType(allEvents, 'assessment');
      case 2:
        return filterEventsByType(allEvents, 'interview');
      case 3:
        return filterEventsByType(allEvents, 'exam');
      default:
        return allEvents;
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

  const filteredEvents = getFilteredEvents();
  const groupedEvents = groupEventsByDate(filteredEvents);
  const upcomingCount = dashboardData?.upcomingEvents?.length || 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Button
        onClick={() => navigate('/candidate/dashboard')}
        startIcon={<ArrowLeftIcon style={{ width: 20, height: 20 }} />}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CalendarIcon style={{ width: 48, height: 48 }} />
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              My Calendar
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
              {upcomingCount} upcoming events scheduled
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.info.light,
                  color: theme.palette.info.main,
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <AcademicCapIcon style={{ width: 28, height: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {filterEventsByType(dashboardData?.upcomingEvents, 'assessment').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assessments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.success.light,
                  color: theme.palette.success.main,
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <UserIcon style={{ width: 28, height: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {filterEventsByType(dashboardData?.upcomingEvents, 'interview').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Interviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.warning.light,
                  color: theme.palette.warning.main,
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <AcademicCapIcon style={{ width: 28, height: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {filterEventsByType(dashboardData?.upcomingEvents, 'exam').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Exams
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.light,
                  color: theme.palette.primary.main,
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <CalendarIcon style={{ width: 28, height: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {upcomingCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Events List */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="All Events" />
          <Tab label="Assessments" />
          <Tab label="Interviews" />
          <Tab label="Exams" />
        </Tabs>

        <TabPanel value={tabValue} index={tabValue}>
          {filteredEvents && filteredEvents.length > 0 ? (
            <Box sx={{ p: 3 }}>
              {Object.entries(groupedEvents).map(([date, events]) => (
                <Box key={date} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: theme.palette.primary.main }}>
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                  <List>
                    {events.map((event, index) => (
                      <React.Fragment key={event.id}>
                        <ListItem
                          sx={{
                            bgcolor: theme.palette.grey[50],
                            borderRadius: 2,
                            mb: 2,
                            p: 2,
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: getEventColor(event.type).light,
                                color: getEventColor(event.type).main,
                              }}
                            >
                              {getEventIcon(event.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {event.title}
                                </Typography>
                                <Chip
                                  label={event.type}
                                  size="small"
                                  sx={{
                                    bgcolor: getEventColor(event.type).light,
                                    color: getEventColor(event.type).dark,
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <ClockIcon style={{ width: 16, height: 16 }} />
                                    <Typography variant="body2">{event.time}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <MapPinIcon style={{ width: 16, height: 16 }} />
                                    <Typography variant="body2">{event.location}</Typography>
                                  </Box>
                                </Box>
                              </Box>
                            }
                          />
                          <IconButton>
                            <BellIcon style={{ width: 20, height: 20 }} />
                          </IconButton>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CalendarIcon style={{ width: 64, height: 64, color: theme.palette.grey[400], margin: '0 auto 16px' }} />
              <Typography variant="h6" color="text.secondary">
                No events scheduled
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Card>
    </Container>
  );
};

export default Calendar;
