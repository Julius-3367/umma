import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format as formatDate } from 'date-fns';
import adminService from '../../api/admin';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [selectedReport, setSelectedReport] = useState('');
  const [format, setFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);
  const [generatingJobId, setGeneratingJobId] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [recentReports, setRecentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Load recent reports on mount
  useEffect(() => {
    fetchRecentReports();
  }, []);

  // Poll for job status if generating
  useEffect(() => {
    if (!generatingJobId) return;

    const interval = setInterval(async () => {
      try {
        const response = await adminService.getReportStatus(generatingJobId);
        const job = response.data;

        if (job.status === 'completed') {
          setSuccess(`Report generated successfully! ${job.recordCount || 0} records`);
          setGenerating(false);
          setGeneratingJobId(null);
          fetchRecentReports();
        } else if (job.status === 'failed') {
          setError(`Report generation failed: ${job.error || 'Unknown error'}`);
          setGenerating(false);
          setGeneratingJobId(null);
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [generatingJobId]);

  const fetchRecentReports = async () => {
    try {
      setLoadingReports(true);
      const response = await adminService.getReports();
      // Ensure we always have an array
      const reports = Array.isArray(response.data) ? response.data : (response.data?.reports || []);
      setRecentReports(reports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setRecentReports([]); // Set empty array on error
    } finally {
      setLoadingReports(false);
    }
  };

  const reportTypes = [
    {
      id: 'enrollments',
      title: 'Enrollment Statistics Report',
      description: 'Detailed enrollment data including status, dates, and candidate information',
      icon: <PeopleIcon fontSize="large" color="primary" />,
      category: 'Enrollments',
    },
    {
      id: 'courses',
      title: 'Course Performance Report',
      description: 'Course statistics, cohorts, enrollments, and completion rates',
      icon: <SchoolIcon fontSize="large" color="primary" />,
      category: 'Courses',
    },
    {
      id: 'candidates',
      title: 'Candidate Progress Report',
      description: 'Candidate profiles, enrollments, completion status, and vetting records',
      icon: <PeopleIcon fontSize="large" color="secondary" />,
      category: 'Candidates',
    },
    {
      id: 'cohorts',
      title: 'Cohort Summary Report',
      description: 'Cohort details, capacity, enrollment numbers, and session counts',
      icon: <SchoolIcon fontSize="large" color="secondary" />,
      category: 'Cohorts',
    },
    {
      id: 'attendance',
      title: 'Attendance Records Report',
      description: 'Detailed attendance data with check-in/out times and status',
      icon: <TrendingUpIcon fontSize="large" color="primary" />,
      category: 'Attendance',
    },
    {
      id: 'vetting',
      title: 'Vetting Process Report',
      description: 'Vetting applications, document status, and verification progress',
      icon: <BusinessIcon fontSize="large" color="primary" />,
      category: 'Vetting',
    },
    {
      id: 'trainers',
      title: 'Trainer Performance Report',
      description: 'Trainer workload, cohorts led, student counts, and session statistics',
      icon: <AssessmentIcon fontSize="large" color="primary" />,
      category: 'Trainers',
    },
    {
      id: 'certificates',
      title: 'Certificate Issuance Report',
      description: 'Certificates issued, candidate details, and revocation status',
      icon: <AssessmentIcon fontSize="large" color="secondary" />,
      category: 'Certificates',
    },
    {
      id: 'financial',
      title: 'Financial Overview Report',
      description: 'Payment records, revenue tracking, and financial transactions',
      icon: <TrendingUpIcon fontSize="large" color="secondary" />,
      category: 'Finance',
    },
  ];

  const handleGenerateReport = async (reportId) => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');
      
      const response = await adminService.generateReport({
        type: reportId,
        format: format,
        startDate: dateRange.startDate ? formatDate(new Date(dateRange.startDate), 'yyyy-MM-dd') : null,
        endDate: dateRange.endDate ? formatDate(new Date(dateRange.endDate), 'yyyy-MM-dd') : null,
      });
      
      if (response.data.jobId) {
        setGeneratingJobId(response.data.jobId);
        setSuccess('Report generation started. Please wait...');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.response?.data?.message || 'Failed to generate report');
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (jobId, downloadUrl) => {
    try {
      window.open(`http://localhost:5000${downloadUrl}`, '_blank');
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'processing':
        return <CircularProgress size={20} />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h4" gutterBottom>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate comprehensive reports for analysis and compliance
          </Typography>
        </Box>

        {/* Date Range & Format Selection */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Report Configuration
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={(newValue) =>
                  setDateRange({ ...dateRange, startDate: newValue })
                }
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={(newValue) =>
                  setDateRange({ ...dateRange, endDate: newValue })
                }
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={format}
                  label="Export Format"
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <MenuItem value="pdf">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PdfIcon fontSize="small" />
                      <span>PDF Document</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="csv">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ExcelIcon fontSize="small" />
                      <span>CSV File</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="json">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ExcelIcon fontSize="small" />
                      <span>JSON File</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Report Cards */}
        <Grid container spacing={3}>
          {reportTypes.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    {report.icon}
                    <Chip label={report.category} size="small" color="primary" variant="outlined" />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {report.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {report.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<DownloadIcon />}
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={generating}
                  >
                    {generating ? 'Generating...' : 'Generate Report'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Reports Section */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Recent Reports
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchRecentReports}
              disabled={loadingReports}
            >
              Refresh
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {loadingReports ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : recentReports.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" py={4}>
              No recent reports. Generated reports will appear here.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Records</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentReports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Chip
                          label={report.type}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{report.format.toUpperCase()}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getStatusIcon(report.status)}
                          <span>{report.status}</span>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {report.meta?.recordCount || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(report.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {report.status === 'completed' && report.downloadUrl && (
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadReport(report.id, report.downloadUrl)}
                          >
                            Download
                          </Button>
                        )}
                        {report.status === 'failed' && (
                          <Chip label={report.error || 'Failed'} size="small" color="error" />
                        )}
                        {report.status === 'processing' && (
                          <LinearProgress sx={{ width: 100 }} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;
