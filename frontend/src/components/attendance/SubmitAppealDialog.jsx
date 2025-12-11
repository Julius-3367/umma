import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  AttachFile as AttachFileIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import attendanceAppealService from '../../api/attendanceAppeal';

const SubmitAppealDialog = ({ open, onClose, attendanceRecord, onAppealSubmitted }) => {
  const [reason, setReason] = useState('');
  const [requestedStatus, setRequestedStatus] = useState('');
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newDocs = files.map(file => ({
      name: file.name,
      file: file,
      url: URL.createObjectURL(file),
    }));
    setSupportingDocs([...supportingDocs, ...newDocs]);
  };

  const handleRemoveDoc = (index) => {
    const newDocs = [...supportingDocs];
    URL.revokeObjectURL(newDocs[index].url);
    newDocs.splice(index, 1);
    setSupportingDocs(newDocs);
  };

  const handleSubmit = async () => {
    if (!reason || reason.trim().length < 10) {
      enqueueSnackbar('Please provide a detailed reason (minimum 10 characters)', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);

      // For now, we'll store file paths as strings
      // In production, you'd upload files first and get URLs
      const docPaths = supportingDocs.map(doc => doc.name);

      const appealData = {
        reason: reason.trim(),
        requestedStatus: requestedStatus || null,
        supportingDocuments: docPaths.length > 0 ? docPaths : null,
      };

      await attendanceAppealService.submitAttendanceAppeal(attendanceRecord.id, appealData);

      enqueueSnackbar('Appeal submitted successfully! Your trainer will review it shortly.', { 
        variant: 'success' 
      });

      handleClose();
      if (onAppealSubmitted) onAppealSubmitted();
    } catch (error) {
      console.error('Error submitting appeal:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to submit appeal',
        { variant: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setRequestedStatus('');
    setSupportingDocs([]);
    onClose();
  };

  if (!attendanceRecord) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Submit Attendance Appeal</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Record Details */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Date:</strong> {format(new Date(attendanceRecord.date), 'MMMM dd, yyyy')}
          </Typography>
          <Typography variant="body2">
            <strong>Course:</strong> {attendanceRecord.course?.title || 'N/A'}
          </Typography>
          <Typography variant="body2">
            <strong>Current Status:</strong>{' '}
            <Chip
              label={attendanceRecord.status}
              size="small"
              color={
                attendanceRecord.status === 'ABSENT' ? 'error' :
                attendanceRecord.status === 'LATE' ? 'warning' : 'default'
              }
            />
          </Typography>
        </Alert>

        {/* Info */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>⚠️ Important:</strong> Appeals are reviewed by your trainer. Provide a clear,
            honest explanation with supporting documents if available (medical certificates, etc.).
          </Typography>
        </Alert>

        {/* Reason */}
        <TextField
          label="Reason for Appeal *"
          multiline
          rows={4}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why you were absent, late, or why the status is incorrect. Be specific and honest."
          helperText={`${reason.length}/500 characters (minimum 10 required)`}
          inputProps={{ maxLength: 500 }}
          sx={{ mb: 2 }}
        />

        {/* Requested Status */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Requested Status (Optional)</InputLabel>
          <Select
            value={requestedStatus}
            onChange={(e) => setRequestedStatus(e.target.value)}
            label="Requested Status (Optional)"
          >
            <MenuItem value="">
              <em>Let trainer decide</em>
            </MenuItem>
            <MenuItem value="PRESENT">PRESENT - I attended but was marked incorrectly</MenuItem>
            <MenuItem value="EXCUSED">EXCUSED - I had a valid reason for absence</MenuItem>
            <MenuItem value="LATE">LATE - I was late but did attend</MenuItem>
          </Select>
        </FormControl>

        {/* File Upload */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Supporting Documents (Optional)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Upload medical certificates, official letters, or other proof
          </Typography>

          <Button
            variant="outlined"
            startIcon={<AttachFileIcon />}
            component="label"
            size="small"
            disabled={supportingDocs.length >= 3}
          >
            Attach File
            <input
              type="file"
              hidden
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
            />
          </Button>

          {supportingDocs.length > 0 && (
            <List dense sx={{ mt: 1 }}>
              {supportingDocs.map((doc, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton edge="end" size="small" onClick={() => handleRemoveDoc(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <FileIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.name}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Alert severity="info" icon={false}>
          <Typography variant="caption">
            💡 <strong>Tip:</strong> Appeals are usually reviewed within 24-48 hours. You'll be notified
            of the decision.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !reason || reason.trim().length < 10}
        >
          {submitting ? 'Submitting...' : 'Submit Appeal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitAppealDialog;
