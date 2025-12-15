import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  TablePagination,
  Button,
  IconButton,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Tabs,
  Tab,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as LateIcon,
  Save as SaveIcon,
  Gavel as AppealIcon,
  Pending as PendingIcon,
  ThumbUp as ApprovedIcon,
  ThumbDown as RejectedIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  NotificationsActive as NotificationsIcon,
} from '@mui/icons-material';
import { format, subDays } from 'date-fns';
import { useSnackbar } from 'notistack';
import adminService from '../../api/admin';
import attendanceAppealService from '../../api/attendanceAppeal';
import ReviewAppealDialog from '../../components/attendance/ReviewAppealDialog';

const Candidates = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Attendance state
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sessionNumber, setSessionNumber] = useState(1);
  const [attendanceCandidates, setAttendanceCandidates] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [remarks, setRemarks] = useState({});
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [statistics, setStatistics] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  });
  const [attendanceStatsData, setAttendanceStatsData] = useState(null);
  const [historyRange, setHistoryRange] = useState(14);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);

  // Appeals state
  const [appeals, setAppeals] = useState([]);
  const [appealStatistics, setAppealStatistics] = useState(null);
  const [appealStatusFilter, setAppealStatusFilter] = useState('');
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllCandidates();
      console.log('📋 Candidates API response:', response);
      console.log('📋 Response structure:', {
        hasData: !!response?.data,
        hasDataData: !!response?.data?.data,
        dataCandidates: !!response?.data?.candidates,
        dataDataCandidates: !!response?.data?.data?.candidates
      });

      // Axios wraps the API response in data, so it's response.data.data.candidates
      const candidatesData = response?.data?.data?.candidates || response?.data?.candidates || [];
      console.log('📋 Extracted candidates:', candidatesData);
      console.log('📋 Number of candidates:', candidatesData.length);

      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
    } catch (error) {
      console.error('❌ Error fetching candidates:', error);
      console.error('Error response:', error.response);
      enqueueSnackbar(error.response?.data?.message || t('candidates.failedToLoad'), { variant: 'error' });
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, candidate) => {
    setAnchorEl(event.currentTarget);
    setSelectedCandidate(candidate);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = (candidate) => {
    navigate(`/admin/candidates/${candidate.id}`);
    handleMenuClose();
  };

  const handleEdit = (candidate) => {
    navigate(`/admin/candidates/${candidate.id}/edit`);
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      await adminService.deleteUser(selectedCandidate.userId || selectedCandidate.id);
      enqueueSnackbar('Candidate deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      fetchCandidates();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to delete candidate', { variant: 'error' });
    }
    handleMenuClose();
  };

  const handleEmail = (candidate) => {
    const email = candidate.user?.email || candidate.email;
    if (email) {
      window.location.href = `mailto:${email}`;
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'success',
      INACTIVE: 'default',
      SUSPENDED: 'error',
      PENDING: 'warning',
    };
    return colors[status] || 'default';
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.user?.phone?.includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || candidate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedCandidates = filteredCandidates.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Date of Birth', 'Address'];
    const rows = filteredCandidates.map(c => [
      c.id,
      c.fullName,
      c.user?.email || '',
      c.user?.phone || '',
      c.status,
      c.dateOfBirth ? format(new Date(c.dateOfBirth), 'yyyy-MM-dd') : '',
      c.address || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `candidates_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Attendance functions
  useEffect(() => {
    if (tabValue === 1) {
      fetchCourses();
    } else if (tabValue === 2) {
      fetchAppeals();
    }
  }, [tabValue, appealStatusFilter]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAttendanceCandidates();
      fetchExistingAttendance();
      fetchAttendanceStats();
    }
  }, [selectedCourse, selectedDate, historyRange]);

  useEffect(() => {
    calculateStatistics();
  }, [attendance, attendanceCandidates]);

  const fetchCourses = async () => {
    try {
      const response = await adminService.getAllCourses({ status: 'ACTIVE' });
      const coursesData = response?.data?.data || response?.data || [];
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      enqueueSnackbar('Failed to load courses', { variant: 'error' });
    }
  };

  const fetchAttendanceCandidates = async () => {
    try {
      setAttendanceLoading(true);
      const response = await adminService.getEnrollments();
      const enrollmentsData = response?.data?.data?.enrollments || [];

      const courseCandidates = enrollmentsData
        .filter(e => e.courseId === parseInt(selectedCourse) && e.enrollmentStatus === 'ENROLLED')
        .map(e => ({
          id: e.candidateId,
          enrollmentId: e.id,
          fullName: e.candidate?.fullName || 'Unknown',
          email: e.candidate?.user?.email || '',
          userId: e.candidate?.userId || e.candidate?.user?.id,
        }));

      setAttendanceCandidates(courseCandidates);

      setAttendance(prev => {
        const next = {};
        courseCandidates.forEach(c => {
          next[c.id] = prev[c.id] ?? null;
        });
        return next;
      });

      setRemarks(prev => {
        const next = {};
        courseCandidates.forEach(c => {
          next[c.id] = prev[c.id] || '';
        });
        return next;
      });
    } catch (error) {
      console.error('Error fetching candidates:', error);
      enqueueSnackbar('Failed to load candidates', { variant: 'error' });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const response = await adminService.getAttendance(selectedCourse, selectedDate);
      const attendanceData = response?.data?.data || response?.data || [];

      const existingAttendance = {};
      const existingRemarks = {};

      attendanceData.forEach(record => {
        existingAttendance[record.candidateId] = record.status;
        existingRemarks[record.candidateId] = record.remarks || '';
      });

      setAttendance(existingAttendance);
      setRemarks(existingRemarks);

      if (attendanceData.length > 0) {
        setSessionNumber(attendanceData[0].sessionNumber || 1);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchAttendanceStats = async () => {
    if (!selectedCourse) return;

    try {
      setStatsLoading(true);
      const endDate = format(new Date(selectedDate), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(selectedDate), historyRange - 1), 'yyyy-MM-dd');
      const response = await adminService.getAttendanceStatistics(selectedCourse, startDate, endDate);
      setAttendanceStatsData(response?.data?.data || null);
    } catch (error) {
      console.error('Error fetching attendance statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const calculateStatistics = () => {
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      total: attendanceCandidates.length,
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
    attendanceCandidates.forEach(c => {
      allPresent[c.id] = 'PRESENT';
    });
    setAttendance(allPresent);
  };

  const handleSaveAttendance = async () => {
    try {
      setLoading(true);

      const records = attendanceCandidates
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

  const exportAttendanceToCSV = () => {
    const courseName = courses.find(c => c.id === parseInt(selectedCourse))?.title || 'Course';
    const headers = ['Candidate ID', 'Name', 'Email', 'Status', 'Remarks'];
    const rows = attendanceCandidates.map(c => [
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

  const handleSendAbsenceNotifications = async () => {
    if (!selectedCourse) {
      enqueueSnackbar('Select a course before sending notifications', { variant: 'warning' });
      return;
    }

    const absentees = attendanceCandidates
      .filter(candidate => attendance[candidate.id] === 'ABSENT' && candidate.userId)
      .map(candidate => candidate.userId);

    if (!absentees.length) {
      enqueueSnackbar('Mark absentees before sending notifications', { variant: 'info' });
      return;
    }

    try {
      setSendingNotifications(true);
      await adminService.sendAttendanceNotifications({
        courseId: parseInt(selectedCourse, 10),
        date: selectedDate,
        studentIds: absentees,
      });
      enqueueSnackbar(`Absence notifications sent to ${absentees.length} candidate(s)`, { variant: 'success' });
    } catch (error) {
      console.error('Error sending attendance notifications:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to send notifications', { variant: 'error' });
    } finally {
      setSendingNotifications(false);
    }
  };

  const getAttendanceStatusColor = (status) => {
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

  // Appeals functions
  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const filters = appealStatusFilter ? { status: appealStatusFilter } : {};
      const response = await attendanceAppealService.getAdminAppeals(filters);
      setAppeals(response?.data?.appeals || []);
      setAppealStatistics(response?.data?.statistics || null);
    } catch (error) {
      console.error('Error fetching appeals:', error);
      enqueueSnackbar('Failed to load appeals', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = (appeal) => {
    setSelectedAppeal(appeal);
    setReviewDialogOpen(true);
  };

  const handleReviewComplete = () => {
    fetchAppeals();
  };

  const getAppealStatusColor = (status) => {
    const colors = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      CANCELLED: 'default',
    };
    return colors[status] || 'default';
  };

  const getAppealStatusIcon = (status) => {
    const icons = {
      PENDING: <PendingIcon fontSize="small" />,
      APPROVED: <ApprovedIcon fontSize="small" />,
      REJECTED: <RejectedIcon fontSize="small" />,
    };
    return icons[status];
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h4" gutterBottom>
            {t('candidates.candidateManagement')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('candidates.manageCandidates')}
          </Typography>
        </div>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={tabValue === 0 ? exportToCSV : exportAttendanceToCSV}
          >
            {t('candidates.export')}
          </Button>
          {tabValue === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/users/new', { state: { defaultRole: 'CANDIDATE' } })}
            >
              {t('candidates.addCandidate')}
            </Button>
          )}
          {tabValue === 1 && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => setSaveDialogOpen(true)}
              disabled={!selectedCourse || Object.keys(attendance).filter(k => attendance[k]).length === 0}
            >
              {t('candidates.saveAttendance')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={t('candidates.allCandidates')} icon={<PersonIcon />} iconPosition="start" />
          <Tab label={t('attendance.title')} icon={<CalendarIcon />} iconPosition="start" />
          <Tab label={t('appeals.title')} icon={<AppealIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab 0: Candidate List */}
      {tabValue === 0 && (
        <>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder={t('candidates.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>{t('candidates.filterByStatus')}</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label={t('candidates.filterByStatus')}
                    >
                      <MenuItem value="ALL">{t('candidates.allStatuses')}</MenuItem>
                      <MenuItem value="ACTIVE">{t('users.active')}</MenuItem>
                      <MenuItem value="INACTIVE">{t('users.inactive')}</MenuItem>
                      <MenuItem value="SUSPENDED">{t('users.suspended')}</MenuItem>
                      <MenuItem value="PENDING">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Total: {filteredCandidates.length} candidates
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('candidates.title').slice(0, -1)}</TableCell>
                    <TableCell>{t('common.email')}</TableCell>
                    <TableCell>{t('profile.dateOfBirth')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell>{t('profile.education')}</TableCell>
                    <TableCell>{t('users.createdAt')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : paginatedCandidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box py={4}>
                          <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            {t('candidates.noCandidates')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm || statusFilter !== 'ALL'
                              ? t('common.filter') + ' ' + t('common.actions').toLowerCase()
                              : t('candidates.addCandidate') + ' to get started'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCandidates.map((candidate) => (
                      <TableRow key={candidate.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar src={candidate.profilePicture}>
                              {candidate.fullName?.charAt(0) || 'C'}
                            </Avatar>
                            <div>
                              <Typography variant="body1" fontWeight={500}>
                                {candidate.fullName || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {candidate.id}
                              </Typography>
                            </div>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{candidate.user?.email || 'N/A'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {candidate.user?.phone || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {candidate.dateOfBirth
                            ? format(new Date(candidate.dateOfBirth), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={candidate.status || 'ACTIVE'}
                            color={getStatusColor(candidate.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {candidate.educationLevel || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {candidate.createdAt
                            ? format(new Date(candidate.createdAt), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleView(candidate)}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, candidate)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredCandidates.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Card>
        </>
      )}

      {/* Tab 1: Mark Attendance */}
      {tabValue === 1 && (
        <>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>{t('attendance.course')}</InputLabel>
                    <Select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      label={t('attendance.course')}
                    >
                      <MenuItem value="">
                        <em>{t('candidates.selectCourse')}</em>
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
                    label={t('candidates.sessionDate')}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('candidates.sessionNumber')}
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
                    disabled={!selectedCourse || attendanceCandidates.length === 0}
                    sx={{ height: '56px' }}
                  >
                    {t('candidates.markAllPresent')}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Statistics */}
          {selectedCourse && attendanceCandidates.length > 0 && (
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <PersonIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                      <div>
                        <Typography variant="h4">{statistics.total}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('candidates.totalCandidates')}
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
                          {t('attendance.present')} ({attendancePercentage}%)
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
                          {t('attendance.late')}
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
                          {t('attendance.absent')}
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
                  <CalendarIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('candidates.selectCourse')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('candidates.chooseCourseDate')}
                  </Typography>
                </Box>
              ) : loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : attendanceCandidates.length === 0 ? (
                <Box py={8} textAlign="center">
                  <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {t('candidates.noCandidatesEnrolled')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('candidates.noCandidatesInCourse')}
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width="50">#</TableCell>
                        <TableCell>{t('candidates.title').slice(0, -1)}</TableCell>
                        <TableCell>{t('common.email')}</TableCell>
                        <TableCell align="center">{t('candidates.markAttendance')}</TableCell>
                        <TableCell>{t('attendance.remarks')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceCandidates.map((candidate, index) => (
                        <TableRow key={candidate.id} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {candidate.fullName?.charAt(0) || 'C'}
                              </Avatar>
                              <Typography variant="body1" fontWeight={500}>
                                {candidate.fullName}
                              </Typography>
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
                                <Tooltip title={t('attendance.present')}>
                                  <PresentIcon />
                                </Tooltip>
                              </ToggleButton>
                              <ToggleButton value="LATE" color="warning">
                                <Tooltip title={t('attendance.late')}>
                                  <LateIcon />
                                </Tooltip>
                              </ToggleButton>
                              <ToggleButton value="ABSENT" color="error">
                                <Tooltip title={t('attendance.absent')}>
                                  <AbsentIcon />
                                </Tooltip>
                              </ToggleButton>
                            </ToggleButtonGroup>
                            {attendance[candidate.id] && (
                              <Chip
                                label={attendance[candidate.id]}
                                color={getAttendanceStatusColor(attendance[candidate.id])}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              placeholder={t('candidates.addRemarks')}
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
        </>
      )}

      {/* Save Confirmation Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>{t('candidates.saveAttendance')}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('candidates.savingAttendanceFor')} <strong>{Object.keys(attendance).filter(k => attendance[k]).length}</strong> {t('candidates.title').toLowerCase()}
          </Alert>
          <Typography variant="body2">
            {t('attendance.course')}: <strong>{courses.find(c => c.id === parseInt(selectedCourse))?.title}</strong>
          </Typography>
          <Typography variant="body2">
            {t('common.date')}: <strong>{format(new Date(selectedDate), 'MMMM dd, yyyy')}</strong>
          </Typography>
          <Typography variant="body2">
            {t('candidates.session')}: <strong>#{sessionNumber}</strong>
          </Typography>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              • {t('attendance.present')}: {statistics.present}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • {t('attendance.late')}: {statistics.late}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • {t('attendance.absent')}: {statistics.absent}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSaveAttendance}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {t('candidates.confirmSave')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tab 2: Appeals */}
      {tabValue === 2 && (
        <>
          {/* Statistics Cards */}
          {appealStatistics && (
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AppealIcon color="primary" />
                      <Typography color="text.secondary" variant="body2">
                        {t('candidates.totalAppeals')}
                      </Typography>
                    </Box>
                    <Typography variant="h4">{appealStatistics.total || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PendingIcon color="warning" />
                      <Typography color="text.secondary" variant="body2">
                        {t('appeals.pending')}
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="warning.main">
                      {appealStatistics.pending || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <ApprovedIcon color="success" />
                      <Typography color="text.secondary" variant="body2">
                        {t('appeals.approved')}
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="success.main">
                      {appealStatistics.approved || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <RejectedIcon color="error" />
                      <Typography color="text.secondary" variant="body2">
                        {t('appeals.rejected')}
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="error.main">
                      {appealStatistics.rejected || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>{t('candidates.filterByStatus')}</InputLabel>
                    <Select
                      value={appealStatusFilter}
                      onChange={(e) => setAppealStatusFilter(e.target.value)}
                      label={t('candidates.filterByStatus')}
                    >
                      <MenuItem value="">{t('candidates.allStatuses')}</MenuItem>
                      <MenuItem value="PENDING">{t('appeals.pending')}</MenuItem>
                      <MenuItem value="APPROVED">{t('appeals.approved')}</MenuItem>
                      <MenuItem value="REJECTED">{t('appeals.rejected')}</MenuItem>
                      <MenuItem value="CANCELLED">{t('appeals.cancelled')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={8} display="flex" justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchAppeals}
                    disabled={loading}
                  >
                    {t('common.refresh')}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Appeals Table */}
          <Card>
            <CardContent>
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : appeals.length === 0 ? (
                <Alert severity="info">{t('appeals.noAppeals')}</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('common.date')}</TableCell>
                        <TableCell>{t('candidates.title').slice(0, -1)}</TableCell>
                        <TableCell>{t('attendance.course')}</TableCell>
                        <TableCell>{t('candidates.sessionDate')}</TableCell>
                        <TableCell>{t('appeals.originalStatus')}</TableCell>
                        <TableCell>{t('appeals.requestedStatus')}</TableCell>
                        <TableCell>{t('common.status')}</TableCell>
                        <TableCell>{t('appeals.reviewedBy')}</TableCell>
                        <TableCell align="center">{t('common.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appeals.map((appeal) => (
                        <TableRow key={appeal.id} hover>
                          <TableCell>
                            {format(new Date(appeal.createdAt), 'MMM dd, yyyy HH:mm')}
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
                            <Typography variant="body2">
                              {appeal.attendanceRecord?.enrollment?.course?.title || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {appeal.attendanceRecord?.sessionDate
                              ? format(new Date(appeal.attendanceRecord.sessionDate), 'MMM dd, yyyy')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={appeal.originalStatus}
                              color={getAttendanceStatusColor(appeal.originalStatus)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={appeal.requestedStatus}
                              color={getAttendanceStatusColor(appeal.requestedStatus)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getAppealStatusIcon(appeal.status)}
                              label={appeal.status}
                              color={getAppealStatusColor(appeal.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {appeal.reviewedBy ? (
                              <Box>
                                <Typography variant="body2">
                                  {appeal.reviewedBy.firstName} {appeal.reviewedBy.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {appeal.reviewedAt
                                    ? format(new Date(appeal.reviewedAt), 'MMM dd, yyyy')
                                    : ''}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                {t('appeals.notReviewed')}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOverride(appeal)}
                            >
                              {appeal.status === 'PENDING' ? t('appeals.review') : t('appeals.override')}
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
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleView(selectedCandidate)}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          {t('candidates.viewDetails')}
        </MenuItem>
        <MenuItem onClick={() => handleEdit(selectedCandidate)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={() => handleEmail(selectedCandidate)}>
          <EmailIcon fontSize="small" sx={{ mr: 1 }} />
          {t('candidates.sendEmail')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('common.delete')}
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('candidates.deleteCandidate')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('candidates.confirmDeleteCandidate')} <strong>{selectedCandidate?.fullName}</strong>?
            {t('common.actionCannotBeUndone')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Appeal Dialog */}
      <ReviewAppealDialog
        open={reviewDialogOpen}
        onClose={() => {
          setReviewDialogOpen(false);
          setSelectedAppeal(null);
        }}
        appeal={selectedAppeal}
        onReviewComplete={handleReviewComplete}
        isAdmin={true}
      />
    </Box>
  );
};

export default Candidates;
