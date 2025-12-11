import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Stack,
  Divider,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CalendarToday,
  CheckCircle,
  Cancel,
  AccessTime,
  Refresh,
  Save,
  History as HistoryIcon,
  Gavel as AppealIcon,
  Pending as PendingIcon,
  ThumbUp as ApprovedIcon,
  ThumbDown as RejectedIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import trainerService from '../../api/trainer';
import attendanceAppealService from '../../api/attendanceAppeal';
import ReviewAppealDialog from '../../components/attendance/ReviewAppealDialog';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'LATE', label: 'Late' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'EXCUSED', label: 'Excused' },
];

const dateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
};

const TrainerAttendance = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionNumber, setSessionNumber] = useState(1);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [notesMap, setNotesMap] = useState({});
  const [history, setHistory] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Appeals state
  const [appeals, setAppeals] = useState([]);
  const [loadingAppeals, setLoadingAppeals] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

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
    if (!selectedCourseId) {
      return;
    }

    const fetchCourseData = async () => {
      try {
        setLoadingStudents(true);
        const [studentsResponse, attendanceResponse] = await Promise.all([
          trainerService.getCourseStudents(selectedCourseId),
          trainerService.getCourseAttendance(selectedCourseId),
        ]);

        setStudents(studentsResponse?.data?.data || []);
        setHistory(attendanceResponse?.data?.data || []);
      } catch (error) {
        console.error('Error loading course data', error);
        enqueueSnackbar('Failed to load course data', { variant: 'error' });
      } finally {
        setLoadingStudents(false);
        setLoadingHistory(false);
      }
    };

    setLoadingHistory(true);
    fetchCourseData();
  }, [selectedCourseId, enqueueSnackbar]);

  useEffect(() => {
    if (!history.length) {
      setAttendanceMap({});
      setNotesMap({});
      return;
    }

    const map = {};
    const notes = {};
    const dayRecords = history.filter((record) => dateKey(record.date) === selectedDate);

    dayRecords.forEach((record) => {
      map[record.enrollmentId] = record.status;
      notes[record.enrollmentId] = record.remarks || '';
      if (record.sessionNumber) {
        setSessionNumber(record.sessionNumber);
      }
    });

    setAttendanceMap(map);
    setNotesMap(notes);
  }, [history, selectedDate]);

  const stats = useMemo(() => {
    const totals = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      total: students.length,
    };

    students.forEach((enrollment) => {
      const status = attendanceMap[enrollment.id];
      if (status === 'PRESENT') totals.present += 1;
      if (status === 'LATE') totals.late += 1;
      if (status === 'ABSENT') totals.absent += 1;
      if (status === 'EXCUSED') totals.excused += 1;
    });

    return totals;
  }, [students, attendanceMap]);

  const groupedHistory = useMemo(() => {
    if (!history.length) return [];
    const groups = history.reduce((acc, record) => {
      const key = dateKey(record.date);
      if (!acc[key]) {
        acc[key] = { date: key, present: 0, late: 0, absent: 0, excused: 0 };
      }
      const bucket = record.status?.toLowerCase();
      if (bucket && acc[key][bucket] !== undefined) {
        acc[key][bucket] += 1;
      }
      return acc;
    }, {});

    return Object.values(groups)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [history]);

  const handleStatusChange = (enrollmentId, value) => {
    if (!value) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [enrollmentId]: prev[enrollmentId] === value ? undefined : value,
    }));
  };

  const handleNoteChange = (enrollmentId, value) => {
    setNotesMap((prev) => ({
      ...prev,
      [enrollmentId]: value,
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((enrollment) => {
      updated[enrollment.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSave = async () => {
    if (!selectedCourseId) {
      enqueueSnackbar('Select a course first', { variant: 'warning' });
      return;
    }

    const payloads = students
      .filter((enrollment) => attendanceMap[enrollment.id])
      .map((enrollment) => ({
        enrollmentId: enrollment.id,
        status: attendanceMap[enrollment.id],
        remarks: notesMap[enrollment.id] || undefined,
        date: selectedDate,
        sessionNumber,
      }));

    if (!payloads.length) {
      enqueueSnackbar('Mark at least one student before saving', { variant: 'info' });
      return;
    }

    try {
      setSaving(true);
      await Promise.all(payloads.map((record) => trainerService.recordAttendance(record)));
      enqueueSnackbar('Attendance saved successfully', { variant: 'success' });
      const refresh = await trainerService.getCourseAttendance(selectedCourseId);
      setHistory(refresh?.data?.data || []);
    } catch (error) {
      console.error('Error saving attendance', error);
      enqueueSnackbar(error?.response?.data?.message || 'Failed to save attendance', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const refreshHistory = async () => {
    if (!selectedCourseId) return;
    try {
      setLoadingHistory(true);
      const response = await trainerService.getCourseAttendance(selectedCourseId);
      setHistory(response?.data?.data || []);
    } catch (error) {
      console.error('Error refreshing attendance history', error);
      enqueueSnackbar('Unable to refresh attendance history', { variant: 'error' });
    } finally {
      setLoadingHistory(false);
    }
  };

  // Appeals functions
  useEffect(() => {
    if (tabValue === 1) {
      fetchAppeals();
    }
  }, [tabValue]);

  const fetchAppeals = async () => {
    try {
      setLoadingAppeals(true);
      const response = await attendanceAppealService.getTrainerAppeals();
      setAppeals(response?.data?.data || response?.data || []);
    } catch (error) {
      console.error('Error fetching appeals:', error);
      enqueueSnackbar('Failed to load appeals', { variant: 'error' });
    } finally {
      setLoadingAppeals(false);
    }
  };

  const handleReviewAppeal = (appeal) => {
    setSelectedAppeal(appeal);
    setReviewDialogOpen(true);
  };

  const handleReviewComplete = () => {
    fetchAppeals();
    setReviewDialogOpen(false);
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
        <Alert severity="info">No courses assigned yet. Attendance will be available once you are assigned to a course.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Attendance</Typography>
          <Typography variant="body2" color="text.secondary">
            Record daily attendance, capture notes, and review recent sessions in one place
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refreshHistory}
            disabled={loadingStudents || loadingHistory}
          >
            Refresh
          </Button>
          {tabValue === 0 && (
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving || loadingStudents}
            >
              {saving ? 'Saving…' : 'Save Attendance'}
            </Button>
          )}
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Mark Attendance" />
          <Tab label="Appeals" />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Mark Attendance */}
      {tabValue === 0 && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="Course"
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
            onChange={(e) => setSessionNumber(Number(e.target.value) || 1)}
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button fullWidth variant="outlined" sx={{ height: '100%' }} onClick={() => markAll('PRESENT')} disabled={!students.length}>
            Mark All Present
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[{
          label: 'Present',
          value: stats.present,
          color: 'success.main',
        }, {
          label: 'Late',
          value: stats.late,
          color: 'warning.main',
        }, {
          label: 'Absent',
          value: stats.absent,
          color: 'error.main',
        }, {
          label: 'Excused',
          value: stats.excused,
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

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Today's Roster</Typography>
              {loadingStudents ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                  <CircularProgress />
                </Box>
              ) : !students.length ? (
                <Alert severity="info">No enrollments found for this course.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Candidate</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((enrollment) => (
                        <TableRow key={enrollment.id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {`${enrollment.candidate?.firstName?.[0] || ''}${enrollment.candidate?.lastName?.[0] || ''}`.toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">
                                  {enrollment.candidate?.firstName} {enrollment.candidate?.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {enrollment.candidate?.user?.email || 'No email'}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <ToggleButtonGroup
                              size="small"
                              exclusive
                              value={attendanceMap[enrollment.id] || ''}
                              onChange={(_, value) => handleStatusChange(enrollment.id, value)}
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <ToggleButton key={option.value} value={option.value}>
                                  {option.label}
                                </ToggleButton>
                              ))}
                            </ToggleButtonGroup>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              placeholder="Optional notes"
                              value={notesMap[enrollment.id] || ''}
                              onChange={(e) => handleNoteChange(enrollment.id, e.target.value)}
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
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip label="All Present" onClick={() => markAll('PRESENT')} clickable color="success" variant="outlined" />
                <Chip label="All Absent" onClick={() => markAll('ABSENT')} clickable color="error" variant="outlined" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Use quick chips to pre-fill the roster, then fine-tune individual statuses.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Sessions</Typography>
                <HistoryIcon fontSize="small" color="action" />
              </Box>
              {loadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : !groupedHistory.length ? (
                <Alert severity="info">No attendance recorded yet.</Alert>
              ) : (
                <Stack spacing={2}>
                  {groupedHistory.map((entry) => (
                    <Box key={entry.date} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle2">{entry.date}</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Stack direction="row" spacing={1}>
                        <Chip size="small" label={`Present ${entry.present}`} color="success" icon={<CheckCircle fontSize="small" />} />
                        <Chip size="small" label={`Late ${entry.late}`} color="warning" icon={<AccessTime fontSize="small" />} />
                        <Chip size="small" label={`Absent ${entry.absent}`} color="error" icon={<Cancel fontSize="small" />} />
                        <Chip size="small" label={`Excused ${entry.excused}`} color="info" icon={<CalendarToday fontSize="small" />} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
        </>
      )}

      {/* Tab Panel 1: Appeals */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Attendance Appeals</Typography>
            {loadingAppeals ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : appeals.length === 0 ? (
              <Alert severity="info">No pending appeals for your courses</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Course</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Original</TableCell>
                      <TableCell>Requested</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appeals.map((appeal) => (
                      <TableRow key={appeal.id} hover>
                        <TableCell>
                          {format(new Date(appeal.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {appeal.candidate?.fullName || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {appeal.candidate?.user?.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {appeal.attendanceRecord?.enrollment?.course?.title || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {appeal.attendanceRecord?.date 
                            ? format(new Date(appeal.attendanceRecord.date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={appeal.status}
                            color={appeal.status === 'PENDING' ? 'warning' : appeal.status === 'APPROVED' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={appeal.originalStatus} size="small" color="error" />
                        </TableCell>
                        <TableCell>
                          <Chip label={appeal.requestedStatus || 'EXCUSED'} size="small" color="info" />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleReviewAppeal(appeal)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Appeal Dialog */}
      <ReviewAppealDialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        appeal={selectedAppeal}
        onReviewComplete={handleReviewComplete}
        isAdmin={false}
      />
    </Box>
  );
};

export default TrainerAttendance;
