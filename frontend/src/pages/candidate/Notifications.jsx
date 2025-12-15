import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Paper,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Badge,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import candidateService from '../../api/candidate';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Notifications = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [markingAsRead, setMarkingAsRead] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await candidateService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setMarkingAsRead(notificationId);
      await candidateService.markNotificationAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true, readAt: new Date() } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      alert('Failed to mark notification as read');
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadNotifications.map((notif) => candidateService.markNotificationAsRead(notif.id))
      );
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
      alert('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon style={{ width: 24, height: 24 }} />;
      case 'warning':
        return <ExclamationTriangleIcon style={{ width: 24, height: 24 }} />;
      case 'error':
        return <ExclamationTriangleIcon style={{ width: 24, height: 24 }} />;
      case 'info':
      default:
        return <InformationCircleIcon style={{ width: 24, height: 24 }} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return theme.palette.success;
      case 'warning':
        return theme.palette.warning;
      case 'error':
        return theme.palette.error;
      case 'info':
      default:
        return theme.palette.info;
    }
  };

  const getFilteredNotifications = () => {
    switch (tabValue) {
      case 0:
        return notifications;
      case 1:
        return notifications.filter((n) => !n.isRead);
      case 2:
        return notifications.filter((n) => n.isRead);
      default:
        return notifications;
    }
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now - notifDate;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return notifDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress size={64} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowLeftIcon style={{ width: 20, height: 20 }} />}>
          Go Back
        </Button>
      </Container>
    );
  }

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Button
        onClick={() => navigate('/candidate/dashboard')}
        startIcon={<ArrowLeftIcon style={{ width: 20, height: 20 }} />}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={unreadCount} color="error">
              <BellIcon style={{ width: 48, height: 48 }} />
            </Badge>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                Notifications
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          {unreadCount > 0 && (
            <Button
              variant="contained"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </Box>
      </Paper>

      {/* Notifications List */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label={`All (${notifications.length})`} />
          <Tab
            label={
              <Badge badgeContent={unreadCount} color="error">
                <span style={{ marginRight: unreadCount > 0 ? 16 : 0 }}>Unread</span>
              </Badge>
            }
          />
          <Tab label={`Read (${notifications.length - unreadCount})`} />
        </Tabs>

        <TabPanel value={tabValue} index={tabValue}>
          {filteredNotifications.length > 0 ? (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      bgcolor: notification.isRead ? 'transparent' : theme.palette.action.hover,
                      '&:hover': {
                        bgcolor: theme.palette.action.selected,
                      },
                    }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!notification.isRead && (
                          <IconButton
                            edge="end"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markingAsRead === notification.id}
                          >
                            <CheckCircleIcon style={{ width: 20, height: 20 }} />
                          </IconButton>
                        )}
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Badge
                        color="primary"
                        variant="dot"
                        invisible={notification.isRead}
                        sx={{
                          '& .MuiBadge-badge': {
                            right: 8,
                            top: 8,
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: getNotificationColor(notification.type || 'info').light,
                            color: getNotificationColor(notification.type || 'info').main,
                          }}
                        >
                          {getNotificationIcon(notification.type || 'info')}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: notification.isRead ? 400 : 600,
                            mb: 0.5,
                          }}
                        >
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1, display: 'block' }}
                          >
                            {notification.message}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {getRelativeTime(notification.createdAt)}
                            </Typography>
                            {notification.channel && (
                              <Chip
                                label={notification.channel}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <BellIcon style={{ width: 64, height: 64, color: theme.palette.grey[400], margin: '0 auto 16px' }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're all caught up!
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Card>
    </Container>
  );
};

export default Notifications;
