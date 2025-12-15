import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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

  const industries = [
    { value: 'Technology', label: 'companies.technology' },
    { value: 'Healthcare', label: 'companies.healthcare' },
    { value: 'Manufacturing', label: 'companies.manufacturing' },
    { value: 'Retail', label: 'companies.retail' },
    { value: 'Finance', label: 'companies.finance' },
    { value: 'Other', label: 'companies.otherIndustry' },
  ];
  const statuses = [
    { value: 'ACTIVE', label: 'companies.active' },
    { value: 'INACTIVE', label: 'companies.inactive' },
    { value: 'PENDING', label: 'companies.pending' },
  ];

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
      setError(err.response?.data?.message || t('companies.loadFailed'));
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
      setError(err.response?.data?.message || t('companies.deleteFailed'));
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
            {t('companies.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('companies.manageCompanies')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/companies/new')}
        >
          {t('companies.addCompany')}
        </Button>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            placeholder={t('companies.searchPlaceholder')}
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
            <InputLabel>{t('companies.industry')}</InputLabel>
            <Select
              value={industryFilter}
              label={t('companies.industry')}
              onChange={(e) => {
                setIndustryFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">{t('companies.allIndustries')}</MenuItem>
              {industries.map((industry) => (
                <MenuItem key={industry.value} value={industry.value}>
                  {t(industry.label)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('companies.status')}</InputLabel>
            <Select
              value={statusFilter}
              label={t('companies.status')}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">{t('companies.allStatus')}</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {t(status.label)}
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
              {t('companies.noCompaniesFound')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {searchQuery || industryFilter || statusFilter
                ? t('companies.tryAdjustingFilters')
                : t('companies.addFirstCompany')}
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('companies.companyName')}</TableCell>
                  <TableCell>{t('companies.industry')}</TableCell>
                  <TableCell>{t('companies.contactPerson')}</TableCell>
                  <TableCell>{t('companies.email')}</TableCell>
                  <TableCell>{t('companies.phone')}</TableCell>
                  <TableCell>{t('companies.location')}</TableCell>
                  <TableCell>{t('companies.status')}</TableCell>
                  <TableCell align="right">{t('companies.actions')}</TableCell>
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
                        title={t('companies.viewCompany')}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/companies/${company.id}/edit`)}
                        title={t('companies.editCompany')}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        title={t('companies.deleteCompany')}
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
        <DialogTitle>{t('companies.deleteCompany')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('companies.confirmDelete')} "{companyToDelete?.name}"? {t('companies.actionCannotBeUndone')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>{t('common.cancel')}</Button>
          <Button color="error" onClick={handleDelete}>{t('common.delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies;
