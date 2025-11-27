import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
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
  Avatar,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { recruiterAPI } from '../../api';

const STATUS_COLORS = {
  APPLIED: 'info',
  UNDER_REVIEW: 'warning',
  ENROLLED: 'primary',
  WAITLISTED: 'default',
  PLACED: 'success',
  CANCELLED: 'error',
};

const STATUS_LABELS = {
  APPLIED: 'Applied',
  UNDER_REVIEW: 'Under Review',
  ENROLLED: 'Enrolled',
  WAITLISTED: 'Waitlisted',
  PLACED: 'Placed',
  CANCELLED: 'Cancelled',
};

export default function RecruiterCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCandidate, setMenuCandidate] = useState(null);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recruiterAPI.getPipelineCandidates();
      // Handle both response.data.data and response.data array formats
      const candidatesData = response.data?.data || response.data || [];
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setError(err.response?.data?.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, candidate) => {
    setAnchorEl(event.currentTarget);
    setMenuCandidate(candidate);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCandidate(null);
  };

  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setDetailsOpen(true);
    handleMenuClose();
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedCandidate(null);
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      !searchTerm ||
      candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.region?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || candidate.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedCandidates = filteredCandidates.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const statusCounts = candidates.reduce((acc, candidate) => {
    acc[candidate.status] = (acc[candidate.status] || 0) + 1;
    return acc;
  }, {});

  if (loading && candidates.length === 0) {
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
          Candidate Pipeline
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowPathIcon style={{ width: 20, height: 20 }} />}
          onClick={fetchCandidates}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Status Filter Chips */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`All (${candidates.length})`}
              onClick={() => handleStatusFilterChange('ALL')}
              color={statusFilter === 'ALL' ? 'primary' : 'default'}
              variant={statusFilter === 'ALL' ? 'filled' : 'outlined'}
            />
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <Chip
                key={status}
                label={`${label} (${statusCounts[status] || 0})`}
                onClick={() => handleStatusFilterChange(status)}
                color={statusFilter === status ? STATUS_COLORS[status] : 'default'}
                variant={statusFilter === status ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Search & Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, email, or region..."
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
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Candidate</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Job Type</TableCell>
                <TableCell>Last Event</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'No candidates match your filters'
                        : 'No candidates in pipeline'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCandidates.map((candidate) => (
                  <TableRow key={candidate.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {candidate.name?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {candidate.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {candidate.email || 'N/A'}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[candidate.status] || candidate.status}
                        color={STATUS_COLORS[candidate.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{candidate.region || '—'}</TableCell>
                    <TableCell>{candidate.jobType || '—'}</TableCell>
                    <TableCell>
                      {candidate.lastEvent ? (
                        <Tooltip
                          title={candidate.lastEvent.comment || 'No comment'}
                          arrow
                        >
                          <Typography variant="caption" color="text.secondary">
                            {candidate.lastEvent.toStage || '—'}
                          </Typography>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {candidate.updatedAt
                          ? new Date(candidate.updatedAt).toLocaleDateString()
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, candidate)}
                      >
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
          count={filteredCandidates.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleViewDetails(menuCandidate)}>
          <EyeIcon style={{ width: 20, height: 20, marginRight: 8 }} />
          View Details
        </MenuItem>
      </Menu>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Candidate Details</Typography>
            <IconButton size="small" onClick={handleCloseDetails}>
              <XMarkIcon style={{ width: 20, height: 20 }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCandidate && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                    {selectedCandidate.name?.charAt(0) || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedCandidate.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCandidate.email}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box mt={1}>
                  <Chip
                    label={STATUS_LABELS[selectedCandidate.status]}
                    color={STATUS_COLORS[selectedCandidate.status]}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Region
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedCandidate.region || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Job Type Preference
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedCandidate.jobType || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedCandidate.updatedAt
                    ? new Date(selectedCandidate.updatedAt).toLocaleString()
                    : '—'}
                </Typography>
              </Grid>
              {selectedCandidate.lastEvent && (
                <>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Latest Activity
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2">
                        Moved from <strong>{selectedCandidate.lastEvent.fromStage}</strong> to{' '}
                        <strong>{selectedCandidate.lastEvent.toStage}</strong>
                      </Typography>
                      {selectedCandidate.lastEvent.comment && (
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          {selectedCandidate.lastEvent.comment}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        {new Date(selectedCandidate.lastEvent.createdAt).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
