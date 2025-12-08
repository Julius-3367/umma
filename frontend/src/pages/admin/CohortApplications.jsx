import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  Stack,
  TextField,
  MenuItem,
  Avatar,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  HourglassEmpty as PendingIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import axios from '../../api/axios';

const CohortApplications = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Pending, 2: Approved, 3: Rejected

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/cohort-applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      enqueueSnackbar('Failed to load applications', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;

    try {
      setProcessing(true);
      await axios.post(`/admin/cohort-applications/${selectedApp.id}/approve`);
      enqueueSnackbar('Application approved successfully!', { variant: 'success' });
      setActionDialogOpen(false);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to approve application', {
        variant: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason) {
      enqueueSnackbar('Please provide a reason for rejection', { variant: 'warning' });
      return;
    }

    try {
      setProcessing(true);
      await axios.post(`/admin/cohort-applications/${selectedApp.id}/reject`, {
        reason: rejectionReason,
      });
      enqueueSnackbar('Application rejected', { variant: 'info' });
      setActionDialogOpen(false);
      setSelectedApp(null);
      setRejectionReason('');
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to reject application', {
        variant: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (app, type) => {
    setSelectedApp(app);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      APPLIED: 'warning',
      ENROLLED: 'success',
      REJECTED: 'error',
      WITHDRAWN: 'default',
    };
    return colors[status] || 'default';
  };

  const getFilteredApplications = () => {
    switch (tabValue) {
      case 1:
        return applications.filter((app) => app.status === 'APPLIED');
      case 2:
        return applications.filter((app) => app.status === 'ENROLLED');
      case 3:
        return applications.filter((app) => app.status === 'REJECTED');
      default:
        return applications;
    }
  };

  const filteredApplications = getFilteredApplications();
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'APPLIED').length,
    approved: applications.filter((a) => a.status === 'ENROLLED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
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
          Cohort Applications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and manage candidate cohort applications
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <GroupIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    {stats.pending}
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
                <ApproveIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.approved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
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
                <RejectIcon sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.rejected}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Alert */}
      {stats.pending > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have {stats.pending} pending application{stats.pending !== 1 && 's'} waiting for review
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All (${stats.total})`} />
          <Tab label={`Pending (${stats.pending})`} />
          <Tab label={`Approved (${stats.approved})`} />
          <Tab label={`Rejected (${stats.rejected})`} />
        </Tabs>
      </Paper>

      {/* Applications Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Candidate</strong>
              </TableCell>
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
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No applications found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((app) => (
                <TableRow key={app.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar>
                        {app.candidate?.firstName?.[0]}
                        {app.candidate?.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {app.candidate?.firstName} {app.candidate?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {app.candidate?.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {app.cohort?.cohortName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {app.cohort?.cohortCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{app.cohort?.course?.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(app.applicationDate || app.appliedAt), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={app.status} size="small" color={getStatusColor(app.status)} />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedApp(app);
                            setDetailsOpen(true);
                          }}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {app.status === 'APPLIED' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => openActionDialog(app, 'approve')}
                            >
                              <ApproveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openActionDialog(app, 'reject')}
                            >
                              <RejectIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Candidate Name
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedApp.candidate?.firstName} {selectedApp.candidate?.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedApp.candidate?.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Cohort
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedApp.cohort?.cohortName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Course
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedApp.cohort?.course?.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Applied On
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {format(new Date(selectedApp.applicationDate || selectedApp.appliedAt), 'MMMM dd, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={selectedApp.status}
                      color={getStatusColor(selectedApp.status)}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
        </DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Box mt={2}>
              <Alert severity={actionType === 'approve' ? 'success' : 'error'} sx={{ mb: 2 }}>
                {actionType === 'approve'
                  ? 'The candidate will be enrolled in the cohort and notified via email.'
                  : 'The application will be rejected and the candidate will be notified.'}
              </Alert>

              <Typography variant="body2" gutterBottom>
                <strong>Candidate:</strong> {selectedApp.candidate?.firstName}{' '}
                {selectedApp.candidate?.lastName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Cohort:</strong> {selectedApp.cohort?.cohortName}
              </Typography>

              {actionType === 'reject' && (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Rejection Reason *"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this application is being rejected..."
                  sx={{ mt: 2 }}
                  required
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            onClick={actionType === 'approve' ? handleApprove : handleReject}
            disabled={processing || (actionType === 'reject' && !rejectionReason)}
            startIcon={processing ? <CircularProgress size={20} /> : null}
          >
            {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CohortApplications;
