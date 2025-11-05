import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  ContentCopy,
  Description,
} from '@mui/icons-material';
import { adminService } from '../../api/admin';

const CertificateTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState({
    name: '',
    description: '',
    isActive: true,
    design: {},
    content: {},
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getCertificateTemplates();
      const data = response.data?.data || response.data || [];
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setError(err.response?.data?.message || 'Failed to fetch templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsEditing(false);
    setCurrentTemplate({
      name: '',
      description: '',
      isActive: true,
      design: {
        backgroundColor: '#ffffff',
        borderColor: '#1e40af',
        borderWidth: 2,
        fontSize: {
          title: '24px',
          body: '14px',
          footer: '12px',
        },
        fontFamily: 'Arial, sans-serif',
        logo: null,
        signature: null,
      },
      content: {
        header: 'Certificate of Completion',
        body: 'This is to certify that {candidateName} has successfully completed the course {courseName}',
        footer: 'Issued on {issueDate}',
      },
    });
    setDialogOpen(true);
  };

  const handleEdit = (template) => {
    setIsEditing(true);
    setCurrentTemplate(template);
    setDialogOpen(true);
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await adminService.deleteCertificateTemplate(templateId);
      setSuccess('Template deleted successfully');
      fetchTemplates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (isEditing) {
        await adminService.updateCertificateTemplate(currentTemplate.id, currentTemplate);
        setSuccess('Template updated successfully');
      } else {
        await adminService.createCertificateTemplate(currentTemplate);
        setSuccess('Template created successfully');
      }

      setDialogOpen(false);
      setCurrentTemplate({
        name: '',
        description: '',
        isActive: true,
        design: {},
        content: {},
      });
      fetchTemplates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save template');
    }
  };

  const handleToggleActive = async (template) => {
    try {
      setError(null);
      await adminService.updateCertificateTemplate(template.id, {
        ...template,
        isActive: !template.isActive,
      });
      fetchTemplates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update template');
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6">Certificate Templates</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          Create Template
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
        <Alert severity="info">
          No templates found. Create your first certificate template.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {template.description || 'No description'}
                      </Typography>
                    </Box>
                    <Chip
                      label={template.isActive ? 'Active' : 'Inactive'}
                      color={template.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Stack>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Updated: {new Date(template.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={template.isActive}
                        onChange={() => handleToggleActive(template)}
                        size="small"
                      />
                    }
                    label="Active"
                  />
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEdit(template)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDelete(template.id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Edit Template' : 'Create Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Template Name"
              value={currentTemplate.name}
              onChange={(e) =>
                setCurrentTemplate({ ...currentTemplate, name: e.target.value })
              }
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Description"
              value={currentTemplate.description}
              onChange={(e) =>
                setCurrentTemplate({ ...currentTemplate, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
              margin="normal"
            />

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Design Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Background Color"
                  value={currentTemplate.design?.backgroundColor || '#ffffff'}
                  onChange={(e) =>
                    setCurrentTemplate({
                      ...currentTemplate,
                      design: {
                        ...currentTemplate.design,
                        backgroundColor: e.target.value,
                      },
                    })
                  }
                  type="color"
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Border Color"
                  value={currentTemplate.design?.borderColor || '#1e40af'}
                  onChange={(e) =>
                    setCurrentTemplate({
                      ...currentTemplate,
                      design: {
                        ...currentTemplate.design,
                        borderColor: e.target.value,
                      },
                    })
                  }
                  type="color"
                  fullWidth
                  margin="normal"
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Content (Use {'{candidateName}'}, {'{courseName}'}, {'{issueDate}'} as placeholders)
            </Typography>
            <TextField
              label="Header"
              value={currentTemplate.content?.header || ''}
              onChange={(e) =>
                setCurrentTemplate({
                  ...currentTemplate,
                  content: {
                    ...currentTemplate.content,
                    header: e.target.value,
                  },
                })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              label="Body"
              value={currentTemplate.content?.body || ''}
              onChange={(e) =>
                setCurrentTemplate({
                  ...currentTemplate,
                  content: {
                    ...currentTemplate.content,
                    body: e.target.value,
                  },
                })
              }
              fullWidth
              multiline
              rows={4}
              margin="normal"
            />
            <TextField
              label="Footer"
              value={currentTemplate.content?.footer || ''}
              onChange={(e) =>
                setCurrentTemplate({
                  ...currentTemplate,
                  content: {
                    ...currentTemplate.content,
                    footer: e.target.value,
                  },
                })
              }
              fullWidth
              margin="normal"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={currentTemplate.isActive}
                  onChange={(e) =>
                    setCurrentTemplate({
                      ...currentTemplate,
                      isActive: e.target.checked,
                    })
                  }
                />
              }
              label="Active"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!currentTemplate.name}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateTemplates;
