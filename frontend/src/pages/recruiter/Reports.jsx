import { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Stack,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  DocumentArrowDownIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { adminAPI } from '../../api';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function RecruiterReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('pipeline');
  const [dateRange, setDateRange] = useState('30');
  const [reportData, setReportData] = useState(null);

  const generateReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with actual API calls
      const mockData = {
        pipeline: {
          summary: {
            totalCandidates: 145,
            activeCandidates: 98,
            placedCandidates: 32,
            cancelledCandidates: 15,
          },
          statusBreakdown: [
            { status: 'Applied', count: 25 },
            { status: 'Under Review', count: 35 },
            { status: 'Enrolled', count: 38 },
            { status: 'Waitlisted', count: 12 },
            { status: 'Placed', count: 32 },
            { status: 'Cancelled', count: 15 },
          ],
          trendData: [
            { month: 'Jan', candidates: 12 },
            { month: 'Feb', candidates: 19 },
            { month: 'Mar', candidates: 15 },
            { month: 'Apr', candidates: 22 },
            { month: 'May', candidates: 18 },
            { month: 'Jun', candidates: 25 },
          ],
        },
        placements: {
          summary: {
            totalPlacements: 87,
            activePlacements: 45,
            completedPlacements: 32,
            cancelledPlacements: 10,
          },
          byCountry: [
            { country: 'UAE', count: 28 },
            { country: 'Saudi Arabia', count: 22 },
            { country: 'Qatar', count: 15 },
            { country: 'Kuwait', count: 12 },
            { country: 'Oman', count: 10 },
          ],
          byIndustry: [
            { industry: 'Healthcare', count: 32 },
            { industry: 'Hospitality', count: 25 },
            { industry: 'Construction', count: 18 },
            { industry: 'IT', count: 12 },
          ],
        },
        companies: {
          totalCompanies: 45,
          activeCompanies: 38,
          topHiring: [
            { name: 'Al-Futtaim Group', placements: 15 },
            { name: 'Emaar Properties', placements: 12 },
            { name: 'Majid Al Futtaim', placements: 10 },
            { name: 'Dubai Municipality', placements: 8 },
            { name: 'ADNOC', placements: 7 },
          ],
        },
      };

      setReportData(mockData);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange]);

  const handleExport = (format) => {
    // Implement export functionality
    console.log(`Exporting as ${format}...`);
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Reports & Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generate comprehensive reports on candidates, placements, and company performance
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Report Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Report Type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="pipeline">Candidate Pipeline</MenuItem>
                <MenuItem value="placements">Placement Metrics</MenuItem>
                <MenuItem value="companies">Company Performance</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Date Range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="7">Last 7 Days</MenuItem>
                <MenuItem value="30">Last 30 Days</MenuItem>
                <MenuItem value="90">Last 90 Days</MenuItem>
                <MenuItem value="365">Last Year</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ChartBarIcon style={{ width: 20, height: 20 }} />}
                  onClick={generateReport}
                  disabled={loading}
                >
                  Generate Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DocumentArrowDownIcon style={{ width: 20, height: 20 }} />}
                  onClick={() => handleExport('csv')}
                  disabled={!reportData || loading}
                >
                  Export
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : reportData ? (
        <>
          {reportType === 'pipeline' && (
            <>
              {/* Summary Cards */}
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Candidates
                      </Typography>
                      <Typography variant="h4" fontWeight={600}>
                        {reportData.pipeline.summary.totalCandidates}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Active Pipeline
                      </Typography>
                      <Typography variant="h4" fontWeight={600} color="primary">
                        {reportData.pipeline.summary.activeCandidates}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Placed
                      </Typography>
                      <Typography variant="h4" fontWeight={600} color="success.main">
                        {reportData.pipeline.summary.placedCandidates}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Cancelled
                      </Typography>
                      <Typography variant="h4" fontWeight={600} color="error.main">
                        {reportData.pipeline.summary.cancelledCandidates}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Charts */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Pipeline Status Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={reportData.pipeline.statusBreakdown}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {reportData.pipeline.statusBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Candidate Trend (Last 6 Months)
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.pipeline.trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="candidates"
                            stroke="#6366f1"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}

          {reportType === 'placements' && (
            <>
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Placements
                      </Typography>
                      <Typography variant="h4" fontWeight={600}>
                        {reportData.placements.summary.totalPlacements}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Active
                      </Typography>
                      <Typography variant="h4" fontWeight={600} color="primary">
                        {reportData.placements.summary.activePlacements}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Completed
                      </Typography>
                      <Typography variant="h4" fontWeight={600} color="success.main">
                        {reportData.placements.summary.completedPlacements}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Cancelled
                      </Typography>
                      <Typography variant="h4" fontWeight={600} color="error.main">
                        {reportData.placements.summary.cancelledPlacements}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Placements by Country
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.placements.byCountry}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="country" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Placements by Industry
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.placements.byIndustry}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="industry" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}

          {reportType === 'companies' && (
            <>
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Companies
                      </Typography>
                      <Typography variant="h4" fontWeight={600}>
                        {reportData.companies.totalCompanies}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Active Partners
                      </Typography>
                      <Typography variant="h4" fontWeight={600} color="primary">
                        {reportData.companies.activeCompanies}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Hiring Companies
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Rank</TableCell>
                          <TableCell>Company Name</TableCell>
                          <TableCell align="right">Placements</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.companies.topHiring.map((company, index) => (
                          <TableRow key={company.name}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{company.name}</TableCell>
                            <TableCell align="right">{company.placements}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </>
          )}
        </>
      ) : (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <ChartBarIcon style={{ width: 64, height: 64, margin: '0 auto', opacity: 0.3 }} />
          <Typography variant="h6" color="text.secondary" mt={2}>
            Select report parameters and click Generate Report
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
