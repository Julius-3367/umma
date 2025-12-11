import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Assessment as AssessmentIcon,
  EventAvailable as AttendanceIcon,
  Description as DocumentIcon,
  VerifiedUser as VettingIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { trainerService } from '../../api/trainer';

const CandidateProfileDialog = ({ open, onClose, candidateId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open && candidateId) {
      fetchCandidateProfile();
    }
  }, [open, candidateId]);

  const fetchCandidateProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await trainerService.getCandidateProfile(candidateId);
      setProfileData(response.data.data);
    } catch (err) {
      console.error('Error fetching candidate profile:', err);
      setError(err.response?.data?.message || 'Failed to load candidate profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveTab(0);
    onClose();
  };

  const getStatusColor = (status) => {
    const statusMap = {
      APPLIED: 'info',
      SCREENING: 'warning',
      TRAINING: 'primary',
      CERTIFIED: 'success',
      PLACED: 'success',
      REJECTED: 'error',
    };
    return statusMap[status] || 'default';
  };

  const getEnrollmentStatusColor = (status) => {
    const statusMap = {
      ENROLLED: 'success',
      PENDING: 'warning',
      COMPLETED: 'info',
      DROPPED: 'error',
    };
    return statusMap[status] || 'default';
  };

  const getResultColor = (category) => {
    const colorMap = {
      DISTINCTION: 'success',
      MERIT: 'info',
      PASS: 'primary',
      FAIL: 'error',
    };
    return colorMap[category] || 'default';
  };

  const renderPersonalInfo = () => {
    if (!profileData) return null;
    const { candidate } = profileData;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Box textAlign="center">
            <Avatar
              src={candidate.profilePhotoUrl}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            >
              {candidate.fullName?.charAt(0)}
            </Avatar>
            <Typography variant="h6">{candidate.fullName}</Typography>
            <Chip
              label={candidate.status}
              color={getStatusColor(candidate.status)}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={8}>
          <List dense>
            <ListItem>
              <ListItemIcon><EmailIcon /></ListItemIcon>
              <ListItemText primary="Email" secondary={candidate.email || 'N/A'} />
            </ListItem>
            <ListItem>
              <ListItemIcon><PhoneIcon /></ListItemIcon>
              <ListItemText primary="Phone" secondary={candidate.phone || 'N/A'} />
            </ListItem>
            <ListItem>
              <ListItemIcon><LocationIcon /></ListItemIcon>
              <ListItemText primary="County" secondary={candidate.county || 'N/A'} />
            </ListItem>
            <ListItem>
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText 
                primary="Personal Details" 
                secondary={`Gender: ${candidate.gender || 'N/A'} | Age: ${candidate.dob ? Math.floor((new Date() - new Date(candidate.dob)) / 31557600000) : 'N/A'} | ${candidate.maritalStatus || 'N/A'}`} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><SchoolIcon /></ListItemIcon>
              <ListItemText 
                primary="Education" 
                secondary={candidate.highestEducation || 'N/A'} 
              />
            </ListItem>
            {candidate.languages && (
              <ListItem>
                <ListItemIcon><LanguageIcon /></ListItemIcon>
                <ListItemText 
                  primary="Languages" 
                  secondary={
                    Array.isArray(candidate.languages) 
                      ? candidate.languages.join(', ') 
                      : typeof candidate.languages === 'object'
                      ? Object.values(candidate.languages).join(', ')
                      : candidate.languages
                  } 
                />
              </ListItem>
            )}
          </List>
        </Grid>
      </Grid>
    );
  };

  const renderProfessionalInfo = () => {
    if (!profileData) return null;
    const { candidate } = profileData;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>Professional Background</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Work Experience
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Previous Employer" 
                    secondary={candidate.previousEmployer || 'Not specified'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Previous Role" 
                    secondary={candidate.previousRole || 'Not specified'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Duration" 
                    secondary={candidate.previousDuration || 'Not specified'} 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Skills & Preferences
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Relevant Skills" 
                    secondary={candidate.relevantSkills || 'Not specified'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Preferred Country" 
                    secondary={candidate.preferredCountry || 'Any'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Job Type Preference" 
                    secondary={candidate.jobTypePreference || 'Any'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Willing to Relocate" 
                    secondary={
                      <Chip
                        size="small"
                        label={candidate.willingToRelocate ? 'Yes' : 'No'}
                        color={candidate.willingToRelocate ? 'success' : 'default'}
                        icon={candidate.willingToRelocate ? <CheckCircleIcon /> : <CancelIcon />}
                      />
                    } 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderEnrollments = () => {
    if (!profileData) return null;
    const { enrollments, statistics } = profileData;

    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="caption">Total</Typography>
                <Typography variant="h5">{statistics.totalEnrollments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="caption">Active</Typography>
                <Typography variant="h5">{statistics.activeEnrollments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="caption">Completed</Typography>
                <Typography variant="h5">{statistics.completedEnrollments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="caption">Avg Score</Typography>
                <Typography variant="h5">{statistics.averageScore}%</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Enrolled Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id} hover>
                  <TableCell>{enrollment.course.title}</TableCell>
                  <TableCell>{enrollment.course.code}</TableCell>
                  <TableCell>{enrollment.course.category}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={enrollment.enrollmentStatus}
                      color={getEnrollmentStatusColor(enrollment.enrollmentStatus)}
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(enrollment.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
              {enrollments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">No enrollments found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderAssessments = () => {
    if (!profileData) return null;
    const { assessments, statistics } = profileData;

    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="caption">Total Assessments</Typography>
                <Typography variant="h5">{statistics.totalAssessments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="caption">Passed</Typography>
                <Typography variant="h5">{statistics.passedAssessments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="caption">Average Score</Typography>
                <Typography variant="h5">{statistics.averageScore}%</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={parseFloat(statistics.averageScore)} 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Assessment Type</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Comments</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow key={assessment.id} hover>
                  <TableCell>{assessment.course.title}</TableCell>
                  <TableCell>{assessment.assessmentType}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">{assessment.score ?? 'N/A'}%</Typography>
                      {assessment.score && (
                        <LinearProgress 
                          variant="determinate" 
                          value={assessment.score} 
                          sx={{ width: 50, height: 4 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={assessment.resultCategory || 'Pending'}
                      color={getResultColor(assessment.resultCategory)}
                    />
                  </TableCell>
                  <TableCell>
                    {assessment.assessmentDate 
                      ? format(new Date(assessment.assessmentDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {assessment.trainerComments || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {assessments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">No assessments found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderAttendance = () => {
    if (!profileData) return null;
    const { attendance, statistics } = profileData;

    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="caption">Attendance Rate</Typography>
                <Typography variant="h5">{statistics.attendanceRate}%</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={parseFloat(statistics.attendanceRate)} 
                  sx={{ mt: 1 }}
                  color={statistics.attendanceRate >= 80 ? 'success' : statistics.attendanceRate >= 60 ? 'warning' : 'error'}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="caption">Total Days</Typography>
                <Typography variant="h5">{statistics.totalAttendanceDays}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendance.map((record, index) => (
                <TableRow key={index} hover>
                  <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{record.course.title}</TableCell>
                  <TableCell>Session {record.sessionNumber || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={record.status}
                      color={record.status === 'PRESENT' ? 'success' : record.status === 'LATE' ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {record.remarks || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {attendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">No attendance records found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderDocuments = () => {
    if (!profileData) return null;
    const { documents, vettingStatus } = profileData;

    return (
      <Box>
        {vettingStatus && (
          <Alert 
            severity={vettingStatus.status === 'APPROVED' ? 'success' : vettingStatus.status === 'REJECTED' ? 'error' : 'info'}
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle2">Vetting Status: {vettingStatus.status}</Typography>
            {vettingStatus.notes && (
              <Typography variant="caption">{vettingStatus.notes}</Typography>
            )}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Document Type</TableCell>
                <TableCell>File Name</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>{doc.documentType}</TableCell>
                  <TableCell>{doc.fileName}</TableCell>
                  <TableCell>{format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={doc.status || 'Uploaded'}
                      color="success"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary">No documents uploaded</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh' } }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <PersonIcon />
          <Typography variant="h6">Candidate Profile</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : profileData ? (
          <Box>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
              <Tab icon={<PersonIcon />} label="Personal Info" />
              <Tab icon={<WorkIcon />} label="Professional" />
              <Tab icon={<SchoolIcon />} label="Enrollments" />
              <Tab icon={<AssessmentIcon />} label="Assessments" />
              <Tab icon={<AttendanceIcon />} label="Attendance" />
              <Tab icon={<DocumentIcon />} label="Documents" />
            </Tabs>

            <Box sx={{ minHeight: 400 }}>
              {activeTab === 0 && renderPersonalInfo()}
              {activeTab === 1 && renderProfessionalInfo()}
              {activeTab === 2 && renderEnrollments()}
              {activeTab === 3 && renderAssessments()}
              {activeTab === 4 && renderAttendance()}
              {activeTab === 5 && renderDocuments()}
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CandidateProfileDialog;
