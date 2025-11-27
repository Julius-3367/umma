import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  AccountBalance as AccountBalanceIcon,
  ManageAccounts as ManageAccountsIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Upload as UploadIcon,
  Timeline as TimelineIcon,
  EventNote as EventNoteIcon,
  Quiz as QuizIcon,
  Send as SendIcon,
  AttachMoney as AttachMoneyIcon,
  Work as WorkIcon,
  VideoCall as VideoCallIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

/**
 * Sidebar navigation component
 * Displays role-based navigation items
 */
const Sidebar = ({ navigationItems, onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleNavigation = (path) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };
  
  const getIcon = (iconName) => {
    const icons = {
      Dashboard: DashboardIcon,
      People: PeopleIcon,
      School: SchoolIcon,
      Business: BusinessIcon,
      AccountBalance: AccountBalanceIcon,
      ManageAccounts: ManageAccountsIcon,
      Assessment: AssessmentIcon,
      Person: PersonIcon,
      Upload: UploadIcon,
      Timeline: TimelineIcon,
      EventNote: EventNoteIcon,
      Quiz: QuizIcon,
      Send: SendIcon,
      AttachMoney: AttachMoneyIcon,
      Work: WorkIcon,
      VideoCall: VideoCallIcon,
      CheckCircle: CheckCircleIcon,
    };
    
    const IconComponent = icons[iconName] || DashboardIcon;
    return <IconComponent />;
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Labour Mobility
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Management System
        </Typography>
      </Box>
      
      <Divider />
      
      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
          {navigationItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          return (
              <ListItem key={`${item.path || 'nav'}-${item.label || index}-${index}`} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon>
                  {getIcon(item.icon)}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Divider />
      
      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          v1.0.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;
