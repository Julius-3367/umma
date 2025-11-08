import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  Refresh,
  School,
} from '@mui/icons-material';
import { adminService } from '../../api/admin';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setcourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCourses, setTotalCourses] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [page, rowsPerPage, searchQuery, statusFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;

      const response = await adminService.getAllCourses(params);
      setcourses(response.data.data.courses || []);
      setTotalCourses(response.data.data.total || 0);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmActionCourse, setConfirmActionCourse] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleOpenDelete = (course) => {
    setConfirmActionCourse(course);
    setConfirmDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setConfirmActionCourse(null);
    setConfirmDeleteOpen(false);
  };

  const handleDeleteCourse = async () => {
    if (!confirmActionCourse) return;
    try {
      setActionLoading(true);
      await adminService.deleteCourse(confirmActionCourse.id);
      // Optimistic update
      setcourses((prev) => prev.filter((c) => c.id !== confirmActionCourse.id));
      setSuccess('Course deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setActionLoading(false);
      handleCloseDelete();
    }
  };

  const handlePublishCourse = async (course) => {
    try {
      setActionLoading(true);
      const payload = { status: 'ACTIVE' };
      const response = await adminService.updateCourse(course.id, payload);
      if (response.data.success) {
        setcourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, status: 'ACTIVE' } : c)));
        setSuccess('Course published successfully');
      }
    } catch (err) {
      console.error('Publish error:', err);
      setError(err.response?.data?.message || 'Failed to publish course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <School fontSize="large" color="primary" />
          <Typography variant="h4" fontWeight="bold">
            Course Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/admin/courses/new')}
        >
          Add New Course
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search by course title or code..."
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Refresh">
            <IconButton onClick={fetchCourses}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Courses Table */}
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
                  <TableCell>Code</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary">No courses found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course) => (
                    <TableRow key={course.id} hover>
                      <TableCell>
                        <Typography fontWeight="bold">{course.code}</Typography>
                      </TableCell>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>
                        {course.category ? (
                          <Chip label={course.category} size="small" variant="outlined" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{course.durationDays} days</TableCell>
                      <TableCell>
                        {course.startDate
                          ? new Date(course.startDate).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {course.endDate
                          ? new Date(course.endDate).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>{course.capacity || 'Unlimited'}</TableCell>
                      <TableCell>
                        <Chip
                          label={course.status}
                          size="small"
                          color={getStatusColor(course.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/courses/${course.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          {course.status === 'DRAFT' && (
                            <Tooltip title="Publish">
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => handlePublishCourse(course)}
                              >
                                Publish
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleOpenDelete(course)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>
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
              count={totalCourses}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </TableContainer>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDeleteOpen} onClose={handleCloseDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the course "{confirmActionCourse?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} disabled={actionLoading}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteCourse} disabled={actionLoading}>
            {actionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {success && (
        <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default Courses;
