import React, { useState, useEffect } from 'react';
import { Box, Paper, TextField, Button, Stack, MenuItem, Typography, Alert } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import adminService from '../../api/admin';

const industries = ['Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Finance', 'Other'];

const CompanyForm = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const isEdit = Boolean(companyId);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    industry: '',
    contactPerson: '',
    website: '',
    address: '',
    status: 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchCompany();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCompanyById(companyId);
      const payload = res.data.data || res.data;
      setForm({ ...form, ...payload });
    } catch (err) {
      console.error('Error loading company', err);
      setError(err.response?.data?.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      if (isEdit) {
        await adminService.updateCompany(companyId, form);
        navigate(`/admin/companies/${companyId}`);
      } else {
        const res = await adminService.createCompany(form);
        const newId = res.data.data?.id || res.data.id || res.data?.data?.id;
        if (newId) navigate(`/admin/companies/${newId}`);
        else navigate('/admin/companies');
      }
    } catch (err) {
      console.error('Save error', err);
      setError(err.response?.data?.message || 'Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 800 }}>
        <Typography variant="h5" mb={2}>{isEdit ? 'Edit Company' : 'Add Company'}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField label="Company name" name="name" value={form.name} onChange={handleChange} required />
            <TextField label="Contact person" name="contactPerson" value={form.contactPerson} onChange={handleChange} />
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} />
            <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} />
            <TextField label="Country" name="country" value={form.country} onChange={handleChange} />
            <TextField select label="Industry" name="industry" value={form.industry} onChange={handleChange}>
              <MenuItem value="">Select industry</MenuItem>
              {industries.map((i) => (<MenuItem key={i} value={i}>{i}</MenuItem>))}
            </TextField>
            <TextField label="Website" name="website" value={form.website} onChange={handleChange} />
            <TextField label="Address" name="address" value={form.address} onChange={handleChange} multiline rows={2} />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => navigate('/admin/companies')}>Cancel</Button>
              <Button variant="contained" type="submit" disabled={loading}>{isEdit ? 'Update' : 'Create'}</Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default CompanyForm;
