import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  WorkOutline as WorkIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  EmojiEvents as TrophyIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import adminService from '../../api/admin';

const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchCandidateDetails();
  }, [id]);

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      // Fetch candidate details using the new getCandidateById API
      const response = await adminService.getCandidateById(id);
      
      if (!response.data) {
        enqueueSnackbar('Candidate not found', { variant: 'error' });
        navigate('/admin/candidates');
        return;
      }

      const candidateData = response.data.data || response.data;
      setCandidate(candidateData);
      
      // Set enrollments from the candidate data
      setEnrollments(candidateData.enrollments || []);
      
      // Set attendance from the candidate data
      setAttendance(candidateData.attendanceRecords || []);

    } catch (error) {
      console.error('Error fetching candidate details:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to load candidate details', { variant: 'error' });
      navigate('/admin/candidates');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      APPLIED: 'warning',
      ENROLLED: 'success',
      COMPLETED: 'info',
      WITHDRAWN: 'error',
      REJECTED: 'error',
    };
    return colors[status] || 'default';
  };

  const calculateOverallProgress = () => {
    if (enrollments.length === 0) return 0;
    const totalProgress = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
    return Math.round(totalProgress / enrollments.length);
  };

  const calculateAttendanceRate = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    return Math.round((present / attendance.length) * 100);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!candidate) {
    return (
      <Alert severity="error">Candidate not found</Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/admin/candidates')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4">Candidate Overview</Typography>
      </Box>

      {/* Profile Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3} display="flex" flexDirection="column" alignItems="center">
              <Avatar
                src={candidate.profilePicture}
                sx={{ width: 120, height: 120, mb: 2 }}
              >
                <PersonIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h5" gutterBottom textAlign="center">
                {candidate.fullName || `${candidate.user?.firstName || ''} ${candidate.user?.lastName || ''}`.trim() || 'Unknown'}
              </Typography>
              <Chip
                label={candidate.status || candidate.user?.status || 'Active'}
                color={(candidate.status || candidate.user?.status) === 'ACTIVE' ? 'success' : 'default'}
                size="small"
              />
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                sx={{ mt: 2 }}
                onClick={() => navigate(`/admin/candidates/${id}/edit`)}
              >
                Edit Profile
              </Button>
            </Grid>

            <Grid item xs={12} md={9}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{candidate.user?.email || candidate.email || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">{candidate.user?.phone || candidate.phone || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        County
                      </Typography>
                      <Typography variant="body1">{candidate.county || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Date of Birth
                      </Typography>
                      <Typography variant="body1">
                        {candidate.dob
                          ? format(new Date(candidate.dob), 'MMM dd, yyyy')
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <WorkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Previous Role
                      </Typography>
                      <Typography variant="body1">
                        {candidate.previousRole || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Education Level
                      </Typography>
                      <Typography variant="body1">
                        {candidate.highestEducation || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography color="text.secondary" variant="body2">
                    Enrollments
                  </Typography>
                  <Typography variant="h4">{enrollments.length}</Typography>
                </div>
                <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography color="text.secondary" variant="body2">
                    Completed
                  </Typography>
                  <Typography variant="h4">
                    {enrollments.filter(e => e.enrollmentStatus === 'COMPLETED').length}
                  </Typography>
                </div>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography color="text.secondary" variant="body2">
                    Overall Progress
                  </Typography>
                  <Typography variant="h4">{calculateOverallProgress()}%</Typography>
                </div>
                <AssignmentIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={calculateOverallProgress()}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography color="text.secondary" variant="body2">
                    Attendance Rate
                  </Typography>
                  <Typography variant="h4">{calculateAttendanceRate()}%</Typography>
                </div>
                <CalendarIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
              </Box>
              <LinearProgress
                variant="determinate"
                value={calculateAttendanceRate()}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Card>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Enrollments" />
          <Tab label="Attendance" />
          <Tab label="Documents" />
          <Tab label="Activity" />
        </Tabs>

        <CardContent>
          {/* Enrollments Tab */}
          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Enrollment Date</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Payment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" py={4}>
                          No enrollments found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id} hover>
                        <TableCell>{enrollment.course?.title || 'N/A'}</TableCell>
                        <TableCell>{enrollment.course?.code || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={enrollment.enrollmentStatus}
                            color={getStatusColor(enrollment.enrollmentStatus)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {enrollment.enrollmentDate
                            ? format(new Date(enrollment.enrollmentDate), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={enrollment.progress || 0}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2">{enrollment.progress || 0}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={enrollment.paymentStatus || 'PENDING'}
                            color={enrollment.paymentStatus === 'PAID' ? 'success' : 'warning'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Attendance Tab */}
          {tabValue === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Session Date</TableCell>
                    <TableCell>Session #</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" py={4}>
                          No attendance records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendance.map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>{record.course?.title || 'N/A'}</TableCell>
                        <TableCell>
                          {record.sessionDate
                            ? format(new Date(record.sessionDate), 'MMM dd, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{record.sessionNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={record.status}
                            color={
                              record.status === 'PRESENT' ? 'success' :
                              record.status === 'LATE' ? 'warning' : 'error'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {record.remarks || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Documents Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="body2" color="text.secondary" align="center" py={4}>
                Uploaded documents will be displayed here
              </Typography>
            </Box>
          )}

          {/* Activity Tab */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="body2" color="text.secondary" align="center" py={4}>
                Activity logs will be displayed here
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CandidateDetails;
