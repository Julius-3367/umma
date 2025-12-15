import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Work,
  LocationOn,
  AttachMoney,
  Schedule,
  CheckCircle,
  Pending,
  Flight,
  Description,
  Event,
  Business,
  TrendingUp,
} from '@mui/icons-material';
import { format } from 'date-fns';

/**
 * Job Application & Placement Tracking Page
 * Features:
 * - Current placement stage indicator
 * - Job applications status
 * - Interview schedule
 * - Employer matching
 * - Visa and deployment progress
 */
const PlacementPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // Placement journey stages
  const placementStages = [
    { label: 'Profile Verification', status: 'completed', date: '2025-10-15' },
    { label: 'Skills Assessment', status: 'completed', date: '2025-10-20' },
    { label: 'Job Matching', status: 'active', date: '2025-11-01' },
    { label: 'Interview Process', status: 'pending', date: null },
    { label: 'Offer Negotiation', status: 'pending', date: null },
    { label: 'Contract Signing', status: 'pending', date: null },
    { label: 'Visa Processing', status: 'pending', date: null },
    { label: 'Deployment', status: 'pending', date: null },
  ];

  const activeStageIndex = placementStages.findIndex(s => s.status === 'active');

  // Job applications
  const applications = [
    {
      id: 1,
      jobTitle: 'Factory Worker',
      company: 'ABC Manufacturing Ltd',
      location: 'Singapore',
      salary: 'SGD 1,800 - 2,200',
      appliedDate: '2025-11-05',
      status: 'interview_scheduled',
      interviewDate: '2025-11-18',
      interviewTime: '10:00 AM',
      matchScore: 92,
    },
    {
      id: 2,
      jobTitle: 'Warehouse Assistant',
      company: 'Global Logistics Pte Ltd',
      location: 'Malaysia',
      salary: 'MYR 2,000 - 2,500',
      appliedDate: '2025-11-03',
      status: 'under_review',
      matchScore: 85,
    },
    {
      id: 3,
      jobTitle: 'Production Operator',
      company: 'XYZ Industries',
      location: 'Thailand',
      salary: 'THB 18,000 - 22,000',
      appliedDate: '2025-10-28',
      status: 'rejected',
      rejectionReason: 'Position filled',
      matchScore: 78,
    },
  ];

  // Interview schedule
  const interviews = [
    {
      id: 1,
      jobTitle: 'Factory Worker',
      company: 'ABC Manufacturing Ltd',
      date: '2025-11-18',
      time: '10:00 AM',
      type: 'Video Interview',
      interviewer: 'Mr. John Smith - HR Manager',
      platform: 'Zoom',
      meetingLink: 'https://zoom.us/j/123456789',
      status: 'scheduled',
    },
  ];

  // Visa and deployment progress
  const visaProgress = {
    stage: 'not_started',
    steps: [
      { label: 'Document Submission', status: 'pending', date: null },
      { label: 'Embassy Processing', status: 'pending', date: null },
      { label: 'Medical Examination', status: 'pending', date: null },
      { label: 'Visa Approval', status: 'pending', date: null },
      { label: 'Travel Arrangements', status: 'pending', date: null },
    ],
  };

  // Matched employers
  const matchedEmployers = [
    {
      id: 1,
      name: 'ABC Manufacturing Ltd',
      location: 'Singapore',
      industry: 'Manufacturing',
      openPositions: 3,
      matchScore: 92,
      logo: null,
    },
    {
      id: 2,
      name: 'Global Logistics Pte Ltd',
      location: 'Malaysia',
      industry: 'Logistics',
      openPositions: 2,
      matchScore: 85,
      logo: null,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'interview_scheduled':
      case 'scheduled':
        return 'primary';
      case 'under_review':
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'accepted':
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Job Placement & Applications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your job applications and placement journey
        </Typography>
      </Box>

      {/* Placement Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Placement Journey Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Current Stage: {placementStages[activeStageIndex]?.label}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={(activeStageIndex / (placementStages.length - 1)) * 100}
            sx={{ height: 10, borderRadius: 1, mb: 3 }}
          />

          <Stepper activeStep={activeStageIndex} orientation="vertical">
            {placementStages.map((stage, index) => (
              <Step key={stage.label} completed={stage.status === 'completed'}>
                <StepLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body1" fontWeight={500}>
                      {stage.label}
                    </Typography>
                    {stage.status === 'completed' && (
                      <Chip label="COMPLETED" size="small" color="success" icon={<CheckCircle />} />
                    )}
                    {stage.status === 'active' && (
                      <Chip label="IN PROGRESS" size="small" color="primary" />
                    )}
                    {stage.date && (
                      <Chip
                        label={format(new Date(stage.date), 'MMM dd, yyyy')}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {stage.status === 'completed' && 'Completed successfully'}
                    {stage.status === 'active' && 'Currently in progress'}
                    {stage.status === 'pending' && 'Pending - Will start after previous stages'}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="My Applications" />
          <Tab label="Interview Schedule" />
          <Tab label="Matched Employers" />
          <Tab label="Visa & Deployment" />
        </Tabs>
      </Card>

      {/* My Applications Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {applications.map((app) => (
            <Grid item xs={12} key={app.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {app.jobTitle}
                        </Typography>
                        <Chip
                          label={getStatusLabel(app.status)}
                          color={getStatusColor(app.status)}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <Business sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {app.company}
                      </Typography>

                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Location
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {app.location}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Salary Range
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            <AttachMoney sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {app.salary}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Applied Date
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {format(new Date(app.appliedDate), 'MMM dd, yyyy')}
                          </Typography>
                        </Grid>
                      </Grid>

                      {app.interviewDate && (
                        <Paper sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                          <Typography variant="body2" fontWeight={600} gutterBottom>
                            Interview Scheduled
                          </Typography>
                          <Typography variant="body2">
                            <Event sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {format(new Date(app.interviewDate), 'EEEE, MMM dd, yyyy')} at {app.interviewTime}
                          </Typography>
                        </Paper>
                      )}

                      {app.rejectionReason && (
                        <Paper sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                          <Typography variant="body2" color="error" fontWeight={600}>
                            Rejection Reason: {app.rejectionReason}
                          </Typography>
                        </Paper>
                      )}
                    </Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Match Score
                      </Typography>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          border: `4px solid ${theme.palette.success.main}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mt: 1,
                        }}
                      >
                        <Typography variant="h5" fontWeight={700} color="success.main">
                          {app.matchScore}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button variant="outlined" size="small">
                      View Job Details
                    </Button>
                    {app.status === 'interview_scheduled' && (
                      <Button variant="contained" size="small">
                        Prepare for Interview
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Interview Schedule Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {interviews.length > 0 ? (
            interviews.map((interview) => (
              <Grid item xs={12} key={interview.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {interview.jobTitle}
                      </Typography>
                      <Chip label={interview.type} color="primary" />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {interview.company}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Date & Time
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {format(new Date(interview.date), 'EEEE, MMMM dd, yyyy')}
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {interview.time}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Interviewer
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {interview.interviewer}
                        </Typography>
                      </Grid>
                    </Grid>

                    {interview.platform && (
                      <Paper sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Platform: {interview.platform}
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          Meeting Link: {interview.meetingLink}
                        </Typography>
                      </Paper>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button variant="contained" size="small">
                        Add to Calendar
                      </Button>
                      <Button variant="outlined" size="small">
                        Interview Tips
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No Scheduled Interviews
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your interview schedule will appear here once scheduled
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Matched Employers Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          {matchedEmployers.map((employer) => (
            <Grid item xs={12} md={6} key={employer.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                      <Business fontSize="large" />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {employer.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employer.industry}
                      </Typography>
                      <Chip
                        label={`${employer.matchScore}% Match`}
                        size="small"
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {employer.location}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Open Positions
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {employer.openPositions} positions
                      </Typography>
                    </Grid>
                  </Grid>

                  <Button variant="outlined" size="small" fullWidth sx={{ mt: 2 }}>
                    View Job Openings
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Visa & Deployment Tab */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Visa Processing & Deployment
            </Typography>

            {visaProgress.stage === 'not_started' ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                <Flight sx={{ fontSize: 64, color: 'info.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Visa Processing Not Started
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Visa processing will begin after you receive a job offer and sign the contract
                </Typography>
              </Paper>
            ) : (
              <Stepper orientation="vertical">
                {visaProgress.steps.map((step, index) => (
                  <Step key={step.label} active={step.status === 'active'} completed={step.status === 'completed'}>
                    <StepLabel>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={500}>
                          {step.label}
                        </Typography>
                        {step.date && (
                          <Chip
                            label={format(new Date(step.date), 'MMM dd, yyyy')}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {step.status === 'completed' && 'Completed successfully'}
                        {step.status === 'active' && 'Currently in progress'}
                        {step.status === 'pending' && 'Pending'}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PlacementPage;
