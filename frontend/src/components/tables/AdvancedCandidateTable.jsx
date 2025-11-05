import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
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
  Checkbox,
  Chip,
  Button,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  LinearProgress,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  ViewColumn as ViewColumnIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Advanced Candidate Management Table Component
 * 
 * Features:
 * - Searchable and filterable columns
 * - Bulk selection and actions
 * - Status badges with colors
 * - Progress indicators
 * - Quick action buttons
 * - Pagination with customizable page sizes
 * - Export to Excel/PDF
 * - Column visibility toggle
 * 
 * @param {Object} props
 * @param {Array} props.candidates - Array of candidate objects
 * @param {Function} props.onRefresh - Callback to refresh data
 * @param {Function} props.onEdit - Callback when edit is clicked
 * @param {Function} props.onDelete - Callback when delete is clicked
 * @param {Function} props.onEmail - Callback when email is clicked
 * @param {Function} props.onBulkAction - Callback for bulk actions
 * @param {boolean} props.loading - Loading state
 */
const AdvancedCandidateTable = ({
  candidates = [],
  onRefresh,
  onEdit,
  onDelete,
  onEmail,
  onBulkAction,
  loading = false,
}) => {
  const navigate = useNavigate();

  // State Management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  
  // Menu States
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [columnsAnchorEl, setColumnsAnchorEl] = useState(null);
  const [bulkActionsAnchorEl, setBulkActionsAnchorEl] = useState(null);
  const [rowActionAnchorEl, setRowActionAnchorEl] = useState(null);
  const [activeRowId, setActiveRowId] = useState(null);

  // Dialog States
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);

  // Notification State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    phone: true,
    status: true,
    progress: true,
    enrollments: true,
    dateJoined: true,
    actions: true,
  });

  // All available columns
  const columns = [
    { id: 'name', label: 'Name', sortable: true },
    { id: 'email', label: 'Email', sortable: true },
    { id: 'phone', label: 'Phone', sortable: false },
    { id: 'status', label: 'Status', sortable: true },
    { id: 'progress', label: 'Progress', sortable: true },
    { id: 'enrollments', label: 'Enrollments', sortable: true },
    { id: 'dateJoined', label: 'Date Joined', sortable: true },
    { id: 'actions', label: 'Actions', sortable: false },
  ];

  // Status options
  const statusOptions = ['all', 'enrolled', 'active', 'completed', 'placed', 'inactive'];
  const progressOptions = ['all', '0-25', '26-50', '51-75', '76-100'];

  /**
   * Get status color and label
   */
  const getStatusConfig = (status) => {
    const configs = {
      enrolled: { color: 'info', label: 'Enrolled' },
      active: { color: 'primary', label: 'Active' },
      completed: { color: 'success', label: 'Completed' },
      placed: { color: 'secondary', label: 'Placed' },
      inactive: { color: 'default', label: 'Inactive' },
    };
    return configs[status?.toLowerCase()] || { color: 'default', label: status };
  };

  /**
   * Get progress color based on percentage
   */
  const getProgressColor = (progress) => {
    if (progress >= 75) return 'success';
    if (progress >= 50) return 'primary';
    if (progress >= 25) return 'warning';
    return 'error';
  };

  /**
   * Filter candidates based on search and filters
   */
  const filteredCandidates = candidates.filter((candidate) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      candidate.name?.toLowerCase().includes(searchLower) ||
      candidate.email?.toLowerCase().includes(searchLower) ||
      candidate.phone?.includes(searchQuery);

    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      candidate.status?.toLowerCase() === statusFilter;

    // Progress filter
    let matchesProgress = true;
    if (progressFilter !== 'all') {
      const progress = candidate.progress || 0;
      const [min, max] = progressFilter.split('-').map(Number);
      matchesProgress = progress >= min && progress <= max;
    }

    return matchesSearch && matchesStatus && matchesProgress;
  });

  /**
   * Paginated data
   */
  const paginatedData = filteredCandidates.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  /**
   * Handle select all
   */
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelected = paginatedData.map((candidate) => candidate.id);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  /**
   * Handle individual selection
   */
  const handleSelect = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter((selectedId) => selectedId !== id);
    }

    setSelected(newSelected);
  };

  /**
   * Handle page change
   */
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    setSelected([]);
  };

  /**
   * Handle rows per page change
   */
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSelected([]);
  };

  /**
   * Handle export to Excel
   */
  const handleExportExcel = () => {
    const dataToExport = selected.length > 0
      ? candidates.filter((c) => selected.includes(c.id))
      : filteredCandidates;

    const csvContent = [
      ['Name', 'Email', 'Phone', 'Status', 'Progress', 'Enrollments', 'Date Joined'],
      ...dataToExport.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.status,
        `${c.progress}%`,
        c.enrollments,
        new Date(c.dateJoined).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setExportAnchorEl(null);
    setSnackbar({
      open: true,
      message: `Exported ${dataToExport.length} candidates to Excel`,
      severity: 'success',
    });
  };

  /**
   * Handle export to PDF
   */
  const handleExportPDF = () => {
    // TODO: Implement PDF export with a library like jsPDF
    setExportAnchorEl(null);
    setSnackbar({
      open: true,
      message: 'PDF export functionality coming soon',
      severity: 'info',
    });
  };

  /**
   * Handle bulk actions
   */
  const handleBulkAction = (action) => {
    if (onBulkAction) {
      onBulkAction(action, selected);
    }
    
    setSnackbar({
      open: true,
      message: `${action} applied to ${selected.length} candidates`,
      severity: 'success',
    });
    
    setBulkActionsAnchorEl(null);
    setSelected([]);
  };

  /**
   * Handle view candidate
   */
  const handleView = (candidate) => {
    navigate(`/admin/candidates/${candidate.id}`);
  };

  /**
   * Handle edit candidate
   */
  const handleEdit = (candidate) => {
    if (onEdit) {
      onEdit(candidate);
    } else {
      navigate(`/admin/candidates/${candidate.id}/edit`);
    }
  };

  /**
   * Handle email candidate
   */
  const handleEmail = (candidate) => {
    if (onEmail) {
      onEmail(candidate);
    }
    setEmailDialogOpen(true);
  };

  /**
   * Handle delete confirmation
   */
  const handleDeleteClick = (candidate) => {
    setCandidateToDelete(candidate);
    setDeleteDialogOpen(true);
    setRowActionAnchorEl(null);
  };

  /**
   * Confirm delete
   */
  const handleDeleteConfirm = () => {
    if (onDelete && candidateToDelete) {
      onDelete(candidateToDelete);
    }
    
    setSnackbar({
      open: true,
      message: `Candidate ${candidateToDelete.name} deleted`,
      severity: 'success',
    });
    
    setDeleteDialogOpen(false);
    setCandidateToDelete(null);
  };

  /**
   * Toggle column visibility
   */
  const toggleColumnVisibility = (columnId) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setProgressFilter('all');
    setPage(0);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;
  const hasFilters = searchQuery || statusFilter !== 'all' || progressFilter !== 'all';

  return (
    <Box>
      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          {/* Search */}
          <TextField
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Status Filter */}
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
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Progress Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Progress</InputLabel>
            <Select
              value={progressFilter}
              label="Progress"
              onChange={(e) => {
                setProgressFilter(e.target.value);
                setPage(0);
              }}
            >
              {progressOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option === 'all' ? 'All' : `${option}%`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              startIcon={<CancelIcon />}
            >
              Clear Filters
            </Button>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Bulk Actions */}
          {selected.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={(e) => setBulkActionsAnchorEl(e.currentTarget)}
              startIcon={<CheckCircleIcon />}
            >
              Actions ({selected.length})
            </Button>
          )}

          {/* Export */}
          <Tooltip title="Export">
            <IconButton
              size="small"
              onClick={(e) => setExportAnchorEl(e.currentTarget)}
            >
              <ExportIcon />
            </IconButton>
          </Tooltip>

          {/* Column Visibility */}
          <Tooltip title="Columns">
            <IconButton
              size="small"
              onClick={(e) => setColumnsAnchorEl(e.currentTarget)}
            >
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>

          {/* Refresh */}
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Active Filters Display */}
        {hasFilters && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Active Filters:
            </Typography>
            <Stack direction="row" spacing={1} mt={1}>
              {searchQuery && (
                <Chip
                  label={`Search: "${searchQuery}"`}
                  size="small"
                  onDelete={() => setSearchQuery('')}
                />
              )}
              {statusFilter !== 'all' && (
                <Chip
                  label={`Status: ${statusFilter}`}
                  size="small"
                  onDelete={() => setStatusFilter('all')}
                />
              )}
              {progressFilter !== 'all' && (
                <Chip
                  label={`Progress: ${progressFilter}%`}
                  size="small"
                  onDelete={() => setProgressFilter('all')}
                />
              )}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading && <LinearProgress />}
        
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selected.length > 0 && selected.length < paginatedData.length
                  }
                  checked={
                    paginatedData.length > 0 && selected.length === paginatedData.length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              {visibleColumns.name && <TableCell>Name</TableCell>}
              {visibleColumns.email && <TableCell>Email</TableCell>}
              {visibleColumns.phone && <TableCell>Phone</TableCell>}
              {visibleColumns.status && <TableCell>Status</TableCell>}
              {visibleColumns.progress && <TableCell>Progress</TableCell>}
              {visibleColumns.enrollments && <TableCell align="center">Enrollments</TableCell>}
              {visibleColumns.dateJoined && <TableCell>Date Joined</TableCell>}
              {visibleColumns.actions && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {hasFilters ? 'No candidates match your filters' : 'No candidates found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((candidate) => {
                const isItemSelected = isSelected(candidate.id);
                const statusConfig = getStatusConfig(candidate.status);
                const progressColor = getProgressColor(candidate.progress || 0);

                return (
                  <TableRow
                    key={candidate.id}
                    hover
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={() => handleSelect(candidate.id)}
                      />
                    </TableCell>
                    
                    {visibleColumns.name && (
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {candidate.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>
                            {candidate.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                    )}
                    
                    {visibleColumns.email && (
                      <TableCell>{candidate.email}</TableCell>
                    )}
                    
                    {visibleColumns.phone && (
                      <TableCell>{candidate.phone || 'N/A'}</TableCell>
                    )}
                    
                    {visibleColumns.status && (
                      <TableCell>
                        <Chip
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                        />
                      </TableCell>
                    )}
                    
                    {visibleColumns.progress && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flexGrow: 1, minWidth: 100 }}>
                            <LinearProgress
                              variant="determinate"
                              value={candidate.progress || 0}
                              color={progressColor}
                              sx={{ height: 6, borderRadius: 1 }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ minWidth: 35 }}>
                            {candidate.progress || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    
                    {visibleColumns.enrollments && (
                      <TableCell align="center">
                        <Chip
                          label={candidate.enrollments || 0}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    )}
                    
                    {visibleColumns.dateJoined && (
                      <TableCell>
                        {new Date(candidate.dateJoined).toLocaleDateString()}
                      </TableCell>
                    )}
                    
                    {visibleColumns.actions && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => handleView(candidate)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(candidate)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Email">
                            <IconButton
                              size="small"
                              onClick={() => handleEmail(candidate)}
                            >
                              <EmailIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setRowActionAnchorEl(e.currentTarget);
                                setActiveRowId(candidate.id);
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={filteredCandidates.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={() => setExportAnchorEl(null)}
      >
        <MenuItem onClick={handleExportExcel}>
          <ListItemIcon>
            <ExcelIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportPDF}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to PDF</ListItemText>
        </MenuItem>
      </Menu>

      {/* Column Visibility Menu */}
      <Menu
        anchorEl={columnsAnchorEl}
        open={Boolean(columnsAnchorEl)}
        onClose={() => setColumnsAnchorEl(null)}
      >
        {columns.map((column) => (
          <MenuItem key={column.id} onClick={() => toggleColumnVisibility(column.id)}>
            <Checkbox checked={visibleColumns[column.id]} size="small" />
            <ListItemText>{column.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkActionsAnchorEl}
        open={Boolean(bulkActionsAnchorEl)}
        onClose={() => setBulkActionsAnchorEl(null)}
      >
        <MenuItem onClick={() => handleBulkAction('activate')}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Activate Selected</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('deactivate')}>
          <ListItemIcon>
            <CancelIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Deactivate Selected</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkAction('email')}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send Email to Selected</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('export')}>
          <ListItemIcon>
            <ExportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Selected</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Selected</ListItemText>
        </MenuItem>
      </Menu>

      {/* Row Actions Menu */}
      <Menu
        anchorEl={rowActionAnchorEl}
        open={Boolean(rowActionAnchorEl)}
        onClose={() => {
          setRowActionAnchorEl(null);
          setActiveRowId(null);
        }}
      >
        <MenuItem
          onClick={() => {
            const candidate = candidates.find((c) => c.id === activeRowId);
            if (candidate) handleDeleteClick(candidate);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete candidate{' '}
            <strong>{candidateToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdvancedCandidateTable;
