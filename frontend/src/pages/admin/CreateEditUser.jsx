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
} from '@mui/material';
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
      CANDIDATE: 2,
      TRAINER: 3,
      RECRUITER: 4,
      BROKER: 5,
      EMPLOYER: 6,
    };
    return roleMap[roleName] || 2; // Default to CANDIDATE
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: location.state?.defaultRole ? getRoleId(location.state.defaultRole) : 2,
  });

  useEffect(() => {
    if (isEdit) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const resp = await adminService.getUserById(id);
      const u = resp.data.data;
      setForm({
        email: u.email || '',
        password: '',
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        phone: u.phone || '',
        roleId: u.role?.id || 2,
      });
    } catch (err) {
      console.error('Failed to fetch user', err);
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
    try {
      setSaving(true);
      const payload = {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        roleId: form.roleId,
      };

      if (!isEdit && form.password) payload.password = form.password;
      if (isEdit && form.password) payload.password = form.password; // optional password change

      if (isEdit) {
        await adminService.updateUser(id, payload);
        enqueueSnackbar('User updated successfully', { variant: 'success' });
      } else {
        await adminService.createUser({ ...payload, password: form.password });
        enqueueSnackbar('User created successfully', { variant: 'success' });
      }

      navigate('/admin/users');
    } catch (err) {
      console.error('Save error', err);
      const msg = err.response?.data?.message || 'Failed to save user';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" gutterBottom>
          {isEdit ? 'Edit User' : 'Create New User'}
        </Typography>
        <Stack spacing={2}>
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} required />
          <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} helperText={isEdit ? 'Leave blank to keep current password' : ''} required={!isEdit} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="First name" name="firstName" value={form.firstName} onChange={handleChange} fullWidth />
            <TextField label="Last name" name="lastName" value={form.lastName} onChange={handleChange} fullWidth />
          </Stack>
          <TextField label="Phone number" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />

          <FormControl size="small">
            <InputLabel>Role</InputLabel>
            <Select label="Role" name="roleId" value={form.roleId} onChange={(e) => setForm((s) => ({ ...s, roleId: e.target.value }))}>
              <MenuItem value={1}>Admin</MenuItem>
              <MenuItem value={2}>Candidate</MenuItem>
              <MenuItem value={3}>Trainer</MenuItem>
              <MenuItem value={4}>Recruiter</MenuItem>
              <MenuItem value={5}>Broker</MenuItem>
              <MenuItem value={6}>Employer</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => navigate('/admin/users')}>Cancel</Button>
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
