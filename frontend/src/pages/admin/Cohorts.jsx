import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  Refresh,
  Groups,
  Delete,
  Archive,
  Publish,
  LockOpen,
  Lock,
} from '@mui/icons-material';
import { cohortService } from '../../api/cohort';
import { format } from 'date-fns';

const Cohorts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCohorts, setTotalCohorts] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, cohort: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Show success message from navigation state
  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      // Clear the state so message doesn't show on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    fetchCohorts();
  }, [page, rowsPerPage, searchQuery, statusFilter, courseFilter]);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        courseId: courseFilter || undefined,
      };
      const response = await cohortService.getCohorts(params);
      
      // API returns data nested in response.data.data
      const cohortsData = response.data?.data || response.data;
      setCohorts(cohortsData.cohorts || []);
      setTotalCohorts(cohortsData.total || 0);
    } catch (err) {
      console.error('Error fetching cohorts:', err);
      setError(err.response?.data?.message || t('cohorts.failedToFetch'));
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

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handlePublish = async (cohort) => {
    try {
      setActionLoading(true);
      await cohortService.publishCohort(cohort.id);
      setSuccess(`${t('cohorts.title').slice(0, -1)} "${cohort.cohortName || cohort.name}" ${t('cohorts.publishedSuccess')}`);
      fetchCohorts();
    } catch (err) {
      setError(err.response?.data?.message || t('cohorts.failedToPublish'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEnrollment = async (cohort) => {
    try {
      setActionLoading(true);
      await cohortService.openEnrollment(cohort.id);
      setSuccess(`${t('cohorts.enrollmentOpenedSuccess')} "${cohort.cohortName || cohort.name}"`);
      fetchCohorts();
    } catch (err) {
      setError(err.response?.data?.message || t('cohorts.failedToOpenEnrollment'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseEnrollment = async (cohort) => {
    try {
      setActionLoading(true);
      await cohortService.closeEnrollment(cohort.id);
      setSuccess(`${t('cohorts.enrollmentClosedSuccess')} "${cohort.cohortName || cohort.name}"`);
      fetchCohorts();
    } catch (err) {
      setError(err.response?.data?.message || t('cohorts.failedToCloseEnrollment'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (cohort) => {
    try {
      setActionLoading(true);
      await cohortService.archiveCohort(cohort.id);
      setSuccess(`${t('cohorts.title').slice(0, -1)} "${cohort.cohortName || cohort.name}" ${t('cohorts.archivedSuccess')}`);
      fetchCohorts();
    } catch (err) {
      setError(err.response?.data?.message || t('cohorts.failedToArchive'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await cohortService.deleteCohort(deleteDialog.cohort.id);
      setSuccess(`${t('cohorts.title').slice(0, -1)} "${deleteDialog.cohort.cohortName || deleteDialog.cohort.name}" ${t('cohorts.deletedSuccess')}`);
      setDeleteDialog({ open: false, cohort: null });
      fetchCohorts();
    } catch (err) {
      setError(err.response?.data?.message || t('cohorts.failedToDelete'));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      PUBLISHED: 'info',
      ENROLLMENT_OPEN: 'success',
      ENROLLMENT_CLOSED: 'warning',
      IN_TRAINING: 'primary',
      ASSESSMENT_IN_PROGRESS: 'secondary',
      VETTING_IN_PROGRESS: 'secondary',
      COMPLETED: 'success',
      ARCHIVED: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, ' ');
  };

  const formatDate = (date) => {
    return date ? format(new Date(date), 'MMM dd, yyyy') : 'N/A';
  };

  const getActionButtons = (cohort) => {
    const buttons = [];
    
    if (cohort.status === 'DRAFT') {
      buttons.push(
        <Tooltip key="publish" title={t('cohorts.publish')}>
          <IconButton
            size="small"
            onClick={() => handlePublish(cohort)}
            disabled={actionLoading}
          >
            <Publish fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
    
    if (cohort.status === 'PUBLISHED') {
      buttons.push(
        <Tooltip key="open-enrollment" title={t('cohorts.openEnrollment')}>
          <IconButton
            size="small"
            onClick={() => handleOpenEnrollment(cohort)}
            disabled={actionLoading}
          >
            <LockOpen fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
    
    if (cohort.status === 'ENROLLMENT_OPEN') {
      buttons.push(
        <Tooltip key="close-enrollment" title={t('cohorts.closeEnrollment')}>
          <IconButton
            size="small"
            onClick={() => handleCloseEnrollment(cohort)}
            disabled={actionLoading}
          >
            <Lock fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
    
    if (cohort.status === 'COMPLETED') {
      buttons.push(
        <Tooltip key="archive" title={t('cohorts.archive')}>
          <IconButton
            size="small"
            onClick={() => handleArchive(cohort)}
            disabled={actionLoading}
          >
            <Archive fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
    
    return buttons;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Groups sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            {t('cohorts.cohortManagement')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/admin/cohorts/create')}
        >
          {t('cohorts.createCohort')}
        </Button>
      </Stack>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            placeholder={t('cohorts.searchPlaceholder')}
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t('common.status')}</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label={t('common.status')}
            >
              <MenuItem value="">{t('cohorts.allStatuses')}</MenuItem>
              <MenuItem value="DRAFT">{t('cohorts.draft')}</MenuItem>
              <MenuItem value="PUBLISHED">{t('cohorts.published')}</MenuItem>
              <MenuItem value="ENROLLMENT_OPEN">{t('cohorts.enrollmentOpen')}</MenuItem>
              <MenuItem value="ENROLLMENT_CLOSED">{t('cohorts.enrollmentClosed')}</MenuItem>
              <MenuItem value="IN_TRAINING">{t('cohorts.inTraining')}</MenuItem>
              <MenuItem value="ASSESSMENT_IN_PROGRESS">{t('cohorts.assessmentInProgress')}</MenuItem>
              <MenuItem value="VETTING_IN_PROGRESS">{t('cohorts.vettingInProgress')}</MenuItem>
              <MenuItem value="COMPLETED">{t('cohorts.completed')}</MenuItem>
              <MenuItem value="ARCHIVED">{t('cohorts.archived')}</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={fetchCohorts} disabled={loading}>
            <Refresh />
          </IconButton>
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('cohorts.cohortCode')}</TableCell>
              <TableCell>{t('cohorts.name')}</TableCell>
              <TableCell>{t('cohorts.course')}</TableCell>
              <TableCell>{t('common.status')}</TableCell>
              <TableCell>{t('cohorts.startDate')}</TableCell>
              <TableCell>{t('cohorts.endDate')}</TableCell>
              <TableCell align="center">{t('cohorts.enrolled')}</TableCell>
              <TableCell align="center">{t('cohorts.capacity')}</TableCell>
              <TableCell>{t('cohorts.leadTrainer')}</TableCell>
              <TableCell align="center">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : cohorts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    {t('cohorts.noCohorts')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              cohorts.map((cohort) => (
                <TableRow key={cohort.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {cohort.cohortCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cohort.cohortName || cohort.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {cohort.course?.title || cohort.course?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(cohort.status)}
                      color={getStatusColor(cohort.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(cohort.startDate)}</TableCell>
                  <TableCell>{formatDate(cohort.endDate)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={cohort._count?.enrollments || cohort.enrolledCount || 0}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {cohort.maxCapacity || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {cohort.leadTrainer
                        ? `${cohort.leadTrainer.firstName} ${cohort.leadTrainer.lastName}`
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title={t('cohorts.viewDetails')}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/cohorts/${cohort.id}`)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {cohort.status === 'DRAFT' && (
                        <Tooltip title={t('common.edit')}>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/cohorts/${cohort.id}/edit`)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {getActionButtons(cohort)}
                      {cohort.status === 'DRAFT' && (
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, cohort })}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCohorts}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, cohort: null })}
      >
        <DialogTitle>{t('cohorts.confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('cohorts.confirmDeleteMessage')} "{deleteDialog.cohort?.name}"? {t('common.actionCannotBeUndone')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, cohort: null })}
            disabled={actionLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? t('cohorts.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cohorts;
