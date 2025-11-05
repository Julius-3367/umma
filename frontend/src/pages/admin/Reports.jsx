import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [selectedReport, setSelectedReport] = useState('');
  const [format, setFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const reportTypes = [
    {
      id: 'users',
      title: 'User Analytics Report',
      description: 'Detailed analysis of user registrations, activity, and demographics',
      icon: <PeopleIcon fontSize="large" color="primary" />,
      category: 'Users',
    },
    {
      id: 'courses',
      title: 'Course Performance Report',
      description: 'Course enrollments, completion rates, and trainer performance',
      icon: <SchoolIcon fontSize="large" color="primary" />,
      category: 'Courses',
    },
    {
      id: 'enrollments',
      title: 'Enrollment Statistics',
      description: 'Enrollment trends, dropout rates, and success metrics',
      icon: <TrendingUpIcon fontSize="large" color="primary" />,
      category: 'Enrollments',
    },
    {
      id: 'companies',
      title: 'Company Partnership Report',
      description: 'Company partnerships, placements, and industry distribution',
      icon: <BusinessIcon fontSize="large" color="primary" />,
      category: 'Companies',
    },
    {
      id: 'certificates',
      title: 'Certificate Issuance Report',
      description: 'Certificates issued, pending approvals, and rejection reasons',
      icon: <AssessmentIcon fontSize="large" color="primary" />,
      category: 'Certificates',
    },
    {
      id: 'financial',
      title: 'Financial Overview',
      description: 'Revenue, payments, and financial transactions summary',
      icon: <TrendingUpIcon fontSize="large" color="primary" />,
      category: 'Finance',
    },
  ];

  const handleGenerateReport = async (reportId) => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');
      
      // TODO: Implement actual report generation API call
      // const response = await adminService.generateReport({
      //   reportType: reportId,
      //   format: format,
      //   startDate: dateRange.startDate,
      //   endDate: dateRange.endDate,
      // });
      
      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setSuccess(`Report "${reportTypes.find(r => r.id === reportId)?.title}" generated successfully!`);
      
      // Trigger download (simulated)
      console.log('Downloading report:', reportId, format);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
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
                  <MenuItem value="excel">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ExcelIcon fontSize="small" />
                      <span>Excel Spreadsheet</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="csv">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ExcelIcon fontSize="small" />
                      <span>CSV File</span>
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

        {/* Recent Reports Section (Future Enhancement) */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Reports
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary" align="center" py={4}>
            No recent reports. Generated reports will appear here.
          </Typography>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;
