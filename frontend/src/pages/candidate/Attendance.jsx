import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
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
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  EventAvailable as ExcusedIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon,
  Gavel as AppealIcon,
  Pending as PendingIcon,
  ThumbUp as ApprovedIcon,
  ThumbDown as RejectedIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useSnackbar } from 'notistack';
import candidateService from '../../api/candidate';
import attendanceAppealService from '../../api/attendanceAppeal';
import SubmitAppealDialog from '../../components/attendance/SubmitAppealDialog';

const Attendance = () => {
  const { t } = useTranslation();
  const [attendance, setAttendance] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courses, setCourses] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [appealDialogOpen, setAppealDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchCourses();
    fetchAppeals();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await candidateService.getMyCourses();
      setCourses(response || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const courseId = selectedCourse !== 'all' ? selectedCourse : undefined;
      const response = await candidateService.getAttendance(courseId);
      console.log('📊 Attendance response:', response);

      // Handle nested data structure
      const data = response?.data || response;
      setAttendance(data?.records || []);
      setStatistics(data?.statistics || {});
    } catch (error) {
      console.error('Error fetching attendance:', error);
      enqueueSnackbar('Failed to load attendance records', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

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
    fetchAttendance();
  };

  const getAppealForRecord = (recordId) => {
    return appeals.find(appeal => appeal.attendanceRecordId === recordId);
  };

  const canAppeal = (record) => {
    if (!record) return false;
    // Can only appeal ABSENT or LATE records
    if (!['ABSENT', 'LATE'].includes(record.status)) return false;
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
    const colors = {
      PRESENT: 'success',
      ABSENT: 'error',
      LATE: 'warning',
      EXCUSED: 'info',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      PRESENT: <PresentIcon />,
      ABSENT: <AbsentIcon />,
      LATE: <LateIcon />,
      EXCUSED: <ExcusedIcon />,
    };
    return icons[status];
  };

  const renderCalendarView = () => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {format(today, 'MMMM yyyy')} Calendar
        </Typography>
        <Grid container spacing={1}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid item xs key={day} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {day}
              </Typography>
            </Grid>
          ))}
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <Grid item xs key={`empty-${index}`} />
          ))}
          {days.map((day) => {
            const dayAttendance = attendance.find((a) =>
              isSameDay(new Date(a.date), day)
            );
            const isToday = isSameDay(day, today);

            return (
              <Grid item xs key={day.toISOString()}>
                <Box
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    borderRadius: 1,
                    border: isToday ? 2 : 1,
                    borderColor: isToday ? 'primary.main' : 'divider',
                    bgcolor: dayAttendance
                      ? dayAttendance.status === 'PRESENT'
                        ? 'success.light'
                        : dayAttendance.status === 'ABSENT'
                          ? 'error.light'
                          : dayAttendance.status === 'LATE'
                            ? 'warning.light'
                            : 'info.light'
                      : 'transparent',
                    cursor: dayAttendance ? 'pointer' : 'default',
                    '&:hover': dayAttendance ? {
                      bgcolor: 'action.hover',
                    } : {},
                  }}
                >
                  <Typography
                    variant="body2"
                    color={isToday ? 'primary' : 'text.primary'}
                    fontWeight={isToday ? 'bold' : 'normal'}
                  >
                    {format(day, 'd')}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
        <Box mt={2} display="flex" gap={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'success.light', borderRadius: 0.5 }} />
            <Typography variant="caption">Present</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'error.light', borderRadius: 0.5 }} />
            <Typography variant="caption">Absent</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'warning.light', borderRadius: 0.5 }} />
            <Typography variant="caption">Late</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'info.light', borderRadius: 0.5 }} />
            <Typography variant="caption">Excused</Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('attendance.myAttendance')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('attendance.viewRecords')}
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('attendance.filterByCourse')}</InputLabel>
          <Select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            label={t('attendance.filterByCourse')}
          >
            <MenuItem value="all">{t('common.all')} {t('courses.title')}</MenuItem>
            {courses.map((enrollment) => {
              const courseId = enrollment.courseId || enrollment.course?.id || enrollment.id;
              const courseTitle = enrollment.title || enrollment.course?.title || 'Unknown Course';
              return (
                <MenuItem key={courseId} value={courseId}>
                  {courseTitle}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      {/* Info Alert */}
      <Box mb={3}>
        <Paper sx={{ p: 2, bgcolor: 'info.lighter', borderLeft: 4, borderColor: 'info.main' }}>
          <Typography variant="body2" color="info.dark">
            <strong>📌 {t('attendance.title')}:</strong> {t('attendance.aboutAttendance')}
          </Typography>
        </Paper>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CalendarIcon color="action" />
                  <Typography color="text.secondary" variant="body2">
                    {t('attendance.totalSessions')}
                  </Typography>
                </Box>
                <Typography variant="h4">{statistics.total || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PresentIcon color="success" />
                  <Typography color="text.secondary" variant="body2">
                    {t('attendance.present')}
                  </Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {statistics.present || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <AbsentIcon color="error" />
                  <Typography color="text.secondary" variant="body2">
                    {t('attendance.absent')}
                  </Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {statistics.absent || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingUpIcon color="primary" />
                  <Typography color="text.secondary" variant="body2">
                    {t('attendance.attendanceRate')}
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary.main">
                  {statistics.attendanceRate || 0}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(statistics.attendanceRate || 0)}
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Calendar View */}
      <Box mb={3}>
        {renderCalendarView()}
      </Box>

      {/* Attendance Records Table */}
      <Paper>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            {t('attendance.attendanceHistory')}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('common.date')}</TableCell>
                <TableCell>{t('courses.title').slice(0, -1)}</TableCell>
                <TableCell>{t('attendance.session')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('common.remarks')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : attendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={4}>
                      <CalendarIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No attendance records yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
                        Your attendance is recorded by your trainers during each session.
                        Records will appear here once you attend your enrolled courses.
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        💡 Tip: Maintain good attendance to successfully complete your courses
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((record) => {
                  const appeal = getAppealForRecord(record.id);
                  return (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{record.course?.title || 'N/A'}</TableCell>
                      <TableCell>Session {record.sessionNumber || 'N/A'}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" flexWrap="wrap">
                          <Chip
                            label={record.status}
                            color={getStatusColor(record.status)}
                            size="small"
                            icon={getStatusIcon(record.status)}
                          />
                          {appeal && getAppealStatusChip(appeal)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {appeal && appeal.status === 'APPROVED' ? (
                          <Box>
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                              ✓ Appeal Approved
                            </Typography>
                            {appeal.reviewerComments && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                {appeal.reviewerComments}
                              </Typography>
                            )}
                            {appeal.requestedStatus && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                Changed from {appeal.originalStatus} to {appeal.requestedStatus}
                              </Typography>
                            )}
                          </Box>
                        ) : appeal && appeal.status === 'REJECTED' ? (
                          <Box>
                            <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                              ✗ Appeal Rejected
                            </Typography>
                            {appeal.reviewerComments && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                {appeal.reviewerComments}
                              </Typography>
                            )}
                          </Box>
                        ) : appeal && appeal.status === 'PENDING' ? (
                          <Box>
                            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                              ⏳ Appeal Under Review
                            </Typography>
                            {appeal.reason && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                Your reason: {appeal.reason}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {record.remarks || '-'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {canAppeal(record) ? (
                          <Tooltip title="Submit an appeal for this attendance record">
                            <Button
                              size="small"
                              startIcon={<AppealIcon />}
                              onClick={() => handleOpenAppealDialog(record)}
                              color="primary"
                              variant="outlined"
                            >
                              Appeal
                            </Button>
                          </Tooltip>
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
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Submit Appeal Dialog */}
      <SubmitAppealDialog
        open={appealDialogOpen}
        onClose={() => setAppealDialogOpen(false)}
        attendanceRecord={selectedRecord}
        onAppealSubmitted={handleAppealSubmitted}
      />
    </Box>
  );
};

export default Attendance;
