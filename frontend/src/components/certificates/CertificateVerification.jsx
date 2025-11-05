import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import {
  VerifiedUser,
  Search,
  CheckCircle,
  Cancel,
  Warning,
} from '@mui/icons-material';
import { adminService } from '../../api/admin';
import { format } from 'date-fns';

const CertificateVerification = () => {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = async () => {
    if (!certificateNumber.trim()) {
      setError('Please enter a certificate number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setVerificationResult(null);

      const response = await adminService.verifyCertificate(certificateNumber);
      const result = response.data?.data || response.data;
      setVerificationResult(result);
    } catch (err) {
      console.error('Certificate verification failed:', err);
      setError(err.response?.data?.message || 'Certificate not found or invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ISSUED':
        return 'success';
      case 'REVOKED':
        return 'error';
      case 'EXPIRED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ISSUED':
        return <CheckCircle />;
      case 'REVOKED':
        return <Cancel />;
      case 'EXPIRED':
        return <Warning />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Certificate Verification
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter a certificate number to verify its authenticity and status
      </Typography>

      {/* Search Box */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            label="Certificate Number"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., CERT-2024-001"
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            variant="contained"
            onClick={handleVerify}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <Card>
          <CardContent>
            <Stack spacing={3}>
              {/* Header */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                  <VerifiedUser sx={{ fontSize: 40, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      Certificate Verified
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {verificationResult.certificateNumber}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={verificationResult.status}
                  color={getStatusColor(verificationResult.status)}
                  icon={getStatusIcon(verificationResult.status)}
                  sx={{ fontSize: '1rem', p: 2 }}
                />
              </Stack>

              <Divider />

              {/* Certificate Details */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Candidate Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {verificationResult.candidateName}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {verificationResult.candidateEmail}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Course
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {verificationResult.courseName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {verificationResult.courseCode}
                  </Typography>
                </Grid>

                {verificationResult.grade && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Grade
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {verificationResult.grade}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Issue Date
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(verificationResult.issueDate), 'MMMM dd, yyyy')}
                  </Typography>
                </Grid>

                {verificationResult.expiryDate && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Expiry Date
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(verificationResult.expiryDate), 'MMMM dd, yyyy')}
                    </Typography>
                  </Grid>
                )}

                {verificationResult.issuedByName && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Issued By
                    </Typography>
                    <Typography variant="body1">
                      {verificationResult.issuedByName}
                    </Typography>
                  </Grid>
                )}

                {verificationResult.remarks && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Remarks
                    </Typography>
                    <Typography variant="body1">
                      {verificationResult.remarks}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Status-specific Messages */}
              {verificationResult.status === 'REVOKED' && (
                <Alert severity="error">
                  <Typography variant="body2" fontWeight="medium">
                    This certificate has been revoked and is no longer valid.
                  </Typography>
                </Alert>
              )}

              {verificationResult.status === 'EXPIRED' && (
                <Alert severity="warning">
                  <Typography variant="body2" fontWeight="medium">
                    This certificate has expired.
                  </Typography>
                </Alert>
              )}

              {verificationResult.status === 'ISSUED' && (
                <Alert severity="success">
                  <Typography variant="body2" fontWeight="medium">
                    This is a valid and authentic certificate.
                  </Typography>
                </Alert>
              )}

              {/* Digital Signature */}
              {verificationResult.digitalSignature && (
                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Digital Signature
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                    }}
                  >
                    {verificationResult.digitalSignature}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CertificateVerification;
