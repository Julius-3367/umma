import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
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
  Button,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PersonAdd,
  Edit,
  Delete,
  Refresh,
} from '@mui/icons-material';
import { adminService } from '../../api/admin';
// import KPIMetricsCards from '../../components/dashboard/KPIMetricsCards';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch dashboard data
      try {
        const response = await adminService.getDashboard();
        setDashboardData(response.data.data);
      } catch (apiError) {
        console.warn('Dashboard API error, using demo data:', apiError);
        // Use demo data if API fails
        setDashboardData({
          totalUsers: 0,
          activeUsers: 0,
          totalCandidates: 0,
          activeCandidates: 0,
          totalCourses: 0,
          activeCourses: 0,
          recentUsers: [],
          recentEnrollments: []
        });
      }
    } catch (err) {
      console.error('Error in dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const { stats, recentUsers, recentEnrollments, recentActivity } = dashboardData || {};

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Admin Dashboard
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDashboard}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => navigate('/admin/users/new')}
          >
            Add User
          </Button>
        </Stack>
      </Box>

      {/* KPI Metrics Cards - TEMPORARILY DISABLED */}
      {/* <Box mb={4}>
        {dashboardData && (
          <KPIMetricsCards ... />
        )}
      </Box> */}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats?.totalUsers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Candidates
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats?.totalCandidates || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Courses
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats?.activeCourses || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                of {stats?.totalCourses || 0} total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Enrollments
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats?.activeEnrollments || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats?.completionRate || 0}% completion rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Users */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Users
                </Typography>
                <Button size="small" onClick={() => navigate('/admin/users')}>
                  View All
                </Button>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role?.name || 'N/A'}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status}
                            size="small"
                            color={user.status === 'ACTIVE' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin/users/${user.id}`)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Enrollments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Enrollments
                </Typography>
                <Button size="small" onClick={() => navigate('/admin/enrollments')}>
                  View All
                </Button>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Course</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentEnrollments?.slice(0, 5).map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {enrollment.candidate?.fullName || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {enrollment.course?.title || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {enrollment.course?.code || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={enrollment.enrollmentStatus}
                            size="small"
                            color={enrollment.enrollmentStatus === 'ENROLLED' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Recent Activity
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Resource</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivity?.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          {activity.user?.firstName} {activity.user?.lastName}
                        </TableCell>
                        <TableCell>
                          <Chip label={activity.action} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{activity.resource || 'N/A'}</TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(activity.createdAt).toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
