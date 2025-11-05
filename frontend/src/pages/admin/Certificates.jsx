import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  QrCode as QrCodeIcon,
  Verified as VerifiedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { adminService } from '../../api/admin';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`certificate-tabpanel-${index}`}
      aria-labelledby={`certificate-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Certificates = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [certificates, setCertificates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'template', 'generate', 'verify'
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [statistics, setStatistics] = useState({
    total: 0,
    issued: 0,
    pending: 0,
    revoked: 0,
  });

  // Template Form State
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    design: {
      layout: 'classic',
      orientation: 'landscape',
      backgroundColor: '#ffffff',
      primaryColor: '#3B82F6',
      accentColor: '#78BE21',
      fontFamily: 'Arial',
      fontSize: 14,
      includeQRCode: true,
      includeSignature: true,
      includeLogo: true,
    },
    content: {
      title: 'Certificate of Completion',
      subtitle: 'This is to certify that',
      body: 'has successfully completed',
      footer: 'Issued by United Manpower Service Limited',
    },
  });

  // Generate Certificate Form State
  const [generateForm, setGenerateForm] = useState({
    templateId: '',
    candidateId: '',
    courseId: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    grade: '',
    remarks: '',
    bulkGeneration: false,
    candidateIds: [],
  });

  // Verify Certificate Form State
  const [verifyForm, setVerifyForm] = useState({
    certificateNumber: '',
    qrCode: '',
  });

  useEffect(() => {
    fetchCertificates();
    fetchTemplates();
    fetchStatistics();
  }, [filterStatus]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await adminService.getCertificates({
        status: filterStatus !== 'all' ? filterStatus : undefined,
      });
      setCertificates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      showSnackbar('Error fetching certificates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await adminService.getCertificateTemplates();
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await adminService.getCertificateStatistics();
      setStatistics(response.data.data || statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (type, certificate = null) => {
    setDialogType(type);
    setSelectedCertificate(certificate);
    if (certificate && type === 'edit') {
      setTemplateForm(certificate);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCertificate(null);
    resetForms();
  };

  const resetForms = () => {
    setTemplateForm({
      name: '',
      description: '',
      design: {
        layout: 'classic',
        orientation: 'landscape',
        backgroundColor: '#ffffff',
        primaryColor: '#3B82F6',
        accentColor: '#78BE21',
        fontFamily: 'Arial',
        fontSize: 14,
        includeQRCode: true,
        includeSignature: true,
        includeLogo: true,
      },
      content: {
        title: 'Certificate of Completion',
        subtitle: 'This is to certify that',
        body: 'has successfully completed',
        footer: 'Issued by United Manpower Service Limited',
      },
    });
    setGenerateForm({
      templateId: '',
      candidateId: '',
      courseId: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      grade: '',
      remarks: '',
      bulkGeneration: false,
      candidateIds: [],
    });
    setVerifyForm({
      certificateNumber: '',
      qrCode: '',
    });
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    try {
      if (selectedCertificate) {
        await adminService.updateCertificateTemplate(selectedCertificate.id, templateForm);
        showSnackbar('Template updated successfully', 'success');
      } else {
        await adminService.createCertificateTemplate(templateForm);
        showSnackbar('Template created successfully', 'success');
      }
      fetchTemplates();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving template:', error);
      showSnackbar('Error saving template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    setLoading(true);
    try {
      if (generateForm.bulkGeneration) {
        await adminService.bulkGenerateCertificates({
          templateId: generateForm.templateId,
          courseId: generateForm.courseId,
          candidateIds: generateForm.candidateIds,
          issueDate: generateForm.issueDate,
        });
        showSnackbar('Bulk certificates generated successfully', 'success');
      } else {
        await adminService.generateCertificate(generateForm);
        showSnackbar('Certificate generated successfully', 'success');
      }
      fetchCertificates();
      fetchStatistics();
      handleCloseDialog();
    } catch (error) {
      console.error('Error generating certificate:', error);
      showSnackbar('Error generating certificate', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCertificate = async () => {
    setLoading(true);
    try {
      const response = await adminService.verifyCertificate({
        certificateNumber: verifyForm.certificateNumber,
      });
      if (response.data.success) {
        showSnackbar('Certificate verified successfully', 'success');
        setSelectedCertificate(response.data.data);
      } else {
        showSnackbar('Certificate not found or invalid', 'error');
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      showSnackbar('Error verifying certificate', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (certificateId) => {
    try {
      const response = await adminService.downloadCertificate(certificateId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSnackbar('Certificate downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      showSnackbar('Error downloading certificate', 'error');
    }
  };

  const handleRevokeCertificate = async (certificateId) => {
    if (!window.confirm('Are you sure you want to revoke this certificate?')) return;
    
    setLoading(true);
    try {
      await adminService.revokeCertificate(certificateId);
      showSnackbar('Certificate revoked successfully', 'success');
      fetchCertificates();
      fetchStatistics();
    } catch (error) {
      console.error('Error revoking certificate:', error);
      showSnackbar('Error revoking certificate', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReissueCertificate = async (certificateId) => {
    setLoading(true);
    try {
      await adminService.reissueCertificate(certificateId);
      showSnackbar('Certificate reissued successfully', 'success');
      fetchCertificates();
      fetchStatistics();
    } catch (error) {
      console.error('Error reissuing certificate:', error);
      showSnackbar('Error reissuing certificate', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCertificate = async (certificateId) => {
    setLoading(true);
    try {
      await adminService.sendCertificate(certificateId);
      showSnackbar('Certificate sent successfully', 'success');
    } catch (error) {
      console.error('Error sending certificate:', error);
      showSnackbar('Error sending certificate', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    const colors = {
      issued: 'success',
      pending: 'warning',
      revoked: 'error',
      expired: 'default',
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      issued: <CheckCircleIcon fontSize="small" />,
      pending: <PendingIcon fontSize="small" />,
      revoked: <CancelIcon fontSize="small" />,
    };
    return icons[status?.toLowerCase()] || <PendingIcon fontSize="small" />;
  };

  const filteredCertificates = certificates.filter((cert) =>
    cert.certificateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Certificate Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage certificate templates, generate, verify, and track certificates
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Certificates
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {statistics.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Issued
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {statistics.issued}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {statistics.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Revoked
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {statistics.revoked}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Certificates" />
            <Tab label="Templates" />
            <Tab label="Generate" />
            <Tab label="Verify" />
          </Tabs>
        </Paper>

        {/* Tab 1: Certificates List */}
        <TabPanel value={activeTab} index={0}>
          <Paper sx={{ p: 3 }}>
            {/* Search and Filter */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ flexGrow: 1, minWidth: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="issued">Issued</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="revoked">Revoked</MenuItem>
              </TextField>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('generate')}
              >
                Generate Certificate
              </Button>
            </Box>

            {/* Certificates Table */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Certificate #</TableCell>
                        <TableCell>Candidate</TableCell>
                        <TableCell>Course</TableCell>
                        <TableCell>Issue Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCertificates
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((cert) => (
                          <TableRow key={cert.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {cert.certificateNumber}
                                <Tooltip title="Copy certificate number">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      navigator.clipboard.writeText(cert.certificateNumber);
                                      showSnackbar('Certificate number copied', 'success');
                                    }}
                                  >
                                    <CopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                            <TableCell>{cert.candidateName}</TableCell>
                            <TableCell>{cert.courseName}</TableCell>
                            <TableCell>
                              {new Date(cert.issueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={cert.status}
                                color={getStatusColor(cert.status)}
                                size="small"
                                icon={getStatusIcon(cert.status)}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Download">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDownloadCertificate(cert.id)}
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Send via Email">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleSendCertificate(cert.id)}
                                  >
                                    <SendIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="View QR Code">
                                  <IconButton size="small">
                                    <QrCodeIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="More actions">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      setAnchorEl(e.currentTarget);
                                      setSelectedCertificate(cert);
                                    }}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredCertificates.length}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </>
            )}
          </Paper>
        </TabPanel>

        {/* Tab 2: Templates */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Certificate Templates</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('template')}
            >
              Create Template
            </Button>
          </Box>
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog('template', template)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        startIcon={<PrintIcon />}
                        onClick={() => handleOpenDialog('generate', template)}
                      >
                        Use
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Tab 3: Generate */}
        <TabPanel value={activeTab} index={2}>
          <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Generate Certificate
            </Typography>
            <Box component="form" sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Template"
                    value={generateForm.templateId}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, templateId: e.target.value })
                    }
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Course"
                    value={generateForm.courseId}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, courseId: e.target.value })
                    }
                  >
                    <MenuItem value="1">Web Development Bootcamp</MenuItem>
                    <MenuItem value="2">Digital Marketing Course</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Candidate"
                    placeholder="Select candidate or enter multiple for bulk generation"
                    value={generateForm.candidateId}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, candidateId: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Issue Date"
                    value={generateForm.issueDate}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, issueDate: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Expiry Date (Optional)"
                    value={generateForm.expiryDate}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, expiryDate: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Grade/Score (Optional)"
                    value={generateForm.grade}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, grade: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Remarks (Optional)"
                    value={generateForm.remarks}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, remarks: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleGenerateCertificate}
                    disabled={loading || !generateForm.templateId || !generateForm.courseId}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Generate Certificate'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </TabPanel>

        {/* Tab 4: Verify */}
        <TabPanel value={activeTab} index={3}>
          <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <VerifiedIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Verify Certificate
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter certificate number or scan QR code to verify authenticity
              </Typography>
            </Box>
            <Box component="form" sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Certificate Number"
                    placeholder="e.g., CERT-2024-001234"
                    value={verifyForm.certificateNumber}
                    onChange={(e) =>
                      setVerifyForm({ ...verifyForm, certificateNumber: e.target.value })
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton edge="end">
                            <QrCodeIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleVerifyCertificate}
                    disabled={loading || !verifyForm.certificateNumber}
                    startIcon={<VerifiedIcon />}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Verify Certificate'}
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Verification Result */}
            {selectedCertificate && dialogType === '' && (
              <Box sx={{ mt: 4, p: 3, bgcolor: 'success.light', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Certificate Verified ✓
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Candidate:
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedCertificate.candidateName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Course:
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedCertificate.courseName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Issue Date:
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {new Date(selectedCertificate.issueDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status:
                    </Typography>
                    <Chip
                      label={selectedCertificate.status}
                      color="success"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </TabPanel>

        {/* Template Dialog */}
        <Dialog open={openDialog && dialogType === 'template'} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedCertificate ? 'Edit Template' : 'Create Certificate Template'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Template Name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description"
                    value={templateForm.description}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, description: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Design Settings
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Layout"
                    value={templateForm.design.layout}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        design: { ...templateForm.design, layout: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="classic">Classic</MenuItem>
                    <MenuItem value="modern">Modern</MenuItem>
                    <MenuItem value="elegant">Elegant</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Orientation"
                    value={templateForm.design.orientation}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        design: { ...templateForm.design, orientation: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="landscape">Landscape</MenuItem>
                    <MenuItem value="portrait">Portrait</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="color"
                    label="Primary Color"
                    value={templateForm.design.primaryColor}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        design: { ...templateForm.design, primaryColor: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="color"
                    label="Accent Color"
                    value={templateForm.design.accentColor}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        design: { ...templateForm.design, accentColor: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="color"
                    label="Background"
                    value={templateForm.design.backgroundColor}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        design: { ...templateForm.design, backgroundColor: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Content
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={templateForm.content.title}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        content: { ...templateForm.content, title: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subtitle"
                    value={templateForm.content.subtitle}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        content: { ...templateForm.content, subtitle: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Body"
                    value={templateForm.content.body}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        content: { ...templateForm.content, body: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Footer"
                    value={templateForm.content.footer}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        content: { ...templateForm.content, footer: e.target.value },
                      })
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveTemplate}
              disabled={loading || !templateForm.name}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Template'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem
            onClick={() => {
              handleReissueCertificate(selectedCertificate?.id);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <RefreshIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reissue</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleRevokeCertificate(selectedCertificate?.id);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <CancelIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Revoke</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleDownloadCertificate(selectedCertificate?.id);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <PrintIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Print</ListItemText>
          </MenuItem>
        </Menu>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Certificates;
