import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  LinearProgress,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  Cancel as RejectIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  VerifiedUser as VerifiedIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  TrendingUp as ProgressIcon,
  EmojiEvents as CertificateIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import candidateService from '../../api/candidate';

const MyApplications = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [vettingDialogOpen, setVettingDialogOpen] = useState(false);
  const [applyingForVetting, setApplyingForVetting] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await candidateService.getMyCohorts();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      enqueueSnackbar('Failed to load applications', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      APPLIED: 'warning',
      ENROLLED: 'success',
      COMPLETED: 'info',
      WITHDRAWN: 'default',
      REJECTED: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPLIED':
        return <PendingIcon />;
      case 'ENROLLED':
        return <CheckIcon />;
      case 'COMPLETED':
        return <CertificateIcon />;
      case 'REJECTED':
        return <RejectIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getVettingStatusColor = (status) => {
    const colors = {
      PENDING: 'warning',
      IN_PROGRESS: 'info',
      APPROVED: 'success',
      REJECTED: 'error',
    };
    return colors[status] || 'default';
  };

  const getApplicationSteps = (application) => {
    const steps = [
      { label: 'Application Submitted', completed: true },
      { label: 'Under Review', completed: application.status !== 'APPLIED' },
      { label: 'Enrolled', completed: ['ENROLLED', 'COMPLETED'].includes(application.status) },
      { label: 'Vetting Process', completed: application.enrollment?.vettingStatus === 'APPROVED' },
      {
        label: 'Training Completed',
        completed: application.status === 'COMPLETED' || application.enrollment?.certificateIssued,
      },
    ];
    return steps;
  };

  const handleViewDetails = (application) => {
    setSelectedApp(application);
    setDetailsOpen(true);
  };

  const handleApplyForVetting = (application) => {
    setSelectedApp(application);
    setVettingDialogOpen(true);
  };

  const submitVettingApplication = async () => {
    try {
      setApplyingForVetting(true);
      await candidateService.applyForVetting(selectedApp.id);
      enqueueSnackbar('Vetting application submitted successfully!', { variant: 'success' });
      setVettingDialogOpen(false);
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error('Error applying for vetting:', error);
      enqueueSnackbar(error.message || 'Failed to submit vetting application', { variant: 'error' });
    } finally {
      setApplyingForVetting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === 'APPLIED').length,
    enrolled: applications.filter((a) => a.status === 'ENROLLED').length,
    completed: applications.filter((a) => a.status === 'COMPLETED').length,
    vettingPending: applications.filter(
      (a) => a.enrollment?.vettingStatus === 'PENDING' || a.enrollment?.vettingStatus === 'IN_PROGRESS'
    ).length,
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          My Applications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your cohort applications and training progress
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Applications
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PendingIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.applied}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Review
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <CheckIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.enrolled}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Enrollments
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <VerifiedIcon sx={{ fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.vettingPending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vetting Pending
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vetting Alert */}
      {stats.vettingPending > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<VerifiedIcon />}>
          <strong>Action Required:</strong> You have {stats.vettingPending} enrollment
          {stats.vettingPending !== 1 && 's'} pending vetting. Please ensure you complete all vetting
          requirements to receive your certificate.
        </Alert>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Applications Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Browse available cohorts and apply to start your training journey
            </Typography>
            <Button variant="contained" href="/candidate/browse-cohorts">
              Browse Cohorts
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Cohort</strong>
                </TableCell>
                <TableCell>
                  <strong>Course</strong>
                </TableCell>
                <TableCell>
                  <strong>Applied On</strong>
                </TableCell>
                <TableCell>
                  <strong>Status</strong>
                </TableCell>
                <TableCell>
                  <strong>Vetting</strong>
                </TableCell>
                <TableCell>
                  <strong>Progress</strong>
                </TableCell>
                <TableCell>
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => {
                const steps = getApplicationSteps(app);
                const currentStep = steps.filter((s) => s.completed).length;
                const progress = (currentStep / steps.length) * 100;

                return (
                  <TableRow key={app.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {app.cohortName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {app.cohortCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{app.course?.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(app.applicationDate || app.appliedAt), 'MMM dd, yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(app.status)}
                        label={app.status}
                        size="small"
                        color={getStatusColor(app.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {app.vettingStatus ? (
                        <Chip
                          label={app.vettingStatus}
                          size="small"
                          color={getVettingStatusColor(app.vettingStatus)}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={`${currentStep} of ${steps.length} steps completed`}>
                        <Box sx={{ width: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            color={progress === 100 ? 'success' : 'primary'}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => handleViewDetails(app)} startIcon={<InfoIcon />}>
                          Details
                        </Button>
                        {app.status === 'ENROLLED' && 
                         (!app.vettingStatus || app.vettingStatus === 'PENDING') && (
                          <Button 
                            size="small" 
                            variant="contained"
                            color="primary"
                            onClick={() => handleApplyForVetting(app)}
                            startIcon={<VerifiedIcon />}
                          >
                            Apply for Vetting
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Application Details</Typography>
            <IconButton onClick={() => setDetailsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Box>
              {/* Cohort Info */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedApp.cohortName}
                  </Typography>
                  <Typography variant="body2" color="primary" gutterBottom>
                    {selectedApp.course?.title}
                  </Typography>
                  <Grid container spacing={2} mt={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Start Date
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(selectedApp.startDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        End Date
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(selectedApp.endDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Progress Stepper */}
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Application Progress
              </Typography>
              <Stepper activeStep={getApplicationSteps(selectedApp).filter((s) => s.completed).length - 1} sx={{ mb: 3 }}>
                {getApplicationSteps(selectedApp).map((step, index) => (
                  <Step key={index} completed={step.completed}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Status Details */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Application Status
                  </Typography>
                  <Box mt={1}>
                    <Chip
                      icon={getStatusIcon(selectedApp.status)}
                      label={selectedApp.status}
                      color={getStatusColor(selectedApp.status)}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Vetting Status
                  </Typography>
                  <Box mt={1}>
                    {selectedApp.enrollment?.vettingStatus ? (
                      <Chip
                        label={selectedApp.enrollment.vettingStatus}
                        color={getVettingStatusColor(selectedApp.enrollment.vettingStatus)}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not started
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Applied On
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(selectedApp.applicationDate || selectedApp.appliedAt), 'MMMM dd, yyyy')}
                  </Typography>
                </Grid>
                {selectedApp.enrollment?.certificateIssued && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Certificate
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                      <CertificateIcon color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        Issued
                      </Typography>
                    </Stack>
                  </Grid>
                )}
              </Grid>

              {/* Vetting Instructions */}
              {selectedApp.status === 'ENROLLED' &&
                (!selectedApp.enrollment?.vettingStatus ||
                  selectedApp.enrollment.vettingStatus === 'PENDING') && (
                  <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Complete Your Vetting Process
                    </Typography>
                    <Typography variant="body2">
                      To receive your certificate upon completion, you need to complete the vetting process.
                      This includes document verification and background checks. Please contact your
                      administrator for next steps.
                    </Typography>
                  </Alert>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Vetting Application Dialog */}
      <Dialog open={vettingDialogOpen} onClose={() => setVettingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <VerifiedIcon color="primary" />
            <Typography variant="h6">Apply for Vetting</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Vetting Process Overview
            </Typography>
            <Typography variant="body2" component="div">
              The vetting process includes:
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>Document verification (Police Clearance, Medical Report)</li>
                <li>Background checks</li>
                <li>Final approval by vetting officers</li>
              </ul>
            </Typography>
          </Alert>
          
          {selectedApp && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Cohort: {selectedApp.cohortName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Course: {selectedApp.course?.title}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  After submitting this application, you will need to upload the required documents. 
                  Your vetting status will be updated to <strong>PENDING_DOCUMENTS</strong> until all 
                  documents are submitted.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVettingDialogOpen(false)} disabled={applyingForVetting}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={submitVettingApplication}
            disabled={applyingForVetting}
            startIcon={applyingForVetting ? <CircularProgress size={16} /> : <VerifiedIcon />}
          >
            {applyingForVetting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyApplications;
