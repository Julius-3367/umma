import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Refresh,
  EmojiEvents,
  HourglassEmpty,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { adminService } from '../../api/admin';

const CertificateApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRequests, setTotalRequests] = useState(0);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    fetchRequests();
  }, [page, rowsPerPage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        status: 'pending', // Only show pending requests
      };

      const response = await adminService.getCertificateRequests(params);
      setRequests(response.data.data.requests || []);
      setTotalRequests(response.data.data.total || 0);
      
      // Fetch stats
      const statsResponse = await adminService.getCertificateStats();
      setStats(statsResponse.data.data || { pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      console.error('Error fetching certificate requests:', err);
      setError(err.response?.data?.message || 'Failed to load certificate requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    setSelectedRequest(request);
    setApprovalDialogOpen(true);
  };

  const handleReject = async (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setApprovalDialogOpen(true);
  };

  const handleApprovalConfirm = async (action) => {
    if (!selectedRequest) return;

    try {
      const data = {
        action,
        ...(action === 'reject' && rejectionReason && { reason: rejectionReason }),
      };

      await adminService.processCertificateRequest(selectedRequest.id, data);
      
      setSuccess(`Certificate request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setApprovalDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} certificate request`);
      setApprovalDialogOpen(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <EmojiEvents fontSize="large" color="primary" />
          <Typography variant="h4" fontWeight="bold">
            Certificate Approvals
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchRequests}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Pending Requests
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.pending}
                  </Typography>
                </Box>
                <HourglassEmpty sx={{ fontSize: 48, color: 'warning.main' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Approved
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.approved}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Rejected
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {stats.rejected}
                  </Typography>
                </Box>
                <Cancel sx={{ fontSize: 48, color: 'error.main' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Requests Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Request ID</TableCell>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Trainer</TableCell>
                  <TableCell>Assessment Score</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" py={4}>
                        No pending certificate requests
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>
                        <Typography fontWeight="bold">#{request.id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.candidate?.fullName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {request.candidate?.user?.email || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.course?.title || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {request.course?.code || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {request.trainer?.firstName} {request.trainer?.lastName}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${request.assessment?.score || 0}%`}
                          size="small"
                          color={
                            (request.assessment?.score || 0) >= 70
                              ? 'success'
                              : (request.assessment?.score || 0) >= 50
                              ? 'warning'
                              : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {request.requestedAt
                          ? new Date(request.requestedAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Pending"
                          size="small"
                          color="warning"
                          icon={<HourglassEmpty />}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprove(request)}
                            >
                              <ThumbUp />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleReject(request)}
                            >
                              <ThumbDown />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalRequests}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </TableContainer>

      {/* Approval/Rejection Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedRequest ? 'Process Certificate Request' : ''}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Candidate:</strong> {selectedRequest.candidate?.fullName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Course:</strong> {selectedRequest.course?.title}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Score:</strong> {selectedRequest.assessment?.score || 0}%
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Rejection Reason (optional for rejection)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleApprovalConfirm('reject')}
            color="error"
            variant="outlined"
            startIcon={<Cancel />}
          >
            Reject
          </Button>
          <Button
            onClick={() => handleApprovalConfirm('approve')}
            color="success"
            variant="contained"
            startIcon={<CheckCircle />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateApprovals;
