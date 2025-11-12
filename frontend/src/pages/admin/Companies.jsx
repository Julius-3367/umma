import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import adminService from '../../api/admin';

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const industries = ['Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Finance', 'Other'];
  const statuses = ['ACTIVE', 'INACTIVE', 'PENDING'];

  useEffect(() => {
    fetchCompanies();
  }, [page, rowsPerPage, searchQuery, industryFilter, statusFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
        industry: industryFilter,
        status: statusFilter,
      };
      const response = await adminService.getAllCompanies(params);
      setCompanies(response.data.companies || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (company) => {
    setCompanyToDelete(company);
    setConfirmOpen(true);
  };

  const handleCloseDelete = () => {
    setCompanyToDelete(null);
    setConfirmOpen(false);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    try {
      setLoading(true);
      await adminService.deleteCompany(companyToDelete.id);
      // refresh list
      handleCloseDelete();
      fetchCompanies();
    } catch (err) {
      console.error('Delete error', err);
      setError(err.response?.data?.message || 'Failed to delete company');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'success',
      INACTIVE: 'error',
      PENDING: 'warning',
    };
    return colors[status] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Companies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage company profiles and partnerships
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/companies/new')}
        >
          Add Company
        </Button>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            placeholder="Search companies..."
            value={searchQuery}
            onChange={handleSearch}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Industry</InputLabel>
            <Select
              value={industryFilter}
              label="Industry"
              onChange={(e) => {
                setIndustryFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Industries</MenuItem>
              {industries.map((industry) => (
                <MenuItem key={industry} value={industry}>
                  {industry}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All Status</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Companies Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : companies.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No companies found
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {searchQuery || industryFilter || statusFilter
                ? 'Try adjusting your filters'
                : 'Add your first company to get started'}
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Contact Person</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <BusinessIcon color="primary" />
                        <Typography variant="body2" fontWeight={500}>
                          {company.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{company.industry || 'N/A'}</TableCell>
                    <TableCell>{company.contactPerson || 'N/A'}</TableCell>
                    <TableCell>{company.email || 'N/A'}</TableCell>
                    <TableCell>{company.phone || 'N/A'}</TableCell>
                    <TableCell>{company.country || company.address || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={company.status || 'ACTIVE'}
                        color={getStatusColor(company.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/companies/${company.id}`)}
                        title="View"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/companies/${company.id}/edit`)}
                        title="Edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        title="Delete"
                        onClick={() => handleOpenDelete(company)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>
      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onClose={handleCloseDelete}>
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the company "{companyToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies;
