import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import trainerService from '../../api/trainer';

const defaultAssessmentForm = {
  enrollmentId: '',
  assessmentType: 'Quiz',
  score: '',
  resultCategory: 'PASS',
  trainerComments: '',
};

const TrainerAssessments = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseDetails, setCourseDetails] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState(defaultAssessmentForm);
  const [saving, setSaving] = useState(false);

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
    const fetchDetails = async () => {
      if (!selectedCourseId) {
        setCourseDetails(null);
        return;
      }

      try {
        setLoadingDetails(true);
        const response = await trainerService.getCourseDetails(selectedCourseId);
        setCourseDetails(response?.data?.data || null);
      } catch (error) {
        console.error('Error loading course details', error);
        enqueueSnackbar('Failed to load assessments', { variant: 'error' });
        setCourseDetails(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedCourseId, enqueueSnackbar]);

  const assessments = courseDetails?.assessments || [];
  const enrollments = courseDetails?.enrollments || [];

  const filteredAssessments = useMemo(() => {
    let filtered = [...assessments];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => {
        const candidateName = (item.enrollment?.candidate?.fullName || '').toLowerCase();
        return (
          candidateName.includes(lower) ||
          (item.assessmentType || '').toLowerCase().includes(lower)
        );
      });
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((item) => item.assessmentType === typeFilter);
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((item) => (item.resultCategory || '').toUpperCase() === statusFilter);
    }

    return filtered;
  }, [assessments, searchTerm, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    if (!assessments.length) {
      return { total: 0, averageScore: 0, passRate: 0 };
    }

    const total = assessments.length;
    const averageScore = (assessments.reduce((sum, a) => sum + (a.score || 0), 0) / total).toFixed(1);
    const passCount = assessments.filter((a) => (a.resultCategory || '').toUpperCase() === 'PASS').length;

    return {
      total,
      averageScore,
      passRate: Math.round((passCount / total) * 100),
    };
  }, [assessments]);

  const handleOpenCreateDialog = () => {
    setFormData({ ...defaultAssessmentForm, enrollmentId: enrollments[0]?.id || '' });
    setCreateDialogOpen(true);
  };

  const handleCreateAssessment = async () => {
    if (!selectedCourseId || !formData.enrollmentId) {
      enqueueSnackbar('Select both course and student', { variant: 'warning' });
      return;
    }

    try {
      setSaving(true);
      await trainerService.createAssessment({ ...formData, courseId: selectedCourseId });
      enqueueSnackbar('Assessment recorded successfully', { variant: 'success' });
      setCreateDialogOpen(false);
      setFormData(defaultAssessmentForm);
      const response = await trainerService.getCourseDetails(selectedCourseId);
      setCourseDetails(response?.data?.data || null);
    } catch (error) {
      console.error('Error creating assessment', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to save assessment', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'PASS':
        return 'success';
      case 'MERIT':
        return 'info';
      case 'DISTINCTION':
        return 'primary';
      case 'FAIL':
        return 'error';
      default:
        return 'default';
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
        <Alert severity="info">No courses available yet. Assessments will appear once courses are assigned.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Assessments</Typography>
          <Typography variant="body2" color="text.secondary">
            Track and record candidate assessments across all courses
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          disabled={!enrollments.length}
        >
          New Assessment
        </Button>
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
            placeholder="Search assessments"
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
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="Quiz">Quiz</MenuItem>
            <MenuItem value="Assignment">Assignment</MenuItem>
            <MenuItem value="Assessment">Assessment</MenuItem>
            <MenuItem value="Project">Project</MenuItem>
            <MenuItem value="Final">Final</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Result"
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
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="PASS">Pass</MenuItem>
            <MenuItem value="MERIT">Merit</MenuItem>
            <MenuItem value="DISTINCTION">Distinction</MenuItem>
            <MenuItem value="FAIL">Fail</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[{
          label: 'Assessments Recorded',
          value: stats.total,
          color: 'primary.main',
        }, {
          label: 'Average Score',
          value: `${stats.averageScore}%`,
          color: 'info.main',
        }, {
          label: 'Pass Rate',
          value: `${stats.passRate}%`,
          color: 'success.main',
        }].map((stat) => (
          <Grid item xs={12} md={4} key={stat.label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                <Typography variant="h4" sx={{ color: stat.color }}>{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loadingDetails ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : !assessments.length ? (
        <Alert severity="info">No assessments recorded for this course yet.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Candidate</TableCell>
                <TableCell>Assessment</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssessments.map((assessment) => (
                <TableRow key={assessment.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {assessment.enrollment?.candidate?.fullName || 'Candidate'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {assessment.enrollment?.candidate?.user?.email || 'Email unavailable'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssessmentIcon fontSize="small" color="action" />
                      <Typography variant="body2">{assessment.assessmentType}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {assessment.trainerComments || 'No notes'}
                    </Typography>
                  </TableCell>
                  <TableCell>{assessment.score ?? 'N/A'}%</TableCell>
                  <TableCell>
                    {assessment.assessmentDate ? new Date(assessment.assessmentDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={assessment.resultCategory || 'Pending'}
                      color={statusColor(assessment.resultCategory)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Record Assessment</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Student"
                value={formData.enrollmentId}
                onChange={(e) => setFormData({ ...formData, enrollmentId: e.target.value })}
              >
                {enrollments.map((enrollment) => (
                  <MenuItem key={enrollment.id} value={enrollment.id}>
                    {enrollment.candidate?.firstName} {enrollment.candidate?.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Assessment Type"
                value={formData.assessmentType}
                onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
              >
                <MenuItem value="Quiz">Quiz</MenuItem>
                <MenuItem value="Assignment">Assignment</MenuItem>
                <MenuItem value="Assessment">Assessment</MenuItem>
                <MenuItem value="Project">Project</MenuItem>
                <MenuItem value="Final">Final</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Score (%)"
                type="number"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Result"
                value={formData.resultCategory}
                onChange={(e) => setFormData({ ...formData, resultCategory: e.target.value })}
              >
                <MenuItem value="PASS">Pass</MenuItem>
                <MenuItem value="MERIT">Merit</MenuItem>
                <MenuItem value="DISTINCTION">Distinction</MenuItem>
                <MenuItem value="FAIL">Fail</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Trainer Notes"
                value={formData.trainerComments}
                onChange={(e) => setFormData({ ...formData, trainerComments: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleCreateAssessment} variant="contained" disabled={saving}>
            {saving ? 'Saving…' : 'Save Assessment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainerAssessments;
