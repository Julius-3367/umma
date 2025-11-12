import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, Button, Chip, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import adminService from '../../api/admin';

const CompanyDetails = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCompanyById(companyId);
      setCompany(res.data.data || res.data);
    } catch (err) {
      console.error('Error loading company', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (!company) return <Box sx={{ p: 3 }}>Company not found</Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 900 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5">{company.name}</Typography>
            <Typography variant="body2" color="text.secondary">{company.industry || '—'}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/admin/companies')}>Back</Button>
            <Button variant="contained" onClick={() => navigate(`/admin/companies/${company.id}/edit`)}>Edit</Button>
          </Stack>
        </Stack>

        <Stack spacing={2}>
          <Typography><strong>Contact Person:</strong> {company.contactPerson || '—'}</Typography>
          <Typography><strong>Email:</strong> {company.email || '—'}</Typography>
          <Typography><strong>Phone:</strong> {company.phone || '—'}</Typography>
          <Typography><strong>Country:</strong> {company.country || '—'}</Typography>
          <Typography><strong>Address:</strong> {company.address || '—'}</Typography>
          <Typography><strong>Website:</strong> {company.website || '—'}</Typography>
          <Typography><strong>Status:</strong> <Chip label={company.status || 'ACTIVE'} size="small" /></Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default CompanyDetails;
