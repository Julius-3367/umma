import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as LateIcon,
  EventNote as CalendarIcon,
  School as CourseIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useSnackbar } from 'notistack';
import adminService from '../../api/admin';

const AttendanceManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [candidates, setCandidates] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [remarks, setRemarks] = useState({});
  const [sessionNumber, setSessionNumber] = useState(1);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [statistics, setStatistics] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCandidates();
      fetchExistingAttendance();
    }
  }, [selectedCourse, selectedDate]);

  useEffect(() => {
    calculateStatistics();
  }, [attendance, candidates]);

  const fetchCourses = async () => {
    try {
      const response = await adminService.getAllCourses();
      // API returns: { success, data: { courses, total, ... } }
      const coursesData = response?.data?.courses || [];
      const activeCourses = coursesData.filter(c => c.status === 'ACTIVE' || c.status === 'PUBLISHED');
      setCourses(Array.isArray(activeCourses) ? activeCourses : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      enqueueSnackbar('Failed to load courses', { variant: 'error' });
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // Get enrollments for the selected course
      const response = await adminService.getEnrollments();
      const enrollmentsData = response?.data?.data?.enrollments || [];

      // Filter candidates enrolled in selected course
      const courseCandidates = enrollmentsData
        .filter(e => e.courseId === parseInt(selectedCourse) && e.enrollmentStatus === 'ENROLLED')
        .map(e => ({
          id: e.candidateId,
          enrollmentId: e.id,
          fullName: e.candidate?.fullName || 'Unknown',
          email: e.candidate?.user?.email || '',
        }));

      setCandidates(courseCandidates);

      // Initialize attendance state for new candidates
      const initialAttendance = {};
      courseCandidates.forEach(c => {
        if (!attendance[c.id]) {
          initialAttendance[c.id] = null;
        }
      });
      setAttendance(prev => ({ ...prev, ...initialAttendance }));
    } catch (error) {
      console.error('Error fetching candidates:', error);
      enqueueSnackbar('Failed to load candidates', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const response = await adminService.getAttendance(selectedCourse, selectedDate);
      const attendanceData = response?.data?.data || response?.data || [];

      // Map existing attendance to state
      const existingAttendance = {};
      const existingRemarks = {};

      attendanceData.forEach(record => {
        existingAttendance[record.candidateId] = record.status;
        existingRemarks[record.candidateId] = record.remarks || '';
      });

      setAttendance(existingAttendance);
      setRemarks(existingRemarks);

      // Set session number from first record
      if (attendanceData.length > 0) {
        setSessionNumber(attendanceData[0].sessionNumber || 1);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      // Don't show error if no attendance exists yet
    }
  };

  const calculateStatistics = () => {
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      total: candidates.length,
    };

    Object.values(attendance).forEach(status => {
      if (status === 'PRESENT') stats.present++;
      else if (status === 'ABSENT') stats.absent++;
      else if (status === 'LATE') stats.late++;
    });

    setStatistics(stats);
  };

  const handleAttendanceChange = (candidateId, status) => {
    setAttendance(prev => ({
      ...prev,
      [candidateId]: prev[candidateId] === status ? null : status,
    }));
  };

  const handleRemarksChange = (candidateId, value) => {
    setRemarks(prev => ({
      ...prev,
      [candidateId]: value,
    }));
  };

  const markAllPresent = () => {
    const allPresent = {};
    candidates.forEach(c => {
      allPresent[c.id] = 'PRESENT';
    });
    setAttendance(allPresent);
  };

  const handleSaveAttendance = async () => {
    try {
      setLoading(true);

      // Prepare attendance records
      const records = candidates
        .filter(c => attendance[c.id])
        .map(c => ({
          candidateId: c.id,
          courseId: parseInt(selectedCourse),
          sessionDate: selectedDate,
          sessionNumber: sessionNumber,
          status: attendance[c.id],
          remarks: remarks[c.id] || '',
        }));

      if (records.length === 0) {
        enqueueSnackbar('Please mark attendance for at least one candidate', { variant: 'warning' });
        return;
      }

      await adminService.saveAttendance({ records });

      enqueueSnackbar(`Attendance saved for ${records.length} candidates`, { variant: 'success' });
      setSaveDialogOpen(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save attendance', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const courseName = courses.find(c => c.id === parseInt(selectedCourse))?.title || 'Course';
    const headers = ['Candidate ID', 'Name', 'Email', 'Status', 'Remarks'];
    const rows = candidates.map(c => [
      c.id,
      c.fullName,
      c.email,
      attendance[c.id] || 'NOT_MARKED',
      remarks[c.id] || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${courseName}_${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PRESENT': return <PresentIcon color="success" />;
      case 'ABSENT': return <AbsentIcon color="error" />;
      case 'LATE': return <LateIcon color="warning" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return 'success';
      case 'ABSENT': return 'error';
      case 'LATE': return 'warning';
      default: return 'default';
    }
  };

  const attendancePercentage = statistics.total > 0
    ? Math.round((statistics.present / statistics.total) * 100)
    : 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Attendance Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mark and track candidate attendance for training sessions
          </Typography>
        </div>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
            disabled={!selectedCourse || candidates.length === 0}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => setSaveDialogOpen(true)}
            disabled={!selectedCourse || Object.keys(attendance).filter(k => attendance[k]).length === 0}
          >
            Save Attendance
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Course</InputLabel>
                <Select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  label="Select Course"
                >
                  <MenuItem value="">
                    <em>Select a course</em>
                  </MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.title} ({course.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Session Date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Session #"
                value={sessionNumber}
                onChange={(e) => setSessionNumber(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={markAllPresent}
                disabled={!selectedCourse || candidates.length === 0}
                sx={{ height: '56px' }}
              >
                Mark All Present
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics */}
      {selectedCourse && candidates.length > 0 && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <PersonIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  <div>
                    <Typography variant="h4">{statistics.total}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Candidates
                    </Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <PresentIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  <div>
                    <Typography variant="h4" color="success.main">
                      {statistics.present}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Present ({attendancePercentage}%)
                    </Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <LateIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                  <div>
                    <Typography variant="h4" color="warning.main">
                      {statistics.late}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Late
                    </Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <AbsentIcon sx={{ fontSize: 40, color: 'error.main' }} />
                  <div>
                    <Typography variant="h4" color="error.main">
                      {statistics.absent}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Absent
                    </Typography>
                  </div>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Attendance Table */}
      <Card>
        <CardContent>
          {!selectedCourse ? (
            <Box py={8} textAlign="center">
              <CourseIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select a Course
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a course and date to mark attendance
              </Typography>
            </Box>
          ) : loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : candidates.length === 0 ? (
            <Box py={8} textAlign="center">
              <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Candidates Enrolled
              </Typography>
              <Typography variant="body2" color="text.secondary">
                There are no candidates enrolled in this course
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="50">#</TableCell>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="center">Mark Attendance</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.map((candidate, index) => (
                    <TableRow key={candidate.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {candidate.fullName?.charAt(0) || 'C'}
                          </Avatar>
                          <div>
                            <Typography variant="body1" fontWeight={500}>
                              {candidate.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {candidate.id}
                            </Typography>
                          </div>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{candidate.email}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <ToggleButtonGroup
                          value={attendance[candidate.id]}
                          exclusive
                          onChange={(e, value) => value && handleAttendanceChange(candidate.id, value)}
                          size="small"
                        >
                          <ToggleButton value="PRESENT" color="success">
                            <Tooltip title="Present">
                              <PresentIcon />
                            </Tooltip>
                          </ToggleButton>
                          <ToggleButton value="LATE" color="warning">
                            <Tooltip title="Late">
                              <LateIcon />
                            </Tooltip>
                          </ToggleButton>
                          <ToggleButton value="ABSENT" color="error">
                            <Tooltip title="Absent">
                              <AbsentIcon />
                            </Tooltip>
                          </ToggleButton>
                        </ToggleButtonGroup>
                        {attendance[candidate.id] && (
                          <Chip
                            label={attendance[candidate.id]}
                            color={getStatusColor(attendance[candidate.id])}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="Add remarks..."
                          value={remarks[candidate.id] || ''}
                          onChange={(e) => handleRemarksChange(candidate.id, e.target.value)}
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Save Confirmation Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Attendance</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            You are about to save attendance for <strong>{Object.keys(attendance).filter(k => attendance[k]).length}</strong> candidates
          </Alert>
          <Typography variant="body2">
            Course: <strong>{courses.find(c => c.id === parseInt(selectedCourse))?.title}</strong>
          </Typography>
          <Typography variant="body2">
            Date: <strong>{format(new Date(selectedDate), 'MMMM dd, yyyy')}</strong>
          </Typography>
          <Typography variant="body2">
            Session: <strong>#{sessionNumber}</strong>
          </Typography>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              • Present: {statistics.present}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Late: {statistics.late}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Absent: {statistics.absent}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveAttendance}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Confirm & Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceManagement;
