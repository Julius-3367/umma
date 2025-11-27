import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
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
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import trainerService from '../../api/trainer';

const CourseStudents = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuStudent, setMenuStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log('Fetching students for course:', courseId);
      const response = await trainerService.getCourseStudents(courseId);
      console.log('Students response:', response);
      const studentData = response?.data?.data || [];
      console.log('Student data:', studentData);
      setStudents(studentData);
    } catch (error) {
      console.error('Error fetching students:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to load students', { variant: 'error' });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    console.log('Filtering students. Total:', students.length, 'Search:', searchTerm, 'Filter:', statusFilter);
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(enrollment => {
        const candidate = enrollment.candidate;
        const searchLower = searchTerm.toLowerCase();
        return (
          candidate?.firstName?.toLowerCase().includes(searchLower) ||
          candidate?.lastName?.toLowerCase().includes(searchLower) ||
          candidate?.user?.email?.toLowerCase().includes(searchLower) ||
          candidate?.user?.phone?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(enrollment => enrollment.status === statusFilter);
    }

    console.log('Filtered students:', filtered.length);
    setFilteredStudents(filtered);
  };

  const handleMenuOpen = (event, student) => {
    setAnchorEl(event.currentTarget);
    setMenuStudent(student);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuStudent(null);
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setDetailsDialogOpen(true);
    handleMenuClose();
  };

  const handleContactStudent = (student, type) => {
    if (type === 'email') {
      window.location.href = `mailto:${student.candidate?.user?.email}`;
    } else if (type === 'phone') {
      window.location.href = `tel:${student.candidate?.user?.phone}`;
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'DROPPED':
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/trainer/my-courses')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom>Course Students</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and view students enrolled in this course
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Students
              </Typography>
              <Typography variant="h4">{students.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Active
              </Typography>
              <Typography variant="h4" color="success.main">
                {students.filter(s => s.status === 'ACTIVE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {students.filter(s => s.status === 'PENDING').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Completed
              </Typography>
              <Typography variant="h4" color="info.main">
                {students.filter(s => s.status === 'COMPLETED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by name, email, or phone..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1, minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="DROPPED">Dropped</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <Alert severity="info">No students found matching your criteria.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Enrolled Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((enrollment) => {
                const candidate = enrollment.candidate;
                return (
                  <TableRow key={enrollment.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(candidate?.firstName, candidate?.lastName)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {candidate?.firstName} {candidate?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {candidate?.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {candidate?.user?.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{candidate.user.email}</Typography>
                          </Box>
                        )}
                        {candidate?.user?.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{candidate.user.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={enrollment.status || 'Unknown'}
                        color={getStatusColor(enrollment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, enrollment)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewDetails(menuStudent)}>
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleContactStudent(menuStudent, 'email')}>
          <EmailIcon fontSize="small" sx={{ mr: 1 }} />
          Send Email
        </MenuItem>
        <MenuItem onClick={() => handleContactStudent(menuStudent, 'phone')}>
          <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
          Call Student
        </MenuItem>
      </Menu>

      {/* Student Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Student Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedStudent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                  {getInitials(
                    selectedStudent.candidate?.firstName,
                    selectedStudent.candidate?.lastName
                  )}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedStudent.candidate?.firstName} {selectedStudent.candidate?.lastName}
                  </Typography>
                  <Chip
                    label={selectedStudent.status}
                    color={getStatusColor(selectedStudent.status)}
                    size="small"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Contact Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" />
                    <Typography variant="body2">
                      {selectedStudent.candidate?.user?.email || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" />
                    <Typography variant="body2">
                      {selectedStudent.candidate?.user?.phone || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Enrollment Details
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Enrolled Date
                    </Typography>
                    <Typography variant="body2">
                      {selectedStudent.enrolledAt
                        ? new Date(selectedStudent.enrolledAt).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="body2">{selectedStudent.status || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseStudents;
