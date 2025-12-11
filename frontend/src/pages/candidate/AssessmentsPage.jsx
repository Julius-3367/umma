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
  Tab,
  Tabs,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  CheckCircle,
  Schedule,
  Star,
  EventAvailable,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { candidateService } from '../../api/candidate';

const AssessmentsPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    upcoming: [],
    completed: [],
    stats: {
      averageScore: 0,
      completedCount: 0,
      passedCount: 0,
      highestScore: 0,
    },
    performanceData: [],
  });

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await candidateService.getAssessmentResults();
        setData(response);
      } catch (err) {
        console.error('Failed to fetch assessments:', err);
        setError(err.response?.data?.message || 'Failed to load assessment data');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const { upcoming, completed, stats, performanceData } = data;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Assessments & Exams
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your performance and upcoming assessments
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Score
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {stats.averageScore}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp sx={{ color: 'primary.main', fontSize: 28 }} />
                </Box>
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
                    Completed
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.completedCount}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Assessment sx={{ color: 'info.main', fontSize: 28 }} />
                </Box>
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
                    Passed
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {stats.passedCount}
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
                  <CheckCircle sx={{ color: 'success.main', fontSize: 28 }} />
                </Box>
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
                    Highest Score
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {stats.highestScore}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Star sx={{ color: 'warning.main', fontSize: 28 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Upcoming" />
          <Tab label="Completed" />
          <Tab label="Performance Trends" />
        </Tabs>

        <CardContent>
          {/* Upcoming Tab */}
          {activeTab === 0 && (
            <Box>
              {upcoming.length === 0 ? (
                <Alert severity="info">No upcoming assessments scheduled</Alert>
              ) : (
                <Grid container spacing={2}>
                  {upcoming.map((assessment) => (
                    <Grid item xs={12} md={6} key={assessment.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {assessment.title}
                          </Typography>
                          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EventAvailable fontSize="small" color="action" />
                              <Typography variant="body2">
                                {format(new Date(assessment.date), 'MMM dd, yyyy')} at {assessment.time}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Schedule fontSize="small" color="action" />
                              <Typography variant="body2">Duration: {assessment.duration}</Typography>
                            </Box>
                            <Box sx={{ mt: 1 }}>
                              <Chip label={assessment.type} size="small" color="primary" />
                              <Chip label={`${assessment.totalMarks} marks`} size="small" sx={{ ml: 1 }} />
                            </Box>
                          </Box>
                          <Button
                            variant="outlined"
                            fullWidth
                            sx={{ mt: 2 }}
                            startIcon={<EventAvailable />}
                          >
                            Add to Calendar
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Completed Tab */}
          {activeTab === 1 && (
            <TableContainer>
              {completed.length === 0 ? (
                <Alert severity="info">No completed assessments yet</Alert>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Assessment</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {completed.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell>{assessment.title}</TableCell>
                        <TableCell>{format(new Date(assessment.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={assessment.percentage}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                              color={assessment.percentage >= 80 ? 'success' : assessment.percentage >= 60 ? 'primary' : 'error'}
                            />
                            <Typography variant="body2">{assessment.score}/{assessment.totalMarks}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assessment.status.toUpperCase()}
                            size="small"
                            color={assessment.status === 'passed' ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="small">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          )}

          {/* Performance Trends Tab */}
          {activeTab === 2 && (
            <Box>
              {performanceData.length === 0 ? (
                <Alert severity="info">Not enough data to show performance trends</Alert>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Score Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        name="Your Score"
                      />
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke={theme.palette.grey[400]}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Class Average"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AssessmentsPage;
