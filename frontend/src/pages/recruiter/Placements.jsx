import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Stack,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  PlusIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  CalendarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { adminAPI } from '../../api';

const PLACEMENT_STATUSES = [
  { key: 'INITIATED', label: 'Initiated', color: '#6366f1' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: '#f59e0b' },
  { key: 'OFFER_LETTER_SENT', label: 'Offer Sent', color: '#8b5cf6' },
  { key: 'VISA_PROCESSING', label: 'Visa Processing', color: '#3b82f6' },
  { key: 'TRAVEL_READY', label: 'Travel Ready', color: '#10b981' },
  { key: 'COMPLETED', label: 'Completed', color: '#22c55e' },
  { key: 'CANCELLED', label: 'Cancelled', color: '#ef4444' },
];

export default function RecruiterPlacements() {
  const [view, setView] = useState('kanban');
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchPlacements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getPlacements();
      // Handle both response.data.data and response.data array formats
      const placementsData = response.data?.data || response.data || [];
      setPlacements(Array.isArray(placementsData) ? placementsData : []);
    } catch (err) {
      console.error('Failed to fetch placements:', err);
      setError(err.response?.data?.message || 'Failed to load placements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlacements();
  }, [fetchPlacements]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const placementId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    const placement = placements.find((p) => p.id === placementId);
    if (!placement || placement.placementStatus === newStatus) return;

    // Optimistic update
    setPlacements((prev) =>
      prev.map((p) =>
        p.id === placementId ? { ...p, placementStatus: newStatus } : p
      )
    );

    try {
      await adminAPI.updatePlacement(placementId, { placementStatus: newStatus });
    } catch (err) {
      console.error('Failed to update placement:', err);
      setError('Failed to update placement status');
      fetchPlacements(); // Revert on error
    }
  };

  const handleViewDetails = (placement) => {
    setSelectedPlacement(placement);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedPlacement(null);
  };

  const groupedPlacements = PLACEMENT_STATUSES.reduce((acc, status) => {
    acc[status.key] = placements.filter((p) => p.placementStatus === status.key);
    return acc;
  }, {});

  if (loading && placements.length === 0) {
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
          Placements
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowPathIcon style={{ width: 20, height: 20 }} />}
            onClick={fetchPlacements}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* View Tabs */}
      <Box mb={3}>
        <Tabs value={view} onChange={(e, v) => setView(v)}>
          <Tab value="kanban" label="Kanban View" />
          <Tab value="list" label="List View" />
        </Tabs>
      </Box>

      {/* Kanban View */}
      {view === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 2,
            }}
          >
            {PLACEMENT_STATUSES.map((status) => (
              <Droppable key={status.key} droppableId={status.key}>
                {(provided, snapshot) => (
                  <Paper
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      minWidth: 300,
                      flex: '0 0 300px',
                      bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'background.paper',
                      p: 2,
                    }}
                  >
                    <Box mb={2} display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: status.color,
                          }}
                        />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {status.label}
                        </Typography>
                        <Chip
                          label={groupedPlacements[status.key]?.length || 0}
                          size="small"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      </Box>
                    </Box>

                    <Stack spacing={2}>
                      {groupedPlacements[status.key]?.map((placement, index) => (
                        <Draggable
                          key={placement.id}
                          draggableId={placement.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                cursor: 'grab',
                                opacity: snapshot.isDragging ? 0.8 : 1,
                                transform: snapshot.isDragging
                                  ? 'rotate(2deg)'
                                  : 'rotate(0deg)',
                                '&:hover': {
                                  boxShadow: 4,
                                },
                              }}
                              onClick={() => handleViewDetails(placement)}
                            >
                              <CardContent>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                  {placement.candidate?.fullName || 'N/A'}
                                </Typography>
                                <Stack spacing={1} mt={2}>
                                  {placement.employerName && (
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <BuildingOfficeIcon style={{ width: 16, height: 16 }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {placement.employerName}
                                      </Typography>
                                    </Box>
                                  )}
                                  {placement.interviewDate && (
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <CalendarIcon style={{ width: 16, height: 16 }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(placement.interviewDate).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                  )}
                                  {placement.jobTitle && (
                                    <Typography variant="caption" color="text.secondary">
                                      {placement.jobTitle}
                                    </Typography>
                                  )}
                                </Stack>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {groupedPlacements[status.key]?.length === 0 && (
                        <Typography variant="caption" color="text.secondary" textAlign="center" py={2}>
                          No placements
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Droppable>
            ))}
          </Box>
        </DragDropContext>
      )}

      {/* List View */}
      {view === 'list' && (
        <Stack spacing={2}>
          {placements.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No placements found</Typography>
            </Paper>
          ) : (
            placements.map((placement) => (
              <Card key={placement.id}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {placement.candidate?.fullName?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {placement.candidate?.fullName || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {placement.jobTitle || '—'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography variant="caption" color="text.secondary">
                        Company
                      </Typography>
                      <Typography variant="body2">
                        {placement.employerName || '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Box mt={0.5}>
                        <Chip
                          label={
                            PLACEMENT_STATUSES.find((s) => s.key === placement.placementStatus)
                              ?.label || placement.placementStatus
                          }
                          size="small"
                          sx={{
                            bgcolor: PLACEMENT_STATUSES.find(
                              (s) => s.key === placement.placementStatus
                            )?.color,
                            color: 'white',
                          }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Typography variant="caption" color="text.secondary">
                        Interview Date
                      </Typography>
                      <Typography variant="body2">
                        {placement.interviewDate
                          ? new Date(placement.interviewDate).toLocaleDateString()
                          : '—'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2} textAlign="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetails(placement)}
                      >
                        View Details
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Placement Details</Typography>
            <IconButton size="small" onClick={handleCloseDetails}>
              <XMarkIcon style={{ width: 20, height: 20 }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPlacement && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                    {selectedPlacement.candidate?.fullName?.charAt(0) || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedPlacement.candidate?.fullName || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPlacement.candidate?.user?.email || 'N/A'}
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
                    label={
                      PLACEMENT_STATUSES.find(
                        (s) => s.key === selectedPlacement.placementStatus
                      )?.label || selectedPlacement.placementStatus
                    }
                    sx={{
                      bgcolor: PLACEMENT_STATUSES.find(
                        (s) => s.key === selectedPlacement.placementStatus
                      )?.color,
                      color: 'white',
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Company
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedPlacement.employerName || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Job Title
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedPlacement.jobTitle || '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Interview Date
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedPlacement.interviewDate
                    ? new Date(selectedPlacement.interviewDate).toLocaleDateString()
                    : '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Contract Start
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedPlacement.contractStart
                    ? new Date(selectedPlacement.contractStart).toLocaleDateString()
                    : '—'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Contract End
                </Typography>
                <Typography variant="body1" mt={1}>
                  {selectedPlacement.contractEnd
                    ? new Date(selectedPlacement.contractEnd).toLocaleDateString()
                    : '—'}
                </Typography>
              </Grid>
              {selectedPlacement.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                    <Typography variant="body2">{selectedPlacement.notes}</Typography>
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
    </Box>
  );
}
