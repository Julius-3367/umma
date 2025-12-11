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
  Print,
  Add as AddIcon,
  Edit as EditIcon,
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
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [sendEmail, setSendEmail] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [courses, setCourses] = useState([]);
  const [completedEnrollments, setCompletedEnrollments] = useState([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedCertificate, setEditedCertificate] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedCourseName, setEditedCourseName] = useState('');
  const [editedCourseCode, setEditedCourseCode] = useState('');

  useEffect(() => {
    fetchCertificates();
    fetchStatistics();
    fetchCourses();
    fetchCompletedEnrollments();
  }, [filters]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      // Clean up filters - don't send empty values
      const cleanFilters = {};
      if (filters.status && filters.status !== 'all') cleanFilters.status = filters.status;
      if (filters.courseId) cleanFilters.courseId = filters.courseId;
      if (filters.search) cleanFilters.search = filters.search;
      
      const response = await adminService.getCertificates(cleanFilters);
      console.log('📜 Certificates response:', response);
      setCertificates(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
      setError(err.response?.data?.message || 'Failed to fetch certificates');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await adminService.getCertificateStatistics();
      setStatistics(response.data?.data || response.data || { total: 0, issued: 0, pending: 0, revoked: 0 });
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setStatistics({ total: 0, issued: 0, pending: 0, revoked: 0 });
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await adminService.getAllCourses();
      // backend returns { data: { courses: [...] } }
      setCourses(response.data?.data?.courses || response.data || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setCourses([]);
    }
  };

  const fetchCompletedEnrollments = async () => {
    try {
      const response = await adminService.getEnrollments({ enrollmentStatus: 'COMPLETED' });
      const enrollments = response.data?.data?.enrollments || response.data?.data || response.data || [];
      // Filter out enrollments that already have certificates
      const enrollmentsWithoutCerts = enrollments.filter(enrollment =>
        !certificates.some(cert => cert.enrollmentId === enrollment.id)
      );
      setCompletedEnrollments(enrollmentsWithoutCerts);
    } catch (err) {
      console.error('Failed to fetch completed enrollments:', err);
      setCompletedEnrollments([]);
    }
  };

  const handleDownload = async (certificate) => {
    try {
      setError(null);
      setSuccess(null);
      const response = await adminService.downloadCertificate(certificate.id);

      // Create a blob from the response
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate_${certificate.certificateNumber || certificate.id}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`Certificate downloaded successfully`);
    } catch (err) {
      console.error('Download error:', err);
      setError(err.response?.data?.message || 'Failed to download certificate');
    }
  };

  const handlePrint = async (certificate) => {
    try {
      setError(null);
      setSuccess(null);
      const response = await adminService.downloadCertificate(certificate.id);

      // Create a blob from the response
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Open in new window for printing
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
          // Clean up after print dialog closes (or 1 second delay)
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        });
      } else {
        // Fallback if popup was blocked - download instead
        const link = document.createElement('a');
        link.href = url;
        link.download = `Certificate_${certificate.certificateNumber || certificate.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setError('Pop-up blocked. Certificate downloaded instead. Please allow pop-ups to print directly.');
      }

      setSuccess(`Certificate ready for printing`);
    } catch (err) {
      console.error('Print error:', err);
      setError(err.response?.data?.message || 'Failed to print certificate');
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
      console.error('Reissue error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reissue certificate';
      setError(errorMessage);
    }
  };

  const handleEditCertificate = async () => {
    if (!editedName.trim()) {
      setError('Please enter a valid name');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await adminService.updateCertificate(editedCertificate.id, {
        candidateName: editedName.trim(),
        courseName: editedCourseName.trim() || undefined,
        courseCode: editedCourseCode.trim() || undefined,
      });
      setSuccess('Certificate updated successfully!');
      setEditDialogOpen(false);
      setEditedCertificate(null);
      setEditedName('');
      setEditedCourseName('');
      setEditedCourseCode('');
      fetchCertificates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update certificate');
    }
  };

  const handleDownloadPreview = async () => {
    if (!editedCertificate) return;
    try {
      setError(null);
      setSuccess(null);
      const response = await adminService.previewCertificate(editedCertificate.id, {
        candidateName: editedName.trim(),
        courseName: editedCourseName.trim() || undefined,
        courseCode: editedCourseCode.trim() || undefined,
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate_Preview_${editedCertificate.certificateNumber || editedCertificate.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('Preview downloaded');
    } catch (err) {
      console.error('Preview download error:', err);
      setError(err.response?.data?.message || 'Failed to download preview');
    }
  };

  const handleGenerateCertificate = async () => {
    if (!selectedEnrollment) {
      setError('Please select an enrollment');
      return;
    }

    if (useCustomName && !customName.trim()) {
      setError('Please enter a custom name');
      return;
    }

    try {
      setGenerateLoading(true);
      setError(null);
      setSuccess(null);

      await adminService.generateCertificate({
        enrollmentId: selectedEnrollment,
        issueDate: new Date().toISOString(),
        status: 'ISSUED',
        remarks: 'Successfully completed all course requirements and assessments.',
        customName: useCustomName ? customName.trim() : undefined,
      });

      setSuccess('Certificate generated successfully!');
      setGenerateDialogOpen(false);
      setSelectedEnrollment('');
      setCustomName('');
      setUseCustomName(false);
      fetchCertificates();
      fetchStatistics();
      fetchCompletedEnrollments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGenerateLoading(false);
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
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" alignItems="center">
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
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            fetchCompletedEnrollments();
            setGenerateDialogOpen(true);
          }}
          color="primary"
        >
          Generate Certificate
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
                  <TableCell>Status</TableCell>
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
                      {certificate.issueDate ? (() => {
                        try {
                          return format(new Date(certificate.issueDate), 'MMM dd, yyyy');
                        } catch (e) {
                          return String(certificate.issueDate);
                        }
                      })() : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={certificate.status}
                        color={getStatusColor(certificate.status)}
                        size="small"
                        icon={getStatusIcon(certificate.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {certificate.status === 'ISSUED' && (
                          <>
                            <Tooltip title="Edit Name">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditedCertificate(certificate);
                                  setEditedName(certificate.candidateName || '');
                                  setEditedCourseName(certificate.courseName || '');
                                  setEditedCourseCode(certificate.courseCode || '');
                                  setEditDialogOpen(true);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleDownload(certificate)}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handlePrint(certificate)}
                              >
                                <Print fontSize="small" />
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

      {/* Generate Certificate Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Certificate</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Select a completed enrollment to generate a certificate. Only enrollments without existing certificates are shown.
          </Alert>
          <TextField
            select
            label="Select Completed Enrollment"
            fullWidth
            value={selectedEnrollment}
            onChange={(e) => setSelectedEnrollment(e.target.value)}
            sx={{ mt: 2 }}
            helperText={completedEnrollments.length === 0 ? "No completed enrollments without certificates found" : ""}
          >
            {completedEnrollments.length === 0 ? (
              <MenuItem value="" disabled>
                No enrollments available
              </MenuItem>
            ) : (
              completedEnrollments.map((enrollment) => (
                <MenuItem key={enrollment.id} value={enrollment.id}>
                  {enrollment.candidate?.fullName || 'Unknown Candidate'} - {enrollment.course?.title || 'Unknown Course'}
                  {enrollment.completionDate && ` (Completed: ${format(new Date(enrollment.completionDate), 'MMM dd, yyyy')})`}
                </MenuItem>
              ))
            )}
          </TextField>

          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={500}>
                Use Custom Name on Certificate
              </Typography>
              <Button
                size="small"
                variant={useCustomName ? 'contained' : 'outlined'}
                onClick={() => setUseCustomName(!useCustomName)}
              >
                {useCustomName ? 'Yes' : 'No'}
              </Button>
            </Stack>

            {useCustomName && (
              <TextField
                label="Custom Name for Certificate"
                fullWidth
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., John Doe"
                helperText="This name will appear on the certificate instead of the candidate's registered name"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setGenerateDialogOpen(false);
            setSelectedEnrollment('');
            setCustomName('');
            setUseCustomName(false);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateCertificate}
            variant="contained"
            color="primary"
            disabled={!selectedEnrollment || generateLoading || (useCustomName && !customName.trim())}
            startIcon={generateLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {generateLoading ? 'Generating...' : 'Generate Certificate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Certificate Name Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Certificate Details</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            Update the candidate's name and course details as they should appear on the certificate. This is useful for correcting typos or formatting issues.
          </Alert>
          <TextField
            autoFocus
            label="Candidate Name on Certificate"
            fullWidth
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            placeholder="e.g., John Doe"
            helperText="Enter the correct name as it should appear on the certificate"
            sx={{ mt: 2 }}
          />
          <TextField
            label="Course Name (Optional)"
            fullWidth
            value={editedCourseName}
            onChange={(e) => setEditedCourseName(e.target.value)}
            placeholder="e.g., Introduction to Programming"
            helperText="Override the course name if needed"
            sx={{ mt: 2 }}
          />
          <TextField
            label="Course Code (Optional)"
            fullWidth
            value={editedCourseCode}
            onChange={(e) => setEditedCourseCode(e.target.value)}
            placeholder="e.g., CS101"
            helperText="Override the course code if needed"
            sx={{ mt: 2 }}
          />
          {editedCertificate && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Certificate Details
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Course:</strong> {editedCertificate.courseName}
              </Typography>
              <Typography variant="body2">
                <strong>Certificate #:</strong> {editedCertificate.certificateNumber}
              </Typography>
              <Typography variant="body2">
                <strong>Issue Date:</strong> {editedCertificate.issueDate ? format(new Date(editedCertificate.issueDate), 'MMM dd, yyyy') : '—'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            setEditedCertificate(null);
            setEditedName('');
            setEditedCourseName('');
            setEditedCourseCode('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleDownloadPreview}
            variant="outlined"
            color="primary"
            disabled={!editedName.trim() || !editedCertificate}
          >
            Download Preview
          </Button>
          <Button
            onClick={handleEditCertificate}
            variant="contained"
            color="primary"
            disabled={!editedName.trim()}
            startIcon={<EditIcon />}
          >
            Update Certificate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateList;
