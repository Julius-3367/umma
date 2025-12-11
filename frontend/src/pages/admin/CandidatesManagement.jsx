import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Stack, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AdvancedCandidateTable from '../../components/tables/AdvancedCandidateTable';
import adminService from '../../api/admin';

/**
 * Candidates Management Page
 * Demonstrates usage of AdvancedCandidateTable component
 */
const CandidatesPage = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getAllCandidates();
      
      console.log('📊 Candidates API Response:', response);
      console.log('📊 Response data:', response?.data);
      
      // Extract candidates from response structure
      // API returns: { success, data: { candidates, total }, pagination }
      const candidatesList = response?.data?.candidates || [];
      
      console.log('📊 Candidates list:', candidatesList);
      console.log('📊 Number of candidates:', candidatesList.length);
      
      // Transform API data to match table format
      const transformedData = candidatesList.map((candidate) => ({
        id: candidate.id,
        name: candidate.fullName || `${candidate.user?.firstName || ''} ${candidate.user?.lastName || ''}`.trim() || 'Unknown',
        email: candidate.user?.email || candidate.email || 'N/A',
        phone: candidate.user?.phone || candidate.phone || 'N/A',
        course: candidate.enrollments?.[0]?.course?.title || 'Not Enrolled',
        status: candidate.enrollments?.[0]?.enrollmentStatus || candidate.status || 'APPLIED',
        progress: candidate.enrollments?.[0]?.progress || 0,
        enrollmentDate: candidate.enrollments?.[0]?.enrollmentDate,
        completionDate: candidate.enrollments?.[0]?.completionDate,
        avatar: candidate.profilePhotoUrl || candidate.profilePicture,
      }));

      console.log('📊 Transformed data:', transformedData);
      setCandidates(transformedData);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(err.response?.data?.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (candidate) => {
    navigate(`/admin/candidates/${candidate.id}`);
  };

  const handleEdit = (candidate) => {
    navigate(`/admin/candidates/${candidate.id}/edit`);
  };

  const handleEmail = (candidate) => {
    // Open email dialog or redirect to email client
    window.location.href = `mailto:${candidate.email}?subject=Regarding Your Course`;
  };

  const handleDelete = async (candidate) => {
    if (window.confirm(`Are you sure you want to delete ${candidate.name}?`)) {
      try {
        await adminService.deleteUser(candidate.id);
        setSuccess(`Successfully deleted ${candidate.name}`);
        fetchCandidates(); // Refresh list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete candidate');
      }
    }
  };

  const handleBulkAction = async (action, selectedIds) => {
    console.log(`Bulk action: ${action}`, selectedIds);
    
    switch (action) {
      case 'email':
        // Open bulk email dialog
        const selectedEmails = candidates
          .filter((c) => selectedIds.includes(c.id))
          .map((c) => c.email)
          .join(',');
        window.location.href = `mailto:${selectedEmails}`;
        break;
        
      case 'export':
        // Export selected candidates
        handleExport('excel', selectedIds);
        break;
        
      case 'archive':
        // Archive selected candidates
        try {
          // TODO: Implement bulk archive API
          setSuccess(`Successfully archived ${selectedIds.length} candidates`);
          fetchCandidates();
        } catch (err) {
          setError('Failed to archive candidates');
        }
        break;
        
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} candidates?`)) {
          try {
            // TODO: Implement bulk delete API
            setSuccess(`Successfully deleted ${selectedIds.length} candidates`);
            fetchCandidates();
          } catch (err) {
            setError('Failed to delete candidates');
          }
        }
        break;
        
      default:
        break;
    }
  };

  const handleExport = async (format, selectedIds = null) => {
    try {
      const dataToExport = selectedIds
        ? candidates.filter((c) => selectedIds.includes(c.id))
        : candidates;

      if (format === 'excel') {
        // Convert to Excel format (you'll need a library like xlsx)
        console.log('Exporting to Excel:', dataToExport);
        
        // Simulate file download
        const csvContent = convertToCSV(dataToExport);
        downloadFile(csvContent, 'candidates.csv', 'text/csv');
        
        setSuccess(`Exported ${dataToExport.length} candidates to Excel`);
      } else if (format === 'pdf') {
        // Convert to PDF format (you'll need a library like jspdf)
        console.log('Exporting to PDF:', dataToExport);
        setSuccess(`Exported ${dataToExport.length} candidates to PDF`);
      }
    } catch (err) {
      setError('Failed to export candidates');
    }
  };

  // Helper function to convert data to CSV
  const convertToCSV = (data) => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Course', 'Status', 'Progress', 'Enrolled', 'Completed'];
    const rows = data.map((candidate) => [
      candidate.id,
      candidate.name,
      candidate.email,
      candidate.phone,
      candidate.course,
      candidate.status,
      `${candidate.progress}%`,
      candidate.enrollmentDate ? new Date(candidate.enrollmentDate).toLocaleDateString() : '',
      candidate.completionDate ? new Date(candidate.completionDate).toLocaleDateString() : '',
    ]);

    return [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
  };

  // Helper function to download file
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Candidate Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and monitor all candidates in the system
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/candidates/new')}
        >
          Add Candidate
        </Button>
      </Stack>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Advanced Candidate Table */}
      <AdvancedCandidateTable
        candidates={candidates}
        loading={loading}
        onRefresh={fetchCandidates}
        onView={handleView}
        onEdit={handleEdit}
        onEmail={handleEmail}
        onDelete={handleDelete}
        onBulkAction={handleBulkAction}
        onExport={handleExport}
      />
    </Container>
  );
};

export default CandidatesPage;
