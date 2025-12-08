import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Groups,
  Event,
  Assessment,
  CalendarToday,
  LocationOn,
  School,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import { trainerService } from '../../api/trainer';
import { format } from 'date-fns';

const CohortDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cohort, setCohort] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchCohortDetails();
    fetchCohortSessions();
  }, [id]);

  const fetchCohortDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get cohorts and find the specific one
      const response = await trainerService.getMyCohorts();
      const cohorts = response.data.data || response.data.cohorts || [];
      const foundCohort = cohorts.find(c => c.id === parseInt(id));
      
      if (foundCohort) {
        setCohort(foundCohort);
      } else {
        setError('Cohort not found');
      }
    } catch (err) {
      console.error('Error fetching cohort details:', err);
      setError(err.response?.data?.message || 'Failed to fetch cohort details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCohortSessions = async () => {
    try {
      const response = await trainerService.getCohortSessions(id);
      setSessions(response.data.data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      PUBLISHED: 'info',
      ENROLLMENT_OPEN: 'success',
      ENROLLMENT_CLOSED: 'warning',
      IN_TRAINING: 'primary',
      ASSESSMENT_IN_PROGRESS: 'secondary',
      VETTING_IN_PROGRESS: 'secondary',
      COMPLETED: 'success',
      ARCHIVED: 'default',
      SCHEDULED: 'info',
      IN_PROGRESS: 'warning',
      CANCELLED: 'error',
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return date ? format(new Date(date), 'MMM dd, yyyy') : 'N/A';
  };

  const formatTime = (date) => {
    return date ? format(new Date(date), 'h:mm a') : 'N/A';
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !cohort) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Cohort not found'}</Alert>
        <Button onClick={() => navigate('/trainer/cohorts')} sx={{ mt: 2 }}>
          Back to Cohorts
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/trainer/cohorts')}
        >
          Back
        </Button>
        <Groups sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            {cohort.cohortName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cohort.cohortCode}
          </Typography>
        </Box>
        <Chip
          label={cohort.status.replace(/_/g, ' ')}
          color={getStatusColor(cohort.status)}
        />
      </Stack>

      {/* Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <School sx={{ color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Course
                </Typography>
                <Typography variant="h6">
                  {cohort.course?.title || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {cohort.course?.code}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Groups sx={{ color: 'success.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Students Enrolled
                </Typography>
                <Typography variant="h6">
                  {cohort.currentEnrollment || 0} / {cohort.maxCapacity}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={((cohort.currentEnrollment || 0) / cohort.maxCapacity) * 100}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <Event sx={{ color: 'warning.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Total Sessions
                </Typography>
                <Typography variant="h6">
                  {cohort._count?.sessions || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Scheduled
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack spacing={1}>
                <TrendingUp sx={{ color: 'info.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="h6">
                  {cohort.attendanceRate?.toFixed(0) || 0}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Attendance Rate
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cohort Information */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Cohort Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {cohort.description || 'No description available'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body2">
                    <CalendarToday sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
                    {formatDate(cohort.startDate)} - {formatDate(cohort.endDate)}
                  </Typography>
                </Box>

                {cohort.location && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body2">
                      <LocationOn sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
                      {cohort.location}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Enrollment Deadline
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(cohort.enrollmentDeadline)}
                  </Typography>
                </Box>

                {cohort.scheduleInfo && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Schedule
                    </Typography>
                    <Typography variant="body2">
                      {cohort.scheduleInfo}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Statistics
                  </Typography>
                  <Typography variant="body2">
                    Assessment Avg: {cohort.assessmentAverage?.toFixed(0) || 0}%
                  </Typography>
                  <Typography variant="body2">
                    Vetting Completion: {cohort.vettingCompletionRate?.toFixed(0) || 0}%
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Sessions" />
          <Tab label="Students" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Sessions Tab */}
          {activeTab === 0 && (
            <Box>
              {sessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Event sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No sessions scheduled yet
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Session #</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Attendance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.sessionNumber}</TableCell>
                          <TableCell>{session.sessionTitle}</TableCell>
                          <TableCell>{formatDate(session.sessionDate)}</TableCell>
                          <TableCell>
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          </TableCell>
                          <TableCell>{session.location || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={session.status}
                              color={getStatusColor(session.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {session.actualAttendees || 0} / {session.expectedAttendees || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Students Tab */}
          {activeTab === 1 && (
            <Box>
              {cohort.enrollments && cohort.enrollments.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Attendance</TableCell>
                        <TableCell>Assessments</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cohort.enrollments.map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell>{enrollment.candidate?.fullName || 'N/A'}</TableCell>
                          <TableCell>{enrollment.candidate?.user?.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={enrollment.status}
                              color={getStatusColor(enrollment.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{enrollment.attendanceRate || 0}%</TableCell>
                          <TableCell>
                            {enrollment.assessmentsPassed || 0} / 
                            {(enrollment.assessmentsPassed || 0) + (enrollment.assessmentsFailed || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Groups sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No students enrolled yet
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default CohortDetails;
