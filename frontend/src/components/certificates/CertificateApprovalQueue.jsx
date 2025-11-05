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
  Stack,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  HourglassEmpty,
  EmojiEvents,
  Refresh as RefreshIcon,
  Search,
} from '@mui/icons-material';
import { adminService } from '../../api/admin';
import { format } from 'date-fns';

const CertificateApprovalQueue = () => {
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [action, setAction] = useState('');
  const [grade, setGrade] = useState('');
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({
    courseId: '',
    search: '',
  });

  useEffect(() => {
    fetchApprovalQueue();
    fetchTemplates();
    fetchCourses();
  }, [filters]);

  const fetchApprovalQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch certificates with PENDING status
      const data = await adminService.getCertificates({ 
        status: 'pending',
        ...filters 
      });
      setApprovalQueue(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch approval queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await adminService.getCertificateTemplates();
      setTemplates(data.filter(t => t.isActive));
    } catch (err) {
      console.error('Failed to fetch templates:', err);
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

  const handleApprove = (certificate) => {
    setSelectedCertificate(certificate);
    setAction('approve');
    setGrade('');
    setRemarks('');
    setSelectedTemplate('');
    setDialogOpen(true);
  };

  const handleReject = (certificate) => {
    setSelectedCertificate(certificate);
    setAction('reject');
    setRejectionReason('');
    setDialogOpen(true);
  };

  const handleSubmitApproval = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (action === 'approve') {
        // Generate the certificate
        await adminService.generateCertificate({
          enrollmentId: selectedCertificate.enrollmentId,
          templateId: selectedTemplate || null,
          grade: grade || null,
          remarks: remarks || null,
        });
        setSuccess(`Certificate approved and generated for ${selectedCertificate.candidateName}`);
      } else {
        // Reject - Update the enrollment or handle rejection
        setSuccess(`Certificate request rejected for ${selectedCertificate.candidateName}`);
      }

      setDialogOpen(false);
      setSelectedCertificate(null);
      setGrade('');
      setRemarks('');
      setRejectionReason('');
      setSelectedTemplate('');
      fetchApprovalQueue();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} certificate`);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedQueue = approvalQueue.slice(
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

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <HourglassEmpty sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {approvalQueue.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Approvals
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search by name, email..."
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ minWidth: 300 }}
        />
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
          onClick={fetchApprovalQueue}
        >
          Refresh
        </Button>
      </Stack>

      {/* Approval Queue Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : approvalQueue.length === 0 ? (
        <Alert severity="info">No pending certificate approvals</Alert>
      ) : (
        <>
          <TableContainer component={Box}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell>Certificate #</TableCell>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedQueue.map((certificate) => (
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
                      {format(new Date(certificate.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="PENDING"
                        color="warning"
                        size="small"
                        icon={<HourglassEmpty fontSize="small" />}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Approve">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleApprove(certificate)}
                          >
                            Approve
                          </Button>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleReject(certificate)}
                          >
                            Reject
                          </Button>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={approvalQueue.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </>
      )}

      {/* Approval/Rejection Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {action === 'approve' ? 'Approve Certificate' : 'Reject Certificate'}
        </DialogTitle>
        <DialogContent>
          {selectedCertificate && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Candidate: <strong>{selectedCertificate.candidateName}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Course: <strong>{selectedCertificate.courseName}</strong>
              </Typography>
            </Box>
          )}

          {action === 'approve' ? (
            <>
              <TextField
                select
                label="Certificate Template"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                fullWidth
                margin="normal"
                required
              >
                <MenuItem value="">Default Template</MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Grade (Optional)"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="e.g., A, B+, 95%, Pass"
              />
              <TextField
                label="Remarks (Optional)"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                fullWidth
                margin="normal"
                multiline
                rows={3}
                placeholder="Additional comments or achievements"
              />
            </>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will reject the certificate request. Please provide a reason.
              </Alert>
              <TextField
                label="Rejection Reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                fullWidth
                margin="normal"
                multiline
                rows={4}
                required
                placeholder="Reason for rejection"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitApproval}
            variant="contained"
            color={action === 'approve' ? 'success' : 'error'}
            disabled={action === 'reject' && !rejectionReason}
          >
            {action === 'approve' ? 'Approve & Generate' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateApprovalQueue;
