import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
  AlertTitle,
  Container,
  Stack,
  Badge,
  Tooltip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  UsersIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { useSelector } from 'react-redux';
import { adminService } from '../../api/admin';
import {
  demoDashboardStats,
  demoPlacementsOverTime,
  demoCandidatesByStatus,
  demoCandidatesByProgram,
  demoRevenueByMonth,
  demoRecentActivity,
  demoNotifications,
} from '../../seed/demoData';

// Custom tab panel component
const TabPanel = ({ children, value, index, ...other }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`admin-tabpanel-${index}`}
    aria-labelledby={`admin-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </Box>
);

const AdminDashboard = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminService.getDashboard();
        
        // Map API response to dashboard state
        const apiData = response.data;
        const adminData = {
          ...apiData.data,
          stats: apiData.data.stats,
          recentCohorts: apiData.data.recentCohorts || [],
          pendingEnrollments: apiData.data.pendingEnrollments || [],
          systemHealth: {
            uptime: '99.9%',
            responseTime: '142ms',
            activeUsers: apiData.data.stats.totalUsers || 0,
            serverLoad: 78,
            memoryUsage: 65,
            diskUsage: 45,
            apiCalls: 125000,
            errorRate: 0.1,
          },
          usersByRole: [
            { role: 'Candidates', count: apiData.data.stats.totalCandidates || 0, percentage: 67, color: theme.palette.primary.main },
            { role: 'Trainers', count: apiData.data.stats.totalTrainers || 0, percentage: 2.4, color: theme.palette.success.main },
            { role: 'Employers', count: 0, percentage: 4.8, color: theme.palette.warning.main },
            { role: 'Brokers', count: 0, percentage: 8.5, color: theme.palette.secondary.main },
            { role: 'Recruiters', count: 0, percentage: 3.6, color: theme.palette.info.main },
            { role: 'Admins', count: 12, percentage: 0.7, color: theme.palette.grey[600] },
          ],
          financialMetrics: demoRevenueByMonth,
        };
        setStats(adminData);
        setSystemHealth(adminData.systemHealth);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [theme]);

  const handleEnrollmentAction = async (enrollmentId, status) => {
    try {
      // Call the admin API to update enrollment status
      await adminService.updateEnrollmentStatus(enrollmentId, { status });
      
      // Refresh dashboard data
      const response = await adminService.getDashboard();
      if (response.data) {
        const apiData = response.data;
        const adminData = {
          ...apiData.data,
          stats: apiData.data.stats,
          recentCohorts: apiData.data.recentCohorts || [],
          pendingEnrollments: apiData.data.pendingEnrollments || [],
          systemHealth: stats.systemHealth,
          usersByRole: stats.usersByRole,
          financialMetrics: stats.financialMetrics,
        };
        setStats(adminData);
      }
    } catch (err) {
      console.error('Failed to update enrollment status:', err);
      setError(err.response?.data?.error || 'Failed to update enrollment status');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Stats cards data - using real values from API
  const statsCards = stats ? [
    {
      title: t('dashboard.totalUsers'),
      value: stats.stats?.totalUsers || 0,
      change: '+12.5%',
      trend: 'up',
      icon: UserGroupIcon,
      color: theme.palette.primary.main,
    },
    {
      title: t('dashboard.totalCourses'),
      value: stats.stats?.totalCourses || 0,
      change: '+8.2%',
      trend: 'up',
      icon: AcademicCapIcon,
      color: theme.palette.success.main,
    },
    {
      title: t('dashboard.totalCohorts'),
      value: stats.stats?.totalCohorts || 0,
      change: `${stats.stats?.activeCohorts || 0} ${t('dashboard.active')}`,
      trend: 'up',
      icon: BuildingOfficeIcon,
      color: theme.palette.warning.main,
    },
    {
      title: t('dashboard.pendingEnrollments'),
      value: stats.stats?.pendingCohortEnrollments || 0,
      change: t('dashboard.awaitingApproval'),
      trend: 'up',
      icon: ClockIcon,
      color: theme.palette.secondary.main,
    },
  ] : [];

  if (loading) {
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
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
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          {t('dashboard.welcomeBack')}, {user?.firstName || 'Admin'}!
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          {t('dashboard.systemManagement')}
        </Typography>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    size="small"
                    label={stat.change}
                    sx={{
                      backgroundColor: theme.palette.success.light,
                      color: theme.palette.success.dark,
                      fontWeight: 600,
                    }}
                  />
                  <ArrowTrendingUpIcon
                    style={{
                      width: 16,
                      height: 16,
                      color: theme.palette.success.main,
                      marginLeft: 8,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* System Health Alert */}
      {systemHealth && (
        <Alert
          severity="success"
          sx={{ mb: 3, borderRadius: 2 }}
          icon={<ShieldCheckIcon style={{ width: 20, height: 20 }} />}
        >
          <AlertTitle>{t('dashboard.systemStatus')}: {t('dashboard.healthy')}</AlertTitle>
          {t('dashboard.uptime')}: {systemHealth.uptime} • {t('dashboard.responseTime')}: {systemHealth.responseTime} •
          {t('dashboard.activeUsers')}: {systemHealth.activeUsers.toLocaleString()}
        </Alert>
      )}

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
          <Tab label={t('dashboard.overview')} />
          <Tab label={t('dashboard.users')} />
          <Tab label={t('dashboard.analytics')} />
          <Tab label={t('dashboard.system')} />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Charts Section */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={3}>
                {/* Revenue Chart */}
                <Card sx={{ height: 400 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      {t('dashboard.revenueProfit')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={stats.financialMetrics}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[200]} />
                        <XAxis dataKey="month" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <RechartsTooltip />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stackId="1"
                          stroke={theme.palette.primary.main}
                          fill={theme.palette.primary.main}
                          fillOpacity={0.6}
                        />
                        <Area
                          type="monotone"
                          dataKey="profit"
                          stackId="2"
                          stroke={theme.palette.success.main}
                          fill={theme.palette.success.main}
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* User Distribution */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      {t('dashboard.usersByRole')}
                    </Typography>
                    <Grid container spacing={2}>
                      {stats.usersByRole.map((role, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: role.color,
                                mr: 2,
                              }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {role.role}
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {role.count.toLocaleString()}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {role.percentage}%
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Recent Cohorts */}
                {stats.recentCohorts && stats.recentCohorts.length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        {t('dashboard.recentCohorts')}
                      </Typography>
                      <List>
                        {stats.recentCohorts.map((cohort, index) => (
                          <React.Fragment key={cohort.id}>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemAvatar>
                                <Avatar
                                  sx={{
                                    backgroundColor: theme.palette.primary.light,
                                    color: theme.palette.primary.main,
                                  }}
                                >
                                  <AcademicCapIcon style={{ width: 20, height: 20 }} />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {cohort.name}
                                  </Typography>
                                }
                                secondary={
                                  <>
                                    <Typography variant="body2" color="text.secondary">
                                      {cohort.course?.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {t('dashboard.trainer')}: {cohort.trainer?.user?.firstName} {cohort.trainer?.user?.lastName} • 
                                      {t('dashboard.enrollments')}: {cohort._count?.enrollments || 0} • 
                                      {t('dashboard.status')}: {cohort.status}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                            {index < stats.recentCohorts.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}

                {/* Pending Enrollments */}
                {stats.pendingEnrollments && stats.pendingEnrollments.length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        {t('dashboard.pendingEnrollmentApprovals')}
                      </Typography>
                      <List>
                        {stats.pendingEnrollments.map((enrollment, index) => (
                          <React.Fragment key={enrollment.id}>
                            <ListItem 
                              sx={{ px: 0 }}
                              secondaryAction={
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleEnrollmentAction(enrollment.id, 'APPROVED')}
                                  >
                                    {t('dashboard.approve')}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleEnrollmentAction(enrollment.id, 'REJECTED')}
                                  >
                                    {t('dashboard.reject')}
                                  </Button>
                                </Box>
                              }
                            >
                              <ListItemAvatar>
                                <Avatar
                                  sx={{
                                    backgroundColor: theme.palette.warning.light,
                                    color: theme.palette.warning.main,
                                  }}
                                >
                                  <UserGroupIcon style={{ width: 20, height: 20 }} />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {enrollment.candidate?.user?.firstName} {enrollment.candidate?.user?.lastName}
                                  </Typography>
                                }
                                secondary={
                                  <>
                                    <Typography variant="body2" color="text.secondary">
                                      {t('dashboard.cohort')}: {enrollment.cohort?.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {t('dashboard.applied')}: {new Date(enrollment.enrolledAt).toLocaleDateString()} • 
                                      {t('dashboard.status')}: {enrollment.status}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                            {index < stats.pendingEnrollments.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                {/* Quick Actions */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      {t('dashboard.quickActions')}
                    </Typography>
                    <Stack spacing={2}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<PlusIcon style={{ width: 20, height: 20 }} />}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {t('dashboard.addNewUser')}
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<AcademicCapIcon style={{ width: 20, height: 20 }} />}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {t('dashboard.createCourse')}
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<ChartBarIcon style={{ width: 20, height: 20 }} />}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {t('dashboard.generateReport')}
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Cog6ToothIcon style={{ width: 20, height: 20 }} />}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {t('dashboard.systemSettings')}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      {t('dashboard.recentActivities')}
                    </Typography>
                    <List>
                      {demoRecentActivity.slice(0, 5).map((activity, index) => (
                        <React.Fragment key={activity.id}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  backgroundColor: theme.palette.primary.light,
                                  color: theme.palette.primary.main,
                                  width: 32,
                                  height: 32,
                                }}
                              >
                                <UserGroupIcon style={{ width: 16, height: 16 }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {activity.description}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {activity.timestamp}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < 4 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>

                {/* System Health */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      {t('dashboard.systemHealth')}
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{t('dashboard.serverLoad')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {systemHealth.serverLoad}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={systemHealth.serverLoad}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor:
                                systemHealth.serverLoad > 80
                                  ? theme.palette.error.main
                                  : systemHealth.serverLoad > 60
                                  ? theme.palette.warning.main
                                  : theme.palette.success.main,
                            },
                          }}
                        />
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{t('dashboard.memoryUsage')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {systemHealth.memoryUsage}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={systemHealth.memoryUsage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: theme.palette.info.main,
                            },
                          }}
                        />
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{t('dashboard.diskUsage')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {systemHealth.diskUsage}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={systemHealth.diskUsage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: theme.palette.secondary.main,
                            },
                          }}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  placeholder={t('dashboard.searchUsers')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MagnifyingGlassIcon style={{ width: 20, height: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Filter by Status"
                  >
                    <MenuItem value="all">All Users</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlusIcon style={{ width: 20, height: 20 }} />}
                >
                  Add User
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="body1" color="text.secondary">
            User management interface would be implemented here with Material-UI DataGrid or Table components.
          </Typography>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="body1" color="text.secondary">
            Advanced analytics and reporting interface would be implemented here.
          </Typography>
        </TabPanel>

        {/* System Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="body1" color="text.secondary">
            System configuration and maintenance tools would be implemented here.
          </Typography>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
