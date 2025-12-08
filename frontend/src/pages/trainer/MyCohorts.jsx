import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  Event,
  Assessment,
  Groups,
  TrendingUp,
} from '@mui/icons-material';
import { trainerService } from '../../api/trainer';
import { format } from 'date-fns';

const MyCohorts = () => {
  const navigate = useNavigate();
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyCohorts();
  }, []);

  const fetchMyCohorts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await trainerService.getMyCohorts();
      console.log('Cohorts response:', response.data);
      // API returns { success: true, data: [...], pagination: {...} }
      setCohorts(response.data.data || response.data.cohorts || []);
    } catch (err) {
      console.error('Error fetching cohorts:', err);
      setError(err.response?.data?.message || 'Failed to fetch cohorts');
    } finally {
      setLoading(false);
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
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return date ? format(new Date(date), 'MMM dd, yyyy') : 'N/A';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Groups sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight="bold">
          My Cohorts
        </Typography>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Cohorts Grid */}
      {cohorts.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Groups sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No cohorts assigned yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            You will see cohorts here once they are assigned to you by an administrator.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {cohorts.map((cohort) => (
            <Grid item xs={12} md={6} lg={4} key={cohort.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack spacing={2}>
                    {/* Cohort Header */}
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {cohort.cohortName || cohort.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {cohort.cohortCode}
                      </Typography>
                      <Chip
                        label={cohort.status.replace(/_/g, ' ')}
                        color={getStatusColor(cohort.status)}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>

                    {/* Course */}
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Course
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {cohort.course?.name || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Dates */}
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(cohort.startDate)} - {formatDate(cohort.endDate)}
                      </Typography>
                    </Box>

                    {/* Students */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Students
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {cohort.enrolledCount || 0} / {cohort.maxCapacity}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={((cohort.enrolledCount || 0) / cohort.maxCapacity) * 100}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>

                    {/* Quick Stats */}
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Event sx={{ fontSize: 20, color: 'success.main' }} />
                          <Typography variant="caption" display="block" color="text.secondary">
                            Sessions
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {cohort.sessions?.length || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Assessment sx={{ fontSize: 20, color: 'warning.main' }} />
                          <Typography variant="caption" display="block" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {cohort.overallCompletionRate?.toFixed(0) || 0}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/trainer/cohorts/${cohort.id}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MyCohorts;
