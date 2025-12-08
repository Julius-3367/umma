import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import candidateService from '../../api/candidate';

const BrowseCohorts = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [cohorts, setCohorts] = useState([]);
  const [myCohorts, setMyCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applicationNote, setApplicationNote] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchCohorts();
  }, []);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      const [availableCohorts, enrolledCohorts] = await Promise.all([
        candidateService.getAvailableCohorts(),
        candidateService.getMyCohorts(),
      ]);
      setCohorts(availableCohorts);
      setMyCohorts(enrolledCohorts);
    } catch (error) {
      console.error('Error fetching cohorts:', error);
      enqueueSnackbar('Failed to load cohorts', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (cohort) => {
    setSelectedCohort(cohort);
    setDetailsDialogOpen(true);
  };

  const handleOpenApplyDialog = (cohort) => {
    setSelectedCohort(cohort);
    setDetailsDialogOpen(false);
    setApplyDialogOpen(true);
  };

  const handleApply = async () => {
    if (!selectedCohort) return;

    try {
      setApplying(true);
      await candidateService.applyForCohort(selectedCohort.id);
      enqueueSnackbar(`Successfully applied to ${selectedCohort.cohortName}!`, {
        variant: 'success',
      });
      setApplyDialogOpen(false);
      setApplicationNote('');
      fetchCohorts(); // Refresh the list
    } catch (error) {
      console.error('Error applying to cohort:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to apply', {
        variant: 'error',
      });
    } finally {
      setApplying(false);
    }
  };

  const getCapacityColor = (spotsLeft, maxCapacity) => {
    const percentage = (spotsLeft / maxCapacity) * 100;
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'error';
  };

  const getDaysUntilDeadline = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          {t('candidate.browseCoursesTitle')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('candidate.browseCoursesSubtitle')}
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <SchoolIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {cohorts.length}
                  </Typography>
                  <Typography variant="body2">Available Cohorts</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <GroupsIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {myCohorts.filter((c) => c.status === 'ENROLLED').length}
                  </Typography>
                  <Typography variant="body2">Enrolled</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <TrendingIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {myCohorts.filter((c) => c.status === 'APPLIED').length}
                  </Typography>
                  <Typography variant="body2">Applications Pending</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* New Cohorts Alert */}
      {cohorts.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
          <strong>New opportunities available!</strong> {cohorts.length} cohort
          {cohorts.length !== 1 && 's'} ready for enrollment. Apply now to secure your spot!
        </Alert>
      )}

      {/* Cohorts Grid */}
      {cohorts.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Available Cohorts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later for new training opportunities
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {cohorts.map((cohort) => {
            const spotsLeft = cohort.spotsLeft || 0;
            const daysLeft = getDaysUntilDeadline(cohort.enrollmentDeadline);

            return (
              <Grid item xs={12} md={6} lg={4} key={cohort.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Cohort Name */}
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      {cohort.cohortName}
                    </Typography>

                    {/* Course Info */}
                    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                      <SchoolIcon fontSize="small" color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        {cohort.course?.title}
                      </Typography>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    {/* Dates */}
                    <Stack spacing={1} mb={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Starts:</strong> {format(new Date(cohort.startDate), 'MMM dd, yyyy')}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Duration:</strong> {cohort.course?.durationDays} days
                        </Typography>
                      </Stack>
                      {cohort.location && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2">{cohort.location}</Typography>
                        </Stack>
                      )}
                    </Stack>

                    {/* Trainer */}
                    {cohort.leadTrainer && (
                      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {cohort.leadTrainer.firstName} {cohort.leadTrainer.lastName}
                        </Typography>
                      </Stack>
                    )}

                    {/* Capacity */}
                    <Box mb={2}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Capacity
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {spotsLeft} / {cohort.maxCapacity} spots left
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={((cohort.maxCapacity - spotsLeft) / cohort.maxCapacity) * 100}
                        color={getCapacityColor(spotsLeft, cohort.maxCapacity)}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>

                    {/* Deadline */}
                    <Chip
                      label={
                        daysLeft > 0
                          ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} to apply`
                          : 'Deadline today'
                      }
                      size="small"
                      color={daysLeft <= 3 ? 'error' : daysLeft <= 7 ? 'warning' : 'default'}
                      sx={{ mb: 1 }}
                    />
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      onClick={() => handleViewDetails(cohort)}
                      startIcon={<InfoIcon />}
                    >
                      Details
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenApplyDialog(cohort)}
                      endIcon={<SendIcon />}
                      disabled={spotsLeft === 0}
                    >
                      Apply Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Cohort Details</Typography>
            <IconButton onClick={() => setDetailsDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedCohort && (
            <Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                {selectedCohort.cohortName}
              </Typography>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                {selectedCohort.course?.title}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Cohort Code
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedCohort.cohortCode}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedCohort.course?.durationDays} days
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {format(new Date(selectedCohort.startDate), 'MMMM dd, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {format(new Date(selectedCohort.endDate), 'MMMM dd, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Enrollment Deadline
                  </Typography>
                  <Typography variant="body1" fontWeight={500} color="error">
                    {format(new Date(selectedCohort.enrollmentDeadline), 'MMMM dd, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Available Spots
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedCohort.spotsLeft} / {selectedCohort.maxCapacity}
                  </Typography>
                </Grid>
                {selectedCohort.location && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedCohort.location}
                    </Typography>
                  </Grid>
                )}
                {selectedCohort.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body2">{selectedCohort.description}</Typography>
                  </Grid>
                )}
                {selectedCohort.course?.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Course Description
                    </Typography>
                    <Typography variant="body2">{selectedCohort.course.description}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => handleOpenApplyDialog(selectedCohort)}
            endIcon={<SendIcon />}
          >
            Apply to this Cohort
          </Button>
        </DialogActions>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply to Cohort</DialogTitle>
        <DialogContent>
          {selectedCohort && (
            <Box mt={2}>
              <Alert severity="info" sx={{ mb: 3 }}>
                You are applying to <strong>{selectedCohort.cohortName}</strong>
              </Alert>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Your application will be reviewed by the admin. You will be notified once your
                application is approved.
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Additional Notes (Optional)"
                value={applicationNote}
                onChange={(e) => setApplicationNote(e.target.value)}
                placeholder="Tell us why you want to join this cohort..."
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialogOpen(false)} disabled={applying}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={applying}
            endIcon={applying ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {applying ? 'Submitting...' : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrowseCohorts;
