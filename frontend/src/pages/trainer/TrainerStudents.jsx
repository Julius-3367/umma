import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import trainerService from '../../api/trainer';
import CandidateProfileDialog from '../../components/trainer/CandidateProfileDialog';

const TrainerStudents = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reloadKey, setReloadKey] = useState(0);
  
  // Profile dialog state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  
  // Assessment dialog state
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [assessmentCandidate, setAssessmentCandidate] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState({
    assessmentType: 'Quiz',
    score: '',
    resultCategory: 'PASS',
    trainerComments: '',
  });
  const [savingAssessment, setSavingAssessment] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await trainerService.getMyCourses();
        const data = response?.data?.data || [];
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(String(data[0].id));
        }
      } catch (error) {
        console.error('Error loading courses', error);
        enqueueSnackbar('Failed to load courses', { variant: 'error' });
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [enqueueSnackbar]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourseId) {
        setStudents([]);
        return;
      }

      try {
        setLoadingStudents(true);
        const response = await trainerService.getCourseStudents(selectedCourseId);
        setStudents(response?.data?.data || []);
      } catch (error) {
        console.error('Error loading students', error);
        enqueueSnackbar('Failed to load students', { variant: 'error' });
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedCourseId, enqueueSnackbar, reloadKey]);

  const handleRefresh = () => setReloadKey((prev) => prev + 1);

  const handleViewProfile = (candidateId) => {
    setSelectedCandidateId(candidateId);
    setProfileDialogOpen(true);
  };

  const handleOpenAssessment = (enrollment) => {
    setAssessmentCandidate(enrollment);
    setAssessmentForm({
      assessmentType: 'Quiz',
      score: '',
      resultCategory: 'PASS',
      trainerComments: '',
    });
    setAssessmentDialogOpen(true);
  };

  const handleCreateAssessment = async () => {
    if (!assessmentForm.score || !assessmentCandidate) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'warning' });
      return;
    }

    try {
      setSavingAssessment(true);
      await trainerService.createCandidateAssessment(assessmentCandidate.candidate.id, {
        courseId: selectedCourseId,
        ...assessmentForm,
      });
      enqueueSnackbar('Assessment recorded successfully', { variant: 'success' });
      setAssessmentDialogOpen(false);
      handleRefresh();
    } catch (error) {
      console.error('Error creating assessment:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to create assessment', { variant: 'error' });
    } finally {
      setSavingAssessment(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((enrollment) => {
        const candidate = enrollment.candidate || {};
        const email = candidate.user?.email?.toLowerCase() || '';
        const phone = candidate.user?.phone?.toLowerCase() || '';
        return (
          candidate.firstName?.toLowerCase().includes(lower) ||
          candidate.lastName?.toLowerCase().includes(lower) ||
          email.includes(lower) ||
          phone.includes(lower)
        );
      });
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((enrollment) => (enrollment.status || '').toUpperCase() === statusFilter);
    }

    return filtered;
  }, [students, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter((s) => s.status === 'ACTIVE').length,
    pending: students.filter((s) => s.status === 'PENDING').length,
    completed: students.filter((s) => s.status === 'COMPLETED').length,
  }), [students]);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getStatusColor = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'DROPPED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleViewCourse = () => {
    if (selectedCourseId) {
      navigate(`/trainer/courses/${selectedCourseId}/students`);
    }
  };

  if (loadingCourses) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!courses.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No courses assigned yet. Once courses are assigned, students will appear here.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Students</Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage all students enrolled across your courses
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={handleViewCourse}>
            Open Course View
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="Course"
            size="small"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.title}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            placeholder="Search by name, email, phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterIcon />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="ALL">All statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="DROPPED">Dropped</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[{
          label: 'Total Students',
          value: stats.total,
          color: 'primary.main',
        }, {
          label: 'Active',
          value: stats.active,
          color: 'success.main',
        }, {
          label: 'Pending',
          value: stats.pending,
          color: 'warning.main',
        }, {
          label: 'Completed',
          value: stats.completed,
          color: 'info.main',
        }].map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                <Typography variant="h4" sx={{ color: stat.color }}>{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loadingStudents ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : filteredStudents.length === 0 ? (
        <Alert severity="info">No students found for the selected filters.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Enrolled On</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((enrollment) => (
                <TableRow key={enrollment.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getInitials(enrollment.candidate?.firstName, enrollment.candidate?.lastName)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {enrollment.candidate?.firstName} {enrollment.candidate?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID #{enrollment.candidate?.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{enrollment.candidate?.user?.email || 'N/A'}</Typography>
                    <Typography variant="body2">{enrollment.candidate?.user?.phone || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={enrollment.status || 'Unknown'} color={getStatusColor(enrollment.status)} />
                  </TableCell>
                  <TableCell>
                    {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="View Profile">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewProfile(enrollment.candidate?.id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Run Assessment">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleOpenAssessment(enrollment)}
                        >
                          <AssessmentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Candidate Profile Dialog */}
      <CandidateProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        candidateId={selectedCandidateId}
      />

      {/* Assessment Dialog */}
      <Dialog 
        open={assessmentDialogOpen} 
        onClose={() => setAssessmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Record Assessment
          {assessmentCandidate && (
            <Typography variant="body2" color="text.secondary">
              {assessmentCandidate.candidate?.firstName} {assessmentCandidate.candidate?.lastName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Assessment Type"
                value={assessmentForm.assessmentType}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, assessmentType: e.target.value })}
              >
                <MenuItem value="Quiz">Quiz</MenuItem>
                <MenuItem value="Assignment">Assignment</MenuItem>
                <MenuItem value="Midterm">Midterm</MenuItem>
                <MenuItem value="Final">Final</MenuItem>
                <MenuItem value="Project">Project</MenuItem>
                <MenuItem value="Practical">Practical</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Score (%)"
                type="number"
                value={assessmentForm.score}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, score: Number(e.target.value) })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Result Category"
                value={assessmentForm.resultCategory}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, resultCategory: e.target.value })}
              >
                <MenuItem value="DISTINCTION">Distinction</MenuItem>
                <MenuItem value="MERIT">Merit</MenuItem>
                <MenuItem value="PASS">Pass</MenuItem>
                <MenuItem value="FAIL">Fail</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Comments"
                value={assessmentForm.trainerComments}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, trainerComments: e.target.value })}
                placeholder="Add your feedback and comments..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssessmentDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateAssessment}
            disabled={savingAssessment}
          >
            {savingAssessment ? 'Saving...' : 'Save Assessment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainerStudents;
