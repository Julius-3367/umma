import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  ErrorOutline as ErrorOutlineIcon,
  PendingActions as PendingActionsIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ShieldOutlined,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import adminService from '../../api/admin';

const STATUS_FILTERS = [
  { value: 'all', label: 'vetting.allStatuses' },
  { value: 'PENDING', label: 'vetting.pending' },
  { value: 'IN_PROGRESS', label: 'vetting.inProgress' },
  { value: 'CLEARED', label: 'vetting.cleared' },
  { value: 'REJECTED', label: 'vetting.rejected' },
];

const MEDICAL_OPTIONS = [
  { value: '', label: 'vetting.notSet' },
  { value: 'pending', label: 'vetting.pendingReview' },
  { value: 'cleared', label: 'vetting.cleared' },
  { value: 'flagged', label: 'vetting.flagged' },
];

const documentChipColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'cleared':
    case 'verified':
    case 'submitted':
      return 'success';
    case 'missing':
      return 'default';
    case 'flagged':
    case 'rejected':
      return 'error';
    default:
      return 'warning';
  }
};

const VettingDashboard = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [note, setNote] = useState('');
  const [languagePassed, setLanguagePassed] = useState(false);
  const [medicalStatus, setMedicalStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getVettingDashboard({
        status: filters.status,
        search: filters.search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setDashboard(response?.data?.data || null);
    } catch (error) {
      console.error('Failed to load vetting dashboard', error);
      enqueueSnackbar(error?.response?.data?.message || t('vetting.failedToLoad'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, filters, pagination]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [filters.status, filters.search]);

  const statsCards = useMemo(() => {
    const stats = dashboard?.stats || {};
    return [
      {
        label: t('vetting.totalCandidates'),
        value: stats.total || 0,
        helper: t('vetting.trackedInVetting'),
        icon: <ShieldOutlined fontSize="small" />,
      },
      {
        label: t('vetting.pendingReviews'),
        value: stats.pending || 0,
        helper: t('vetting.awaitingAction'),
        icon: <PendingActionsIcon fontSize="small" />,
      },
      {
        label: t('vetting.cleared'),
        value: stats.cleared || 0,
        helper: t('vetting.readyForPlacement'),
        icon: <CheckCircleIcon fontSize="small" color="success" />,
      },
      {
        label: t('vetting.documentsUploaded'),
        value: stats.documentsUploaded || 0,
        helper: t('vetting.filesShared'),
        icon: <VisibilityIcon fontSize="small" />,
      },
      {
        label: t('vetting.avgReviewTime'),
        value: stats.avgReviewHours ? `${stats.avgReviewHours}h` : '—',
        helper: t('vetting.fromSubmissionToDecision'),
        icon: <ErrorOutlineIcon fontSize="small" />,
      },
    ];
  }, [dashboard]);

  const handleRefresh = () => {
    if (!loading) {
      loadDashboard();
    }
  };

  const openDrawer = (record) => {
    setSelectedRecord(record);
    setNote(record?.comments || '');
    setLanguagePassed(Boolean(record?.languageTestPassed));
    setMedicalStatus(record?.medicalStatus || '');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRecord(null);
  };

  const handleStatusUpdate = async (nextStatus) => {
    if (!selectedRecord) return;
    try {
      setUpdating(true);
      await adminService.updateVettingRecord(selectedRecord.id, {
        vettingStatus: nextStatus,
        comments: note,
        languageTestPassed: languagePassed,
        medicalStatus: medicalStatus || null,
      });
      enqueueSnackbar(`${t('vetting.vettingUpdated')} ${nextStatus}`, { variant: 'success' });
      await loadDashboard();
      setSelectedRecord((prev) => (prev ? { ...prev, status: nextStatus, comments: note, languageTestPassed: languagePassed, medicalStatus } : prev));
      setDrawerOpen(false);
    } catch (error) {
      console.error('Failed to update vetting status', error);
      enqueueSnackbar(error?.response?.data?.message || t('vetting.failedToUpdate'), { variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !dashboard) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={64} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>{t('vetting.vettingDashboard')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('vetting.monitorCandidates')}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            size="small"
            placeholder={t('vetting.searchPlaceholder')}
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            {STATUS_FILTERS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {t(option.label)}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
            {t('common.refresh')}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statsCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={card.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                    {card.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>{card.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{card.helper}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>{t('vetting.candidatesInVetting')}</Typography>
              {!dashboard?.candidates?.length ? (
                <Alert severity="info">{t('vetting.noCandidatesFound')}</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('vetting.candidate')}</TableCell>
                        <TableCell>{t('vetting.documents')}</TableCell>
                        <TableCell>{t('vetting.status')}</TableCell>
                        <TableCell>{t('vetting.missing')}</TableCell>
                        <TableCell align="right">{t('vetting.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboard.candidates.map((candidate) => (
                        <TableRow key={candidate.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{candidate.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{candidate.email || t('vetting.noEmail')} • {candidate.identifier || t('vetting.noId')}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                              {candidate.documents.map((doc) => (
                                <Chip
                                  key={`${candidate.id}-${doc.type}`}
                                  label={doc.type}
                                  size="small"
                                  color={documentChipColor(doc.status)}
                                  variant={doc.url ? 'filled' : 'outlined'}
                                />
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={candidate.status}
                              color={candidate.status === 'CLEARED' ? 'success' : candidate.status === 'REJECTED' ? 'error' : candidate.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {candidate.missingDocuments.length ? (
                              <Typography variant="caption" color="error">
                                {candidate.missingDocuments.join(', ')}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="success.main">{t('vetting.allReceived')}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined" onClick={() => openDrawer(candidate)}>
                              {t('vetting.review')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <TablePagination
                component="div"
                count={dashboard?.pagination?.total || 0}
                page={(pagination.page || 1) - 1}
                onPageChange={(event, newPage) => setPagination((prev) => ({ ...prev, page: newPage + 1 }))}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={(event) => setPagination({ page: 1, limit: parseInt(event.target.value, 10) })}
                rowsPerPageOptions={[5, 10, 20]}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h6">{t('vetting.latestDocuments')}</Typography>
                  <Chip label={dashboard?.documentsFeed?.length || 0} size="small" />
                </Stack>
                {!dashboard?.documentsFeed?.length ? (
                  <Alert severity="info">{t('vetting.noDocumentsRecent')}</Alert>
                ) : (
                  <List dense>
                    {dashboard.documentsFeed.map((doc) => (
                      <ListItem key={doc.id} secondaryAction={
                        doc.url ? (
                          <IconButton edge="end" onClick={() => window.open(doc.url, '_blank')}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        ) : null
                      }>
                        <ListItemAvatar>
                          <Avatar>
                            <ShieldOutlined fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${doc.type} • ${doc.candidateName}`}
                          secondary={new Date(doc.updatedAt).toLocaleString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>{t('vetting.recentActivity')}</Typography>
                {!dashboard?.recentActivity?.length ? (
                  <Alert severity="info">{t('vetting.noRecentActions')}</Alert>
                ) : (
                  <Stack spacing={2}>
                    {dashboard.recentActivity.map((item) => (
                      <Box key={item.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                        <Typography variant="subtitle2">{item.candidateName}</Typography>
                        <Chip
                          label={item.status}
                          size="small"
                          color={item.status === 'CLEARED' ? 'success' : item.status === 'REJECTED' ? 'error' : item.status === 'IN_PROGRESS' ? 'warning' : 'default'}
                          sx={{ my: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.updatedAt).toLocaleString()}{item.reviewer ? ` • ${item.reviewer}` : ''}
                        </Typography>
                        {item.comments && (
                          <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                            {item.comments}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer} sx={{ '& .MuiDrawer-paper': { width: 420, p: 3 } }}>
        {selectedRecord && (
          <Stack spacing={2} sx={{ height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">{selectedRecord.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedRecord.email || t('vetting.noEmail')}</Typography>
              </Box>
              <IconButton onClick={closeDrawer}>
                <CloseIcon />
              </IconButton>
            </Stack>
            <Divider />
            <Chip
              label={selectedRecord.status}
              color={selectedRecord.status === 'CLEARED' ? 'success' : selectedRecord.status === 'REJECTED' ? 'error' : selectedRecord.status === 'IN_PROGRESS' ? 'warning' : 'default'}
              sx={{ alignSelf: 'flex-start' }}
            />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('vetting.documents')}</Typography>
              <Stack spacing={1}>
                {selectedRecord.documents.map((doc) => (
                  <Stack key={doc.type} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.type}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {doc.reference || t('vetting.noReference')}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={doc.status} size="small" color={documentChipColor(doc.status)} />
                      {doc.url && (
                        <IconButton size="small" onClick={() => window.open(doc.url, '_blank')}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Box>
            <Divider />
            <Stack spacing={2}>
              <TextField
                label={t('vetting.reviewerNotes')}
                multiline
                minRows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={languagePassed}
                    onChange={(event) => setLanguagePassed(event.target.checked)}
                  />
                }
                label={t('vetting.languageTestPassed')}
              />
              <TextField
                select
                label={t('vetting.medicalStatus')}
                value={medicalStatus}
                onChange={(event) => setMedicalStatus(event.target.value)}
              >
                {MEDICAL_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {t(option.label)}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Divider />
            <Stack spacing={1}>
              <Typography variant="subtitle2">{t('vetting.updateStatus')}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {['PENDING', 'IN_PROGRESS', 'CLEARED', 'REJECTED'].map((statusValue) => (
                  <Button
                    key={statusValue}
                    variant={selectedRecord.status === statusValue ? 'contained' : 'outlined'}
                    color={statusValue === 'CLEARED' ? 'success' : statusValue === 'REJECTED' ? 'error' : 'primary'}
                    onClick={() => handleStatusUpdate(statusValue)}
                    disabled={updating}
                  >
                    {statusValue.replace('_', ' ')}
                  </Button>
                ))}
              </Stack>
            </Stack>
          </Stack>
        )}
      </Drawer>
    </Box>
  );
};

export default VettingDashboard;
