import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Chip,
  Paper,
  Container,
  useMediaQuery,
  Tooltip,
  Button,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  CalendarIcon,
  QuestionMarkCircleIcon,
  ClipboardDocumentListIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../features/auth/authThunks';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

const AppLayout = ({ children }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (e) {
      // no-op
    } finally {
      navigate('/login');
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin')) return t('navigation.adminDashboard');
    if (path.includes('/candidate')) return t('navigation.candidatePortal');
    if (path.includes('/trainer')) return t('navigation.trainerDashboard');
    if (path.includes('/recruiter')) return t('navigation.recruiterDashboard');
    if (path.includes('/broker')) return t('navigation.brokerDashboard');
    if (path.includes('/employer')) return t('navigation.employerDashboard');
    return t('navigation.dashboard');
  };

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return 'U';
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const getUserPhotoUrl = () => {
    // Check if user has candidate profile with photo
    if (user?.candidate?.profilePhotoUrl) {
      return `${BACKEND_URL}${user.candidate.profilePhotoUrl}`;
    }
    return null;
  };

  const getRoleColor = (role) => {
    // role might be an object or a string
    const roleName = typeof role === 'object' ? role?.name : role;
    const roleStr = typeof roleName === 'string' ? roleName.toLowerCase() : '';

    switch (roleStr) {
      case 'admin':
        return theme.palette.error;
      case 'candidate':
        return theme.palette.primary;
      case 'trainer':
        return theme.palette.success;
      case 'agent':
      case 'recruiter':
        return theme.palette.info;
      case 'broker':
        return theme.palette.warning;
      case 'employer':
        return theme.palette.secondary;
      default:
        return theme.palette.grey;
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    // user.role is an object with { id, name, ... }, so we need role.name
    const roleName = user?.role?.name || user?.role;
    const rawRole = typeof roleName === 'string' ? roleName.toLowerCase() : 'candidate';
    const role = rawRole === 'agent' ? 'recruiter' : rawRole;
    const baseItems = [
      {
        label: t('navigation.dashboard'),
        path: role === 'candidate' ? '/candidate/dashboard' :
          role === 'admin' ? '/admin/dashboard' :
            role === 'trainer' ? '/trainer/dashboard' :
              role === 'recruiter' ? '/recruiter/dashboard' :
                role === 'broker' ? '/broker/dashboard' :
                  role === 'employer' ? '/employer/dashboard' :
                    `/dashboard/${role}`,
        icon: HomeIcon,
      },
    ];

    const roleSpecificItems = {
      admin: [
        { label: t('navigation.users'), path: '/admin/users', icon: UserGroupIcon },
        { label: t('navigation.candidates'), path: '/admin/candidates', icon: UserGroupIcon },
        { label: t('navigation.courses'), path: '/admin/courses', icon: AcademicCapIcon },
        { label: t('navigation.cohorts'), path: '/admin/cohorts', icon: UserGroupIcon },
        { label: t('navigation.enrollments'), path: '/admin/enrollments', icon: ClipboardDocumentListIcon },
        { label: t('navigation.vetting'), path: '/admin/vetting', icon: ShieldCheckIcon },
        { label: t('navigation.documents'), path: '/admin/certificates', icon: DocumentTextIcon },
        { label: t('navigation.companies'), path: '/admin/companies', icon: BuildingOfficeIcon },
        { label: t('navigation.reports'), path: '/admin/reports', icon: ChartBarIcon },
        { label: t('navigation.settings'), path: '/admin/settings', icon: Cog6ToothIcon },
      ],
      candidate: [
        { label: t('navigation.browseCohorts'), path: '/candidate/browse-cohorts', icon: UserGroupIcon },
        { label: t('navigation.myApplications'), path: '/candidate/my-applications', icon: ClipboardDocumentListIcon },
        { label: t('navigation.myCourses'), path: '/candidate/courses', icon: AcademicCapIcon },
        { label: t('navigation.attendance'), path: '/candidate/attendance', icon: CalendarIcon },
        { label: t('navigation.assessments'), path: '/candidate/assessments', icon: ChartBarIcon },
        { label: t('navigation.documents'), path: '/candidate/certificates', icon: DocumentTextIcon },
        { label: t('navigation.profile'), path: '/candidate/profile', icon: UserIcon },
      ],
      trainer: [
        { label: t('navigation.attendance'), path: '/trainer/attendance', icon: CalendarIcon },
        { label: t('navigation.myCourses'), path: '/trainer/my-courses', icon: AcademicCapIcon },
        { label: t('navigation.myCohorts'), path: '/trainer/cohorts', icon: UserGroupIcon },
        { label: t('navigation.students'), path: '/trainer/students', icon: UserGroupIcon },
        { label: t('navigation.assessments'), path: '/trainer/assessments', icon: DocumentTextIcon },
        { label: t('navigation.schedule'), path: '/trainer/schedule', icon: CalendarIcon },
      ],
      recruiter: [
        { label: t('navigation.candidates'), path: '/recruiter/candidates', icon: UserGroupIcon },
        { label: t('navigation.placements'), path: '/recruiter/placements', icon: BriefcaseIcon },
        { label: t('navigation.companies'), path: '/recruiter/companies', icon: BuildingOfficeIcon },
        { label: t('navigation.reports'), path: '/recruiter/reports', icon: ChartBarIcon },
      ],
      broker: [
        { label: t('navigation.referrals'), path: '/broker/referrals', icon: UserGroupIcon },
        { label: t('navigation.placements'), path: '/broker/placements', icon: BriefcaseIcon },
        { label: t('navigation.commissions'), path: '/broker/commissions', icon: CurrencyDollarIcon },
        { label: t('navigation.payments'), path: '/broker/payments', icon: ChartBarIcon },
      ],
      employer: [
        { label: t('navigation.jobPostings'), path: '/employer/jobs', icon: BriefcaseIcon },
        { label: t('navigation.applications'), path: '/employer/applications', icon: DocumentTextIcon },
        { label: t('navigation.candidates'), path: '/employer/candidates', icon: UserGroupIcon },
        { label: t('navigation.reports'), path: '/employer/reports', icon: ChartBarIcon },
      ],
    };

    return [...baseItems, ...(roleSpecificItems[role] || [])];
  };

  const navigationItems = getNavigationItems();

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'New job application',
      message: 'John Doe applied for Construction Worker position',
      time: '5 minutes ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Course completed',
      message: 'Safety Training course has been completed by 15 candidates',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Payment received',
      message: 'Payment of AED 2,500 received from Emirates Construction',
      time: '3 hours ago',
      unread: false,
    },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const SidebarContent = () => (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
            textAlign: 'center',
          }}
        >
          {t('navigation.systemName')}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: theme.palette.text.secondary,
            mt: 0.5,
          }}
        >
          {t('navigation.systemTagline')}
        </Typography>
      </Box>

      {/* User Profile Section */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={getUserPhotoUrl()}
            sx={{
              bgcolor: getRoleColor(user?.role).main,
              color: 'white',
              width: 48,
              height: 48,
              fontSize: '1.2rem',
            }}
          >
            {getUserInitials()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Chip
              size="small"
              label={
                typeof user?.role === 'object'
                  ? user?.role?.name
                  : user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)
              }
              sx={{
                bgcolor: getRoleColor(user?.role).light,
                color: getRoleColor(user?.role).dark,
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            />
          </Box>
        </Stack>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, py: 1 }}>
        {navigationItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={`${item.path || 'nav'}-${item.label || index}-${index}`} disablePadding sx={{ px: 2 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor: isActive ? theme.palette.primary.light : 'transparent',
                  color: isActive ? theme.palette.primary.dark : theme.palette.text.primary,
                  '&:hover': {
                    bgcolor: isActive ? theme.palette.primary.light : theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 40,
                  }}
                >
                  <item.icon style={{ width: 20, height: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Help Section */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItemButton
          sx={{ borderRadius: 2 }}
          onClick={() => navigate('/help')}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <QuestionMarkCircleIcon style={{ width: 20, height: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="Help & Support"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${sidebarOpen ? 280 : 0}px)` },
          ml: { lg: sidebarOpen ? '280px' : 0 },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: theme.shadows[1],
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            edge="start"
            sx={{ mr: 2 }}
          >
            {sidebarOpen ? <XMarkIcon style={{ width: 24, height: 24 }} /> : <Bars3Icon style={{ width: 24, height: 24 }} />}
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {getPageTitle()}
          </Typography>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={(event) => setNotificationMenuAnchor(event.currentTarget)}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <BellIcon style={{ width: 24, height: 24 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Profile Menu */}
          <Button
            color="inherit"
            onClick={(event) => setProfileMenuAnchor(event.currentTarget)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
            endIcon={<ChevronDownIcon style={{ width: 16, height: 16 }} />}
          >
            <Avatar
              src={getUserPhotoUrl()}
              sx={{
                bgcolor: getRoleColor(user?.role).main,
                width: 32,
                height: 32,
                mr: 1,
                fontSize: '0.875rem',
              }}
            >
              {getUserInitials()}
            </Avatar>
            <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
            </Box>
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${sidebarOpen ? 280 : 0}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        {children}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={() => setProfileMenuAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <UserCircleIcon style={{ width: 20, height: 20, marginRight: 12 }} />
          {t('navigation.viewProfile')}
        </MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>
          <Cog6ToothIcon style={{ width: 20, height: 20, marginRight: 12 }} />
          {t('navigation.settings')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
          <ArrowRightOnRectangleIcon style={{ width: 20, height: 20, marginRight: 12 }} />
          {t('navigation.logout')}
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationMenuAnchor}
        open={Boolean(notificationMenuAnchor)}
        onClose={() => setNotificationMenuAnchor(null)}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 360,
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('navigation.notifications')}
          </Typography>
        </Box>
        {notifications.map((notification) => (
          <MenuItem
            key={notification.id}
            sx={{
              py: 2,
              px: 2,
              bgcolor: notification.unread ? theme.palette.action.hover : 'transparent',
              borderLeft: notification.unread ? `3px solid ${theme.palette.primary.main}` : 'none',
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {notification.title}
                </Typography>
                {notification.unread && (
                  <Badge color="primary" variant="dot" sx={{ mt: 0.5 }} />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notification.time}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button variant="text" fullWidth>
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default AppLayout;
