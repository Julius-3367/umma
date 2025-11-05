import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  CalendarMonth,
  Download,
  Send,
  CheckCircle,
  Cancel,
  AccessTime,
  TrendingUp,
  People,
  EventNote,
  Search,
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { adminService } from '../../api/admin';

// Attendance status options
const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
};

const STATUS_CONFIG = {
  present: { label: 'Present', icon: CheckCircle, color: 'success' },
  absent: { label: 'Absent', icon: Cancel, color: 'error' },
  late: { label: 'Late', icon: AccessTime, color: 'warning' },
};

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch students and attendance when course/date changes
  useEffect(() => {
    if (selectedCourse) {
      fetchStudentsAndAttendance();
      fetchStatistics();
    }
  }, [selectedCourse, selectedDate]);

  const fetchCourses = async () => {
    try {
      const response = await adminService.getAllCourses();
      setCourses(response.data.data || []);
    } catch (error) {
      showSnackbar('Failed to load courses', 'error');
    }
  };

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAttendance(
        selectedCourse,
        format(selectedDate, 'yyyy-MM-dd')
      );
      
      const data = response.data.data;
      setStudents(data.students || []);
      
      // Initialize attendance state
      const attendanceMap = {};
      const remarksMap = {};
      
      data.attendance?.forEach(record => {
        attendanceMap[record.studentId] = record.status;
        remarksMap[record.studentId] = record.remarks || '';
      });
      
      setAttendance(attendanceMap);
      setRemarks(remarksMap);
    } catch (error) {
      showSnackbar('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const weekStart = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(selectedDate), 'yyyy-MM-dd');
      
      const response = await adminService.getAttendanceStatistics(
        selectedCourse,
        weekStart,
        weekEnd
      );
      
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleRemarksChange = (studentId, value) => {
    setRemarks(prev => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleBulkAction = (status) => {
    const filteredStudents = getFilteredStudents();
    const newAttendance = { ...attendance };
    
    filteredStudents.forEach(student => {
      newAttendance[student.id] = status;
    });
    
    setAttendance(newAttendance);
    showSnackbar(`Marked ${filteredStudents.length} students as ${STATUS_CONFIG[status].label}`, 'success');
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourse) {
      showSnackbar('Please select a course', 'warning');
      return;
    }

    setLoading(true);
    try {
      const attendanceRecords = students.map(student => ({
        studentId: student.id,
        courseId: selectedCourse,
        date: format(selectedDate, 'yyyy-MM-dd'),
        status: attendance[student.id] || ATTENDANCE_STATUS.ABSENT,
        remarks: remarks[student.id] || '',
      }));

      await adminService.saveAttendance({
        courseId: selectedCourse,
        date: format(selectedDate, 'yyyy-MM-dd'),
        records: attendanceRecords,
      });

      showSnackbar('Attendance saved successfully', 'success');
      fetchStatistics();
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to save attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotifications = async () => {
    const absentStudents = students.filter(s => attendance[s.id] === ATTENDANCE_STATUS.ABSENT);
    
    if (absentStudents.length === 0) {
      showSnackbar('No absent students to notify', 'info');
      return;
    }

    setLoading(true);
    try {
      await adminService.sendAttendanceNotifications({
        courseId: selectedCourse,
        date: format(selectedDate, 'yyyy-MM-dd'),
        studentIds: absentStudents.map(s => s.id),
      });

      showSnackbar(`Notifications sent to ${absentStudents.length} students`, 'success');
    } catch (error) {
      showSnackbar('Failed to send notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAttendance = async () => {
    try {
      const weekStart = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(selectedDate), 'yyyy-MM-dd');
      
      const response = await adminService.exportAttendance({
        courseId: selectedCourse,
        startDate: weekStart,
        endDate: weekEnd,
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${format(selectedDate, 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showSnackbar('Attendance exported successfully', 'success');
      setExportDialogOpen(false);
    } catch (error) {
      showSnackbar('Failed to export attendance', 'error');
    }
  };

  const getFilteredStudents = () => {
    if (!searchQuery) return students;
    
    const query = searchQuery.toLowerCase();
    return students.filter(student =>
      student.firstName?.toLowerCase().includes(query) ||
      student.lastName?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query)
    );
  };

  const calculateDailySummary = () => {
    const summary = {
      total: students.length,
      present: 0,
      absent: 0,
      late: 0,
      unmarked: 0,
    };

    students.forEach(student => {
      const status = attendance[student.id];
      if (status) {
        summary[status]++;
      } else {
        summary.unmarked++;
      }
    });

    return summary;
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const summary = calculateDailySummary();
  const filteredStudents = getFilteredStudents();
  const attendanceRate = summary.total > 0 
    ? ((summary.present / summary.total) * 100).toFixed(1)
    : 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Attendance Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Mark and manage student attendance for courses
        </Typography>
      </Box>

      {/* Controls Row */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          {/* Date Selection */}
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CalendarMonth />}
              onClick={() => setShowCalendar(!showCalendar)}
              sx={{ py: 1.5 }}
            >
              {format(selectedDate, 'MMM dd, yyyy')}
              {isToday(selectedDate) && (
                <Chip label="Today" size="small" color="primary" sx={{ ml: 1 }} />
              )}
            </Button>
          </Grid>

          {/* Course Selection */}
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
                {courses.map(course => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Search */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Export Attendance">
                <IconButton
                  color="primary"
                  onClick={() => setExportDialogOpen(true)}
                  disabled={!selectedCourse}
                >
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Send Absence Notifications">
                <IconButton
                  color="secondary"
                  onClick={handleSendNotifications}
                  disabled={!selectedCourse || loading}
                >
                  <Send />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {/* Calendar Popup */}
        {showCalendar && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                value={selectedDate}
                onChange={(newDate) => {
                  setSelectedDate(newDate);
                  setShowCalendar(false);
                }}
              />
            </LocalizationProvider>
          </Box>
        )}
      </Paper>

      {/* Summary Statistics */}
      {selectedCourse && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <People sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {summary.total}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Students
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" component="div" color="success.main">
                    {summary.present}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Present ({attendanceRate}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Cancel sx={{ color: 'error.main', mr: 1 }} />
                  <Typography variant="h6" component="div" color="error.main">
                    {summary.absent}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Absent
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTime sx={{ color: 'warning.main', mr: 1 }} />
                  <Typography variant="h6" component="div" color="warning.main">
                    {summary.late}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Late
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Bulk Actions */}
      {selectedCourse && filteredStudents.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Bulk Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircle />}
                onClick={() => handleBulkAction(ATTENDANCE_STATUS.PRESENT)}
              >
                Mark All Present
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<Cancel />}
                onClick={() => handleBulkAction(ATTENDANCE_STATUS.ABSENT)}
              >
                Mark All Absent
              </Button>
              <Button
                variant="contained"
                color="warning"
                size="small"
                startIcon={<AccessTime />}
                onClick={() => handleBulkAction(ATTENDANCE_STATUS.LATE)}
              >
                Mark All Late
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Attendance Table */}
      {selectedCourse ? (
        filteredStudents.length > 0 ? (
          <Paper sx={{ mb: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {student.firstName} {student.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {student.email}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <ToggleButtonGroup
                          value={attendance[student.id]}
                          exclusive
                          onChange={(e, newStatus) => {
                            if (newStatus !== null) {
                              handleStatusChange(student.id, newStatus);
                            }
                          }}
                          size="small"
                        >
                          <ToggleButton value={ATTENDANCE_STATUS.PRESENT} color="success">
                            <CheckCircle fontSize="small" />
                          </ToggleButton>
                          <ToggleButton value={ATTENDANCE_STATUS.ABSENT} color="error">
                            <Cancel fontSize="small" />
                          </ToggleButton>
                          <ToggleButton value={ATTENDANCE_STATUS.LATE} color="warning">
                            <AccessTime fontSize="small" />
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="Add remarks..."
                          value={remarks[student.id] || ''}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Save Button */}
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<EventNote />}
                onClick={handleSaveAttendance}
                disabled={loading}
              >
                Save Attendance
              </Button>
            </Box>
          </Paper>
        ) : (
          <Alert severity="info">
            No students found{searchQuery ? ' matching your search' : ' for this course'}.
          </Alert>
        )
      ) : (
        <Alert severity="info" icon={<CalendarMonth />}>
          Select a course to view and mark attendance
        </Alert>
      )}

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Attendance</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Export attendance data for the selected week ({format(startOfWeek(selectedDate), 'MMM dd')} - {format(endOfWeek(selectedDate), 'MMM dd, yyyy')})
          </Typography>
          <Alert severity="info">
            The attendance sheet will be downloaded as a CSV file.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExportAttendance} variant="contained" startIcon={<Download />}>
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Attendance;
