import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Container,
  Stack,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  UserGroupIcon,
  CheckCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  PlusIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { recruiterDashboard as recruiterDashboardService } from '../../api/dashboard';
import { useSelector } from 'react-redux';

// Custom tab panel component
const TabPanel = ({ children, value, index, ...other }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`recruiter-tabpanel-${index}`}
    aria-labelledby={`recruiter-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </Box>
);

const tabLabels = ['Overview', 'Talent Pipeline', 'Jobs & Activity'];

const RecruiterDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pipelinePage, setPipelinePage] = useState(0);
  const [pipelineRowsPerPage, setPipelineRowsPerPage] = useState(10);
  const [jobsPage, setJobsPage] = useState(0);
  const [jobRowsPerPage, setJobRowsPerPage] = useState(5);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recruiterDashboardService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to load recruiter dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    setPipelinePage(0);
  }, [searchTerm]);

  const formatNumber = (value) => new Intl.NumberFormat().format(value ?? 0);

  const formatStatus = (status) => {
    if (!status) return '—';
    return status
      .toString()
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
    if (!value) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', options).format(new Date(value));
    } catch (error) {
      return value;
    }
  };

  const getStatusChipColors = (status) => {
    const normalized = status?.toUpperCase();
    switch (normalized) {
      case 'PLACED':
        return { bg: theme.palette.success.light, color: theme.palette.success.main };
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW':
        return { bg: theme.palette.warning.light, color: theme.palette.warning.main };
      case 'UNDER_REVIEW':
      case 'ENROLLED':
        return { bg: theme.palette.info.light, color: theme.palette.info.main };
      case 'APPLIED':
      case 'WAITLISTED':
        return { bg: theme.palette.secondary.light, color: theme.palette.secondary.main };
      default:
        return { bg: theme.palette.grey[100], color: theme.palette.text.primary };
    }
  };

  const statsCards = useMemo(() => {
    if (!dashboardData?.stats) return [];
    const { stats } = dashboardData;
    return [
      {
        title: 'Total Placements',
        value: formatNumber(stats.totalPlacements),
        caption: 'All-time conversions',
        icon: CheckCircleIcon,
        color: theme.palette.success.main,
      },
      {
        title: 'Active Roles',
        value: formatNumber(stats.openRoles),
        caption: 'Placements in progress',
        icon: BriefcaseIcon,
        color: theme.palette.info.main,
      },
      {
        title: 'Hires (30 days)',
        value: formatNumber(stats.hiresLast30Days),
        caption: 'Completed last 30 days',
        icon: UserGroupIcon,
        color: theme.palette.primary.main,
      },
      {
        title: 'Upcoming Interviews',
        value: formatNumber(stats.interviewsScheduled),
        caption: 'Scheduled this week',
        icon: CalendarIcon,
        color: theme.palette.warning.main,
      },
    ];
  }, [dashboardData, theme]);

  const pipelineBreakdown = dashboardData?.pipeline?.breakdown ?? [];
  const pipelineChartData = pipelineBreakdown.map((item) => ({
    ...item,
    label: formatStatus(item.status),
  }));

  const priorityCandidates = dashboardData?.priorityCandidates ?? [];
  const filteredCandidates = useMemo(() => {
    if (!searchTerm) return priorityCandidates;
    return priorityCandidates.filter((candidate) => {
      const haystack = `${candidate.name} ${candidate.jobType || ''} ${candidate.region || ''} ${candidate.email || ''}`;
      return haystack.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [priorityCandidates, searchTerm]);

  const paginatedCandidates = filteredCandidates.slice(
    pipelinePage * pipelineRowsPerPage,
    pipelinePage * pipelineRowsPerPage + pipelineRowsPerPage,
  );

  const jobOpenings = dashboardData?.jobOpenings ?? [];
  const paginatedJobs = jobOpenings.slice(jobsPage * jobRowsPerPage, jobsPage * jobRowsPerPage + jobRowsPerPage);

  const documents = dashboardData?.documents ?? {};
  const docItems = [
    { label: 'Missing medical clearance', value: documents.missingMedical ?? 0 },
    { label: 'Missing police clearance', value: documents.missingPolice ?? 0 },
    { label: 'Missing passport copy', value: documents.missingPassport ?? 0 },
  ];

  const upcomingInterviews = dashboardData?.upcomingInterviews ?? [];
  const recentPlacements = dashboardData?.recentPlacements ?? [];
  const activityFeed = dashboardData?.activityFeed ?? [];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = () => {
    if (!loading) {
      loadDashboard();
    }
  };

  const renderEmptyState = (message) => (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  if (loading && !dashboardData) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress size={64} />
      </Box>
    );
  }

  if (!loading && !dashboardData) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert
          severity="error"
          action={(
            <Button color="inherit" size="small" onClick={loadDashboard}>
              Retry
            </Button>
          )}
        >
          {error || 'Unable to fetch recruiter dashboard data'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {error && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={(
            <Button color="inherit" size="small" onClick={loadDashboard} disabled={loading}>
              Retry
            </Button>
          )}
        >
          {error}
        </Alert>
      )}
      {/* Welcome Banner */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Grid container alignItems="center" spacing={3}>
          <Grid item>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                fontSize: '2rem',
                bgcolor: 'rgba(255,255,255,0.2)',
              }}
            >
              {user?.firstName?.charAt(0) || 'R'}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Welcome, {user?.firstName || 'Recruiter'}!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
              Manage your candidates, roles, and placement health in one view
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                startIcon={<UserGroupIcon style={{ width: 20, height: 20 }} />}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                }}
                onClick={() => navigate('/recruiter/candidates')}
              >
                View Candidates
              </Button>
              <Button
                variant="outlined"
                startIcon={<BriefcaseIcon style={{ width: 20, height: 20 }} />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
                onClick={() => navigate('/recruiter/placements')}
              >
                View Placements
              </Button>
              <Button
                variant="outlined"
                startIcon={<ChartBarIcon style={{ width: 20, height: 20 }} />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: `${stat.color}20`,
                      color: stat.color,
                      mr: 2,
                    }}
                  >
                    <stat.icon style={{ width: 24, height: 24 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {stat.caption}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
            },
          }}
        >
          {tabLabels.map((label, index) => (
            <Tab key={label} label={label} id={`recruiter-tab-${index}`} aria-controls={`recruiter-tabpanel-${index}`} />
          ))}
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Stack spacing={3}>
                <Card sx={{ height: 400 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Pipeline Health
                      </Typography>
                      <Chip
                        size="small"
                        label={`${formatNumber(dashboardData?.pipeline?.total ?? 0)} candidates`}
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                    {pipelineChartData.length === 0 ? (
                      renderEmptyState('No candidates in pipeline yet')
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={pipelineChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[200]} />
                          <XAxis dataKey="label" stroke={theme.palette.text.secondary} />
                          <YAxis stroke={theme.palette.text.secondary} allowDecimals={false} />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Recent Placements
                    </Typography>
                    {recentPlacements.length === 0 ? (
                      renderEmptyState('No placements recorded yet')
                    ) : (
                      <List sx={{ p: 0 }}>
                        {recentPlacements.map((placement, index) => (
                          <React.Fragment key={placement.id}>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: theme.palette.success.light, color: theme.palette.success.main }}>
                                  <CheckCircleIcon style={{ width: 20, height: 20 }} />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {placement.candidate || 'Unnamed Candidate'} → {placement.employer || 'Employer'}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {formatStatus(placement.status)} • {formatDate(placement.updatedAt)}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            {index < recentPlacements.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Compliance Watchlist
                    </Typography>
                    <Stack spacing={2}>
                      {docItems.map((doc) => (
                        <Alert key={doc.label} severity={doc.value > 0 ? 'warning' : 'success'} sx={{ alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {doc.label}
                          </Typography>
                          <Typography variant="caption">
                            {doc.value > 0 ? `${doc.value} candidate(s) pending` : 'All documents submitted'}
                          </Typography>
                        </Alert>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Upcoming Interviews
                    </Typography>
                    {upcomingInterviews.length === 0 ? (
                      renderEmptyState('No interviews scheduled this week')
                    ) : (
                      <List sx={{ p: 0 }}>
                        {upcomingInterviews.map((interview, index) => (
                          <React.Fragment key={interview.id}>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {interview.candidate || 'Candidate'} → {interview.employer || 'Employer'}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(interview.interviewDate, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: 'numeric',
                                    })}
                                    {interview.jobRole ? ` • ${interview.jobRole}` : ''}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            {index < upcomingInterviews.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Activity Feed
                    </Typography>
                    {activityFeed.length === 0 ? (
                      renderEmptyState('No recent activity')
                    ) : (
                      <List sx={{ p: 0 }}>
                        {activityFeed.slice(0, 4).map((activity, index) => (
                          <React.Fragment key={activity.id}>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.main }}>
                                  <BuildingOfficeIcon style={{ width: 18, height: 18 }} />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {activity.action}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {activity.actor ? `${activity.actor} • ` : ''}
                                    {formatDate(activity.createdAt)}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            {index < Math.min(activityFeed.length, 4) - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Talent Pipeline Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  placeholder="Search priority candidates..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MagnifyingGlassIcon style={{ width: 20, height: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PlusIcon style={{ width: 20, height: 20 }} />}
                    onClick={() => setActiveTab(2)}
                  >
                    Create Job Opening
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            {filteredCandidates.length === 0 ? (
              renderEmptyState('No priority candidates match your search')
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
                      <TableCell sx={{ fontWeight: 600 }}>Candidate</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Region</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Job Preference</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Languages</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Update</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCandidates.map((candidate) => {
                      const colors = getStatusChipColors(candidate.status);
                      return (
                        <TableRow key={candidate.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.light, color: theme.palette.primary.main }}>
                                {candidate.name?.charAt(0) || '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {candidate.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {candidate.email || 'No email provided'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={formatStatus(candidate.status)}
                              sx={{
                                bgcolor: colors.bg,
                                color: colors.color,
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{candidate.region || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{candidate.jobType || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" gap={1} flexWrap="wrap">
                              {(candidate.languages || []).slice(0, 2).map((language) => (
                                <Chip key={language} label={language} size="small" />
                              ))}
                              {(candidate.languages || []).length === 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  —
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{formatDate(candidate.updatedAt)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={candidate.email ? `Email ${candidate.name}` : 'Email unavailable'}>
                              <span>
                                <IconButton
                                  size="small"
                                  component={candidate.email ? 'a' : 'button'}
                                  href={candidate.email ? `mailto:${candidate.email}` : undefined}
                                  disabled={!candidate.email}
                                >
                                  <EnvelopeIcon style={{ width: 18, height: 18 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredCandidates.length}
                  rowsPerPage={pipelineRowsPerPage}
                  page={pipelinePage}
                  onPageChange={(event, newPage) => setPipelinePage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setPipelineRowsPerPage(parseInt(event.target.value, 10));
                    setPipelinePage(0);
                  }}
                />
              </>
            )}
          </TableContainer>
        </TabPanel>

        {/* Jobs & Activity Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Job Openings
                  </Typography>
                  {jobOpenings.length === 0 ? (
                    renderEmptyState('No job openings recorded yet')
                  ) : (
                    <>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Job Title</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Employer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Openings</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Interview Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedJobs.map((job) => (
                            <TableRow key={job.id}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {job.jobRole}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{job.employer || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{job.location || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={formatStatus(job.status)} size="small" />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={formatStatus(job.priority)}
                                  size="small"
                                  color={job.priority?.toLowerCase() === 'high' ? 'error' : job.priority?.toLowerCase() === 'low' ? 'default' : 'warning'}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{job.openings ?? '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{formatDate(job.interviewDate)}</Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={jobOpenings.length}
                        rowsPerPage={jobRowsPerPage}
                        page={jobsPage}
                        onPageChange={(event, newPage) => setJobsPage(newPage)}
                        onRowsPerPageChange={(event) => {
                          setJobRowsPerPage(parseInt(event.target.value, 10));
                          setJobsPage(0);
                        }}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Activity Feed
                  </Typography>
                  {activityFeed.length === 0 ? (
                    renderEmptyState('No activity logged yet')
                  ) : (
                    <List sx={{ p: 0 }}>
                      {activityFeed.map((activity, index) => (
                        <React.Fragment key={activity.id}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {activity.action}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {activity.actor ? `${activity.actor} • ` : ''}
                                  {formatDate(activity.createdAt)}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < activityFeed.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Placement Snapshot
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Pipeline Total</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {formatNumber(dashboardData?.pipeline?.total ?? 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Active Roles</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {formatNumber(dashboardData?.stats?.openRoles ?? 0)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Docs Pending</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {formatNumber(docItems.reduce((sum, doc) => sum + doc.value, 0))}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default RecruiterDashboard;
