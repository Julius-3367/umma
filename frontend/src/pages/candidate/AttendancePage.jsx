import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  AccessTime,
  CalendarToday,
  ViewList,
  ViewModule,
  Download,
  TrendingUp,
  TrendingDown,
  EventAvailable,
  Schedule,
  Gavel as AppealIcon,
  Pending as PendingIcon,
  ThumbUp as ApprovedIcon,
  ThumbDown as RejectedIcon,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useSnackbar } from 'notistack';
import { candidateService } from '../../api/candidate';
import attendanceAppealService from '../../api/attendanceAppeal';
import SubmitAppealDialog from '../../components/attendance/SubmitAppealDialog';

const AttendancePage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [viewMode, setViewMode] = useState('list');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [certificateDialog, setCertificateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [stats, setStats] = useState({
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
  });

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError(null);
        const month = selectedMonth.getMonth() + 1;
        const year = selectedMonth.getFullYear();
        const response = await candidateService.getAttendanceRecords(month, year);

        setAttendanceData(response.records || []);
        setStats(response.stats || {
          totalDays: 0,
          present: 0,
          absent: 0,
          late: 0,
          attendanceRate: 0,
        });
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
        setError(err.response?.data?.message || 'Failed to load attendance data');
        setAttendanceData([]);
        setStats({
          totalDays: 0,
          present: 0,
          absent: 0,
          late: 0,
          attendanceRate: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedMonth]);

  // Fetch appeals
  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      const response = await attendanceAppealService.getMyAppeals();
      setAppeals(response?.data || []);
    } catch (error) {
      console.error('Error fetching appeals:', error);
    }
  };

  const handleOpenAppealDialog = (record) => {
    setSelectedRecord(record);
    setAppealDialogOpen(true);
  };

  const handleAppealSubmitted = () => {
    fetchAppeals();
    enqueueSnackbar('Appeal submitted successfully!', { variant: 'success' });
  };

  const getAppealForRecord = (recordId) => {
    return appeals.find(appeal => appeal.attendanceRecordId === recordId);
  };

  const canAppeal = (record) => {
    if (!record) return false;
    // Can only appeal ABSENT or LATE records
    const status = record.status?.toUpperCase();
    if (!['ABSENT', 'LATE'].includes(status)) return false;
    // Check if already has active appeal
    const existingAppeal = getAppealForRecord(record.id);
    return !existingAppeal || existingAppeal.status === 'REJECTED';
  };

  const getAppealStatusChip = (appeal) => {
    if (!appeal) return null;

    const statusConfig = {
      PENDING: { label: 'Appeal Pending', color: 'warning', icon: <PendingIcon fontSize="small" /> },
      APPROVED: { label: 'Appeal Approved', color: 'success', icon: <ApprovedIcon fontSize="small" /> },
      REJECTED: { label: 'Appeal Rejected', color: 'error', icon: <RejectedIcon fontSize="small" /> },
      CANCELLED: { label: 'Appeal Cancelled', color: 'default', icon: null },
    };

    const config = statusConfig[appeal.status] || statusConfig.PENDING;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        sx={{ ml: 1 }}
      />
    );
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'present':
        return <CheckCircle />;
      case 'absent':
        return <Cancel />;
      case 'late':
        return <AccessTime />;
      default:
        return null;
    }
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth),
  });

  const getAttendanceForDay = (day) => {
    return attendanceData.find(a => isSameDay(new Date(a.date), day));
  };

  const handleDownloadCertificate = () => {
    setCertificateDialog(true);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Attendance Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor your attendance record and maintain good standing
        </Typography>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Attendance Rate
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        {stats.attendanceRate}%
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TrendingUp sx={{ color: 'success.main', fontSize: 28 }} />
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stats.attendanceRate}
                    sx={{ mt: 2, height: 8, borderRadius: 1 }}
                    color="success"
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Present Days
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {stats.present}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        of {stats.totalDays} days
                      </Typography>
                    </Box>
                    <CheckCircle sx={{ fontSize: 56, color: 'success.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Absent Days
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="error.main">
                        {stats.absent}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        days missed
                      </Typography>
                    </Box>
                    <Cancel sx={{ fontSize: 56, color: 'error.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Late Arrivals
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="warning.main">
                        {stats.late}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        times late
                      </Typography>
                    </Box>
                    <Schedule sx={{ fontSize: 56, color: 'warning.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* View Controls */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant={viewMode === 'list' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('list')}
                    size="small"
                  >
                    List View
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('calendar')}
                    size="small"
                  >
                    Calendar View
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={format(selectedMonth, 'yyyy-MM')}
                      label="Month"
                      onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                    >
                      <MenuItem value="2025-11">November 2025</MenuItem>
                      <MenuItem value="2025-10">October 2025</MenuItem>
                      <MenuItem value="2025-09">September 2025</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={handleDownloadCertificate}
                  >
                    Download Certificate
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* List View */}
          {viewMode === 'list' && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Attendance Records
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Course</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Remarks</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceData.map((record, index) => {
                        const appeal = getAppealForRecord(record.id);
                        return (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {format(new Date(record.date), 'MMM dd, yyyy')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(record.date), 'EEEE')}
                              </Typography>
                            </TableCell>
                            <TableCell>{record.courseName}</TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" flexWrap="wrap">
                                <Chip
                                  icon={getStatusIcon(record.status)}
                                  label={record.status.toUpperCase()}
                                  color={getStatusColor(record.status)}
                                  size="small"
                                />
                                {appeal && getAppealStatusChip(appeal)}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {record.remarks || '-'}
                              </Typography>
                              {appeal && appeal.reviewerComments && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                  <strong>Review:</strong> {appeal.reviewerComments}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {canAppeal(record) ? (
                                <Button
                                  size="small"
                                  startIcon={<AppealIcon />}
                                  onClick={() => handleOpenAppealDialog(record)}
                                  color="primary"
                                  variant="outlined"
                                >
                                  Appeal
                                </Button>
                              ) : appeal && appeal.status === 'PENDING' ? (
                                <Chip
                                  label="Under Review"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              ) : appeal && appeal.status === 'APPROVED' ? (
                                <Chip
                                  label="Approved"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  -
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {format(selectedMonth, 'MMMM yyyy')}
                </Typography>
                <Grid container spacing={1} sx={{ mt: 2 }}>
                  {/* Day headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Grid item xs={12 / 7} key={day}>
                      <Typography variant="caption" fontWeight={600} align="center" display="block">
                        {day}
                      </Typography>
                    </Grid>
                  ))}

                  {/* Calendar days */}
                  {monthDays.map((day) => {
                    const attendance = getAttendanceForDay(day);
                    return (
                      <Grid item xs={12 / 7} key={day.toString()}>
                        <Paper
                          sx={{
                            p: 1,
                            textAlign: 'center',
                            bgcolor: attendance
                              ? attendance.status === 'present'
                                ? alpha(theme.palette.success.main, 0.1)
                                : attendance.status === 'absent'
                                  ? alpha(theme.palette.error.main, 0.1)
                                  : alpha(theme.palette.warning.main, 0.1)
                              : 'transparent',
                            border: `1px solid ${theme.palette.divider}`,
                            minHeight: 60,
                          }}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {format(day, 'd')}
                          </Typography>
                          {attendance && (
                            <Box sx={{ mt: 0.5 }}>
                              {getStatusIcon(attendance.status)}
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Legend */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Chip icon={<CheckCircle />} label="Present" color="success" size="small" />
                  <Chip icon={<Cancel />} label="Absent" color="error" size="small" />
                  <Chip icon={<Schedule />} label="Late" color="warning" size="small" />
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Download Certificate Dialog */}
          <Dialog open={certificateDialog} onClose={() => setCertificateDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Download Attendance Certificate</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select the date range for your attendance certificate:
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    defaultValue="2025-11-01"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    defaultValue="2025-11-14"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCertificateDialog(false)}>Cancel</Button>
              <Button variant="contained" startIcon={<Download />}>
                Download PDF
              </Button>
            </DialogActions>
          </Dialog>

          {/* Submit Appeal Dialog */}
          <SubmitAppealDialog
            open={appealDialogOpen}
            onClose={() => setAppealDialogOpen(false)}
            attendanceRecord={selectedRecord}
            onAppealSubmitted={handleAppealSubmitted}
          />
        </>
      )}
    </Box>
  );
};

export default AttendancePage;
