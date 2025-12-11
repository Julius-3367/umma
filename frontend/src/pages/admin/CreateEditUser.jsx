import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { adminService } from '../../api/admin';

const CreateEditUser = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  // Map role names to roleIds
  const getRoleId = (roleName) => {
    const roleMap = {
      ADMIN: 1,
      Admin: 1,
      CANDIDATE: 2,
      Candidate: 2,
      TRAINER: 3,
      Trainer: 3,
      RECRUITER: 4,
      Recruiter: 4,
      BROKER: 5,
      Broker: 5,
      EMPLOYER: 6,
      Employer: 6,
    };
    return roleMap[roleName] || 2; // Default to CANDIDATE
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: location.state?.defaultRole ? getRoleId(location.state.defaultRole) : 2,
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (isEdit) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await adminService.getUserById(id);
      const u = resp.data.data;
      setForm({
        email: u.email || '',
        password: '',
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        phone: u.phone || '',
        roleId: u.role?.id || u.roleId || 2,
        status: u.status || 'ACTIVE',
      });
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(err.response?.data?.message || 'Failed to load user');
      enqueueSnackbar('Failed to load user', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!form.email || !form.firstName || !form.lastName) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'warning' });
      return;
    }

    if (!isEdit && !form.password) {
      enqueueSnackbar('Password is required for new users', { variant: 'warning' });
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const payload = {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        roleId: parseInt(form.roleId),
        status: form.status,
      };

      // Add password only if provided
      if (form.password) {
        payload.password = form.password;
      }

      if (isEdit) {
        await adminService.updateUser(id, payload);
        enqueueSnackbar('User updated successfully', { variant: 'success' });
      } else {
        await adminService.createUser(payload);
        enqueueSnackbar('User created successfully', { variant: 'success' });
      }

      navigate('/admin/users');
    } catch (err) {
      console.error('Save error:', err);
      const msg = err.response?.data?.message || 'Failed to save user';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin/users')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight="bold">
          {isEdit ? 'Edit User' : 'Create New User'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 800 }} component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            fullWidth
            disabled={isEdit} // Don't allow email changes
          />
          
          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            helperText={isEdit ? 'Leave blank to keep current password' : 'Required for new users'}
            required={!isEdit}
            fullWidth
          />
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="First Name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              fullWidth
            />
          </Stack>
          
          <TextField
            label="Phone Number"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              name="roleId"
              value={form.roleId}
              onChange={(e) => setForm((s) => ({ ...s, roleId: e.target.value }))}
              required
            >
              <MenuItem value={1}>Admin</MenuItem>
              <MenuItem value={2}>Candidate</MenuItem>
              <MenuItem value={3}>Trainer</MenuItem>
              <MenuItem value={4}>Recruiter</MenuItem>
              <MenuItem value={5}>Broker</MenuItem>
              <MenuItem value={6}>Employer</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
              required
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => navigate('/admin/users')} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default CreateEditUser;
