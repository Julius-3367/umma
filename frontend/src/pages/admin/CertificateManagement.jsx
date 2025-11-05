import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  EmojiEvents,
  HourglassEmpty,
  Description,
  VerifiedUser,
} from '@mui/icons-material';
import CertificateList from '../../components/certificates/CertificateList';
import CertificateApprovalQueue from '../../components/certificates/CertificateApprovalQueue';
import CertificateTemplates from '../../components/certificates/CertificateTemplates';
import CertificateVerification from '../../components/certificates/CertificateVerification';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`certificate-tabpanel-${index}`}
      aria-labelledby={`certificate-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CertificateManagement = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Certificate Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage certificates, approvals, templates, and verification
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '0.95rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<EmojiEvents />}
            label="Certificates"
            iconPosition="start"
          />
          <Tab
            icon={<HourglassEmpty />}
            label="Pending Approvals"
            iconPosition="start"
          />
          <Tab
            icon={<Description />}
            label="Templates"
            iconPosition="start"
          />
          <Tab
            icon={<VerifiedUser />}
            label="Verification"
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <CertificateList />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <CertificateApprovalQueue />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <CertificateTemplates />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <CertificateVerification />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default CertificateManagement;
