import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  TextField,
  MenuItem,
  Stack,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Download,
  Send,
  Block,
  Refresh as RefreshIcon,
  Search,
  EmojiEvents,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Description,
} from '@mui/icons-material';
import { adminService } from '../../api/admin';
import { format } from 'date-fns';

const CertificateList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    courseId: '',
    search: '',
  });
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [sendEmail, setSendEmail] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchCertificates();
    fetchStatistics();
    fetchCourses();
  }, [filters]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getCertificates(filters);
      setCertificates(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await adminService.getCertificateStatistics();
      setStatistics(data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await adminService.getAllCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const handleDownload = async (certificate) => {
    try {
      setError(null);
      setSuccess(null);
      await adminService.downloadCertificate(certificate.id);
      setSuccess(`Certificate downloaded successfully`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download certificate');
    }
  };

  const handleSendEmail = async () => {
    try {
      setError(null);
      setSuccess(null);
      await adminService.sendCertificate(selectedCertificate.id, sendEmail);
      setSuccess(`Certificate sent to ${sendEmail}`);
      setSendDialogOpen(false);
      setSendEmail('');
      setSelectedCertificate(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send certificate');
    }
  };

  const handleRevoke = async () => {
    try {
      setError(null);
      setSuccess(null);
      await adminService.revokeCertificate(selectedCertificate.id, revokeReason);
      setSuccess('Certificate revoked successfully');
      setRevokeDialogOpen(false);
      setRevokeReason('');
      setSelectedCertificate(null);
      fetchCertificates();
      fetchStatistics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke certificate');
    }
  };

  const handleReissue = async (certificate) => {
    try {
      setError(null);
      setSuccess(null);
      await adminService.reissueCertificate(certificate.id);
      setSuccess('Certificate reissued successfully');
      fetchCertificates();
      fetchStatistics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reissue certificate');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ISSUED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REVOKED':
        return 'error';
      case 'EXPIRED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ISSUED':
        return <CheckCircle fontSize="small" />;
      case 'PENDING':
        return <HourglassEmpty fontSize="small" />;
      case 'REVOKED':
        return <Cancel fontSize="small" />;
      case 'EXPIRED':
        return <Block fontSize="small" />;
      default:
        return null;
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedCertificates = certificates.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
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
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <EmojiEvents sx={{ fontSize: 40, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Certificates
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
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.issued}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Issued
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
                  <HourglassEmpty sx={{ fontSize: 40, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.pending}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
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
                  <Cancel sx={{ fontSize: 40, color: 'error.main' }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.revoked}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Revoked
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search by name, email, certificate number..."
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ minWidth: 300 }}
        />
        <TextField
          select
          label="Status"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="issued">Issued</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="revoked">Revoked</MenuItem>
          <MenuItem value="expired">Expired</MenuItem>
        </TextField>
        <TextField
          select
          label="Course"
          value={filters.courseId}
          onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Courses</MenuItem>
          {courses.map((course) => (
            <MenuItem key={course.id} value={course.id}>
              {course.title}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchCertificates}
        >
          Refresh
        </Button>
      </Stack>

      {/* Certificate Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : certificates.length === 0 ? (
        <Alert severity="info">No certificates found</Alert>
      ) : (
        <>
          <TableContainer component={Box}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Certificate #</TableCell>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCertificates.map((certificate) => (
                  <TableRow key={certificate.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {certificate.certificateNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {certificate.candidateName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {certificate.candidateEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {certificate.courseName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {certificate.courseCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(certificate.issueDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {certificate.expiryDate
                        ? format(new Date(certificate.expiryDate), 'MMM dd, yyyy')
                        : 'No Expiry'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={certificate.status}
                        color={getStatusColor(certificate.status)}
                        size="small"
                        icon={getStatusIcon(certificate.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {certificate.grade || '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {certificate.status === 'ISSUED' && (
                          <>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleDownload(certificate)}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Send via Email">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => {
                                  setSelectedCertificate(certificate);
                                  setSendEmail(certificate.candidateEmail);
                                  setSendDialogOpen(true);
                                }}
                              >
                                <Send fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Revoke">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedCertificate(certificate);
                                  setRevokeDialogOpen(true);
                                }}
                              >
                                <Block fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {certificate.status === 'REVOKED' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleReissue(certificate)}
                          >
                            Reissue
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={certificates.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </>
      )}

      {/* Send Email Dialog */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Certificate via Email</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={sendEmail}
            onChange={(e) => setSendEmail(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendEmail} variant="contained" disabled={!sendEmail}>
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Revoke Certificate</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will revoke the certificate. Please provide a reason.
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Revocation"
            multiline
            rows={4}
            fullWidth
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRevoke}
            variant="contained"
            color="error"
            disabled={!revokeReason}
          >
            Revoke
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateList;
