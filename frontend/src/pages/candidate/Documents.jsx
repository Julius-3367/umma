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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Description as FileIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import candidateService from '../../api/candidate';

// Document types for candidates
const DOCUMENT_TYPES = [
  { value: 'PASSPORT', label: 'documents.passport' },
  { value: 'NATIONAL_ID', label: 'documents.nationalId' },
  { value: 'POLICE_CLEARANCE', label: 'documents.policeClearance' },
  { value: 'MEDICAL_CERTIFICATE', label: 'documents.medicalCertificate' },
  { value: 'EDUCATION_CERTIFICATE', label: 'documents.educationCertificate' },
  { value: 'VISA', label: 'documents.visa' },
  { value: 'WORK_PERMIT', label: 'documents.workPermit' },
  { value: 'REFERENCE_LETTER', label: 'documents.referenceLetter' },
  { value: 'RESUME_CV', label: 'documents.resumeCv' },
  { value: 'OTHER', label: 'documents.other' },
];

const Documents = () => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await candidateService.getDocuments();
      console.log('📄 Fetched documents:', response);
      console.log('📄 Documents count:', response?.length || 0);
      if (response && response.length > 0) {
        console.log('📄 First document:', JSON.stringify(response[0], null, 2));
      }
      setDocuments(response || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      enqueueSnackbar(t('documents.loadFailed'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        enqueueSnackbar(t('documents.fileSizeLimit'), { variant: 'error' });
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        enqueueSnackbar(t('documents.fileTypeError'), { variant: 'error' });
        return;
      }

      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!documentType || !selectedFile) {
      enqueueSnackbar(t('documents.selectDocumentType'), { variant: 'warning' });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress (in real implementation, use XMLHttpRequest or axios onUploadProgress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Create FormData and send actual file
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', documentType);

      console.log('📤 Documents page sending:', {
        isFormData: formData instanceof FormData,
        file: selectedFile,
        type: documentType
      });

      await candidateService.uploadDocument(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      enqueueSnackbar(t('documents.uploadSuccess'), { variant: 'success' });
      setUploadDialogOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      enqueueSnackbar(error.message || t('documents.uploadFailed'), { variant: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;

    try {
      await candidateService.deleteDocument(selectedDocument.id);
      enqueueSnackbar(t('documents.deleteSuccess'), { variant: 'success' });
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      enqueueSnackbar(t('documents.deleteFailed'), { variant: 'error' });
    }
  };

  const resetForm = () => {
    setDocumentType('');
    setSelectedFile(null);
    setFilePreview(null);
  };

  const getDocumentStatus = (doc) => {
    // Check if document is a required type
    const requiredDocs = ['PASSPORT', 'POLICE_CLEARANCE', 'MEDICAL_CERTIFICATE'];
    if (requiredDocs.includes(doc.documentType)) {
      return { label: t('documents.required'), color: 'success', icon: <CheckIcon /> };
    }
    return { label: t('documents.optional'), color: 'default', icon: null };
  };

  const getMissingDocuments = () => {
    const uploadedTypes = documents.map(d => d.documentType);
    const required = ['PASSPORT', 'POLICE_CLEARANCE', 'MEDICAL_CERTIFICATE'];
    return required.filter(type => !uploadedTypes.includes(type));
  };

  const missingDocs = getMissingDocuments();

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('documents.myDocuments')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('documents.manageDocuments')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          {t('documents.uploadDocument')}
        </Button>
      </Box>

      {/* Missing Documents Alert */}
      {missingDocs.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2">{t('documents.missingRequired')}</Typography>
          <Typography variant="body2">
            {t('documents.pleaseUpload')} {' '}
            {missingDocs.map(type =>
              t(DOCUMENT_TYPES.find(dt => dt.value === type)?.label || '')
            ).join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Documents Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                {t('documents.totalDocuments')}
              </Typography>
              <Typography variant="h4">{documents.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                {t('documents.requiredUploaded')}
              </Typography>
              <Typography variant="h4" color="success.main">
                {3 - missingDocs.length} / 3
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                {t('documents.completionRate')}
              </Typography>
              <Typography variant="h4">
                {Math.round(((3 - missingDocs.length) / 3) * 100)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                {t('documents.lastUpload')}
              </Typography>
              <Typography variant="h6">
                {documents.length > 0
                  ? format(new Date(documents[0].uploadedAt), 'MMM dd')
                  : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Documents Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('documents.documentType')}</TableCell>
              <TableCell>{t('documents.status')}</TableCell>
              <TableCell>{t('documents.uploadedOn')}</TableCell>
              <TableCell>{t('documents.uploadedBy')}</TableCell>
              <TableCell align="right">{t('documents.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box py={4}>
                    <FileIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {t('documents.noDocumentsMessage')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('documents.uploadToGetStarted')}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => {
                const status = getDocumentStatus(doc);
                const docType = DOCUMENT_TYPES.find(dt => dt.value === doc.documentType);

                return (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <FileIcon color="action" />
                        <Typography>{t(docType?.label || 'documents.other')}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        icon={status.icon}
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {doc.uploadedByUser
                        ? `${doc.uploadedByUser.firstName} ${doc.uploadedByUser.lastName}`
                        : t('documents.self')}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('documents.viewDocument')}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const fileUrl = doc.fileUrl.startsWith('http')
                              ? doc.fileUrl
                              : `http://localhost:5000${doc.fileUrl}`;
                            window.open(fileUrl, '_blank');
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('documents.uploadDocument')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>{t('documents.documentType')} *</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                label={`${t('documents.documentType')} *`}
                disabled={uploading}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {t(type.label)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3,
                textAlign: 'center',
                backgroundColor: 'background.default',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
              onClick={() => !uploading && document.getElementById('file-upload').click()}
            >
              <input
                id="file-upload"
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {selectedFile ? (
                <Box>
                  <FileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle1">{selectedFile.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  {filePreview && (
                    <Box mt={2}>
                      <img
                        src={filePreview}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
                      />
                    </Box>
                  )}
                </Box>
              ) : (
                <Box>
                  <UploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 1 }} />
                  <Typography variant="subtitle1">
                    {t('documents.dragDrop')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('documents.supportedFormats')}
                  </Typography>
                </Box>
              )}
            </Box>

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" color="text.secondary" align="center" mt={1}>
                  {t('documents.uploading')} {uploadProgress}%
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !documentType || !selectedFile}
          >
            {uploading ? t('documents.uploading') : t('documents.upload')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('documents.deleteDocument')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('documents.confirmDelete')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents;
