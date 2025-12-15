import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as VerifiedIcon,
  Schedule as PendingIcon,
  Cancel as CancelledIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import candidateService from '../../api/candidate';

const Certificates = () => {
  const { t } = useTranslation();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await candidateService.getCertificates();
      setCertificates(response || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      enqueueSnackbar('Failed to load certificates', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate) => {
    try {
      // In a real implementation, this would call the download endpoint
      enqueueSnackbar('Downloading certificate...', { variant: 'info' });

      // Simulate download
      const link = document.createElement('a');
      link.href = certificate.fileUrl || '#';
      link.download = `Certificate_${certificate.certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      enqueueSnackbar('Certificate downloaded successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      enqueueSnackbar('Failed to download certificate', { variant: 'error' });
    }
  };

  const handlePrint = (certificate) => {
    setSelectedCertificate(certificate);
    setPreviewOpen(true);
    // In real implementation, trigger print dialog
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const getStatusColor = (status) => {
    const colors = {
      ISSUED: 'success',
      PENDING: 'warning',
      REVOKED: 'error',
      EXPIRED: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      ISSUED: <VerifiedIcon />,
      PENDING: <PendingIcon />,
      REVOKED: <CancelledIcon />,
      EXPIRED: <CancelledIcon />,
    };
    return icons[status];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          My Certificates
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and download your earned certificates
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Certificates
              </Typography>
              <Typography variant="h4">{certificates.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Issued
              </Typography>
              <Typography variant="h4" color="success.main">
                {certificates.filter(c => c.status === 'ISSUED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {certificates.filter(c => c.status === 'PENDING').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Latest Issue
              </Typography>
              <Typography variant="h6">
                {certificates.length > 0
                  ? format(new Date(certificates[0].issueDate), 'MMM yyyy')
                  : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <TrophyIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Certificates Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete your courses to earn certificates
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {certificates.map((certificate) => (
            <Grid item xs={12} md={6} lg={4} key={certificate.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                {/* Certificate Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 16,
                    zIndex: 1,
                  }}
                >
                  <TrophyIcon
                    sx={{
                      fontSize: 48,
                      color: certificate.status === 'ISSUED' ? 'warning.main' : 'action.disabled',
                    }}
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                  {/* Status Chip */}
                  <Box display="flex" justifyContent="flex-start" mb={2}>
                    <Chip
                      label={certificate.status}
                      color={getStatusColor(certificate.status)}
                      size="small"
                      icon={getStatusIcon(certificate.status)}
                    />
                  </Box>

                  {/* Course Title */}
                  <Typography variant="h6" gutterBottom>
                    {certificate.enrollment?.course?.title || 'Certificate'}
                  </Typography>

                  {/* Certificate Number */}
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Certificate No: <strong>{certificate.certificateNumber}</strong>
                  </Typography>

                  {/* Template */}
                  {certificate.template && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Template: {certificate.template.name}
                    </Typography>
                  )}

                  {/* Issue Date */}
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Issued On
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(certificate.issueDate), 'MMMM dd, yyyy')}
                    </Typography>
                  </Box>

                  {/* Course Code */}
                  {certificate.enrollment?.course?.code && (
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Course Code
                      </Typography>
                      <Typography variant="body2">
                        {certificate.enrollment.course.code}
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => {
                      setSelectedCertificate(certificate);
                      setPreviewOpen(true);
                    }}
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(certificate)}
                    disabled={certificate.status !== 'ISSUED'}
                  >
                    Download
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handlePrint(certificate)}
                    disabled={certificate.status !== 'ISSUED'}
                  >
                    <PrintIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Certificate Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Certificate Preview
        </DialogTitle>
        <DialogContent>
          {selectedCertificate && (
            <Box textAlign="center" py={4}>
              <TrophyIcon sx={{ fontSize: 80, color: 'warning.main', mb: 3 }} />
              <Typography variant="h4" gutterBottom>
                Certificate of Completion
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {selectedCertificate.enrollment?.course?.title}
              </Typography>
              <Box my={4}>
                <Typography variant="body1" paragraph>
                  This certifies that the holder has successfully completed
                </Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  {selectedCertificate.enrollment?.course?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Course Code: {selectedCertificate.enrollment?.course?.code}
                </Typography>
              </Box>
              <Box mt={4}>
                <Typography variant="body2" color="text.secondary">
                  Certificate Number
                </Typography>
                <Typography variant="h6">
                  {selectedCertificate.certificateNumber}
                </Typography>
              </Box>
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Issue Date
                </Typography>
                <Typography variant="body1">
                  {format(new Date(selectedCertificate.issueDate), 'MMMM dd, yyyy')}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button
            onClick={() => selectedCertificate && handleDownload(selectedCertificate)}
            variant="contained"
            startIcon={<DownloadIcon />}
          >
            Download
          </Button>
          <Button
            onClick={() => selectedCertificate && handlePrint(selectedCertificate)}
            variant="outlined"
            startIcon={<PrintIcon />}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Certificates;
