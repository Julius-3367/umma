import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { adminAPI } from '../../api';

export default function RecruiterCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCompany, setMenuCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    location: '',
    website: '',
    contactPerson: '',
    email: '',
    phone: '',
    notes: '',
  });

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getCompanies();
      setCompanies(response.data?.companies || response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError(err.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, company) => {
    setAnchorEl(event.currentTarget);
    setMenuCompany(company);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCompany(null);
  };

  const handleViewDetails = (company) => {
    setSelectedCompany(company);
    setDetailsOpen(true);
    handleMenuClose();
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedCompany(null);
  };

  const handleOpenForm = (company = null) => {
    if (company) {
      setFormData({
        name: company.name || '',
        industry: company.industry || '',
        location: company.location || '',
        website: company.website || '',
        contactPerson: company.contactPerson || '',
        email: company.email || '',
        phone: company.phone || '',
        notes: company.notes || '',
      });
      setSelectedCompany(company);
    } else {
      setFormData({
        name: '',
        industry: '',
        location: '',
        website: '',
        contactPerson: '',
        email: '',
        phone: '',
        notes: '',
      });
      setSelectedCompany(null);
    }
    setFormOpen(true);
    handleMenuClose();
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedCompany(null);
    setFormData({
      name: '',
      industry: '',
      location: '',
      website: '',
      contactPerson: '',
      email: '',
      phone: '',
      notes: '',
    });
  };

  const handleFormChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedCompany) {
        await adminAPI.updateCompany(selectedCompany.id, formData);
      } else {
        await adminAPI.createCompany(formData);
      }
      fetchCompanies();
      handleCloseForm();
    } catch (err) {
      console.error('Failed to save company:', err);
      setError(err.response?.data?.message || 'Failed to save company');
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      !searchTerm ||
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.location?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const paginatedCompanies = filteredCompanies.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && companies.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={600}>
          Companies
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowPathIcon style={{ width: 20, height: 20 }} />}
            onClick={fetchCompanies}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PlusIcon style={{ width: 20, height: 20 }} />}
            onClick={() => handleOpenForm()}
          >
            Add Company
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by name, industry, or location..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MagnifyingGlassIcon style={{ width: 20, height: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company Name</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      {searchTerm ? 'No companies match your search' : 'No companies yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCompanies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {company.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{company.industry || '—'}</TableCell>
                    <TableCell>{company.location || '—'}</TableCell>
                    <TableCell>{company.contactPerson || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="caption">{company.email || '—'}</Typography>
                    </TableCell>
                    <TableCell>{company.phone || '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, company)}>
                        <EllipsisVerticalIcon style={{ width: 20, height: 20 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCompanies.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleViewDetails(menuCompany)}>
          <EyeIcon style={{ width: 20, height: 20, marginRight: 8 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleOpenForm(menuCompany)}>
          <PencilIcon style={{ width: 20, height: 20, marginRight: 8 }} />
          Edit
        </MenuItem>
      </Menu>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Company Details</Typography>
            <IconButton size="small" onClick={handleCloseDetails}>
              <XMarkIcon style={{ width: 20, height: 20 }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCompany && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">{selectedCompany.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Industry
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedCompany.industry || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedCompany.location || '—'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Website
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedCompany.website ? (
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {selectedCompany.website}
                    </a>
                  ) : (
                    '—'
                  )}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Contact Person
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedCompany.contactPerson || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedCompany.email || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedCompany.phone || '—'}
                </Typography>
              </Grid>
              {selectedCompany.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                    <Typography variant="body2">{selectedCompany.notes}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCompany ? 'Edit Company' : 'Add New Company'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Company Name"
                value={formData.name}
                onChange={handleFormChange('name')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Industry"
                value={formData.industry}
                onChange={handleFormChange('industry')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleFormChange('location')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={handleFormChange('website')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={formData.contactPerson}
                onChange={handleFormChange('contactPerson')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleFormChange('email')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleFormChange('phone')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={formData.notes}
                onChange={handleFormChange('notes')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name}
          >
            {selectedCompany ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
