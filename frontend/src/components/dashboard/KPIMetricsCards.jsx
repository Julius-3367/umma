import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Chip,
  IconButton,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Work as WorkIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * KPI Metrics Cards Component
 * Displays key performance indicators with trend analysis
 * 
 * @param {Object} props
 * @param {Object} props.metrics - Metrics data object
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onCardClick - Optional click handler for individual cards
 */
const KPIMetricsCards = ({ metrics = {}, loading = false, onCardClick }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Default metrics structure
  const defaultMetrics = {
    enrollments: {
      total: 0,
      trend: 0,
      comparisonPeriod: 'vs last month',
      previousValue: 0,
    },
    activeTrainees: {
      total: 0,
      trend: 0,
      comparisonPeriod: 'vs last month',
      previousValue: 0,
    },
    completionRate: {
      rate: 0,
      trend: 0,
      comparisonPeriod: 'vs last month',
      previousRate: 0,
    },
    placementRate: {
      rate: 0,
      trend: 0,
      comparisonPeriod: 'vs last month',
      previousRate: 0,
    },
    revenue: {
      total: 0,
      trend: 0,
      comparisonPeriod: 'vs last month',
      previousValue: 0,
      currency: 'USD',
    },
    alerts: {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
    },
  };

  const data = { ...defaultMetrics, ...metrics };

  /**
   * Calculate trend percentage
   */
  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  /**
   * Format currency
   */
  const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  /**
   * Format number with commas
   */
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  /**
   * Get trend color based on value and context
   */
  const getTrendColor = (trend, isInverse = false) => {
    if (trend === 0) return theme.palette.text.secondary;
    const isPositive = isInverse ? trend < 0 : trend > 0;
    return isPositive ? theme.palette.success.main : theme.palette.error.main;
  };

  /**
   * Get trend icon
   */
  const getTrendIcon = (trend) => {
    if (trend === 0) return null;
    return trend > 0 ? (
      <TrendingUpIcon fontSize="small" />
    ) : (
      <TrendingDownIcon fontSize="small" />
    );
  };

  /**
   * Handle card click
   */
  const handleCardClick = (cardType, route) => {
    if (onCardClick) {
      onCardClick(cardType);
    } else if (route) {
      navigate(route);
    }
  };

  /**
   * KPI Card Configuration
   */
  const kpiCards = [
    {
      id: 'enrollments',
      title: 'Total Enrollments',
      value: formatNumber(data.enrollments.total),
      trend: data.enrollments.trend || calculateTrend(data.enrollments.total, data.enrollments.previousValue),
      comparisonPeriod: data.enrollments.comparisonPeriod,
      icon: SchoolIcon,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1),
      route: '/admin/enrollments',
      description: `${formatNumber(data.enrollments.previousValue)} ${data.enrollments.comparisonPeriod}`,
    },
    {
      id: 'activeTrainees',
      title: 'Active Trainees',
      value: formatNumber(data.activeTrainees.total),
      trend: data.activeTrainees.trend || calculateTrend(data.activeTrainees.total, data.activeTrainees.previousValue),
      comparisonPeriod: data.activeTrainees.comparisonPeriod,
      icon: PeopleIcon,
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.1),
      route: '/admin/users?role=candidate&status=active',
      description: `${formatNumber(data.activeTrainees.previousValue)} ${data.activeTrainees.comparisonPeriod}`,
    },
    {
      id: 'completionRate',
      title: 'Monthly Completion Rate',
      value: `${data.completionRate.rate.toFixed(1)}%`,
      trend: data.completionRate.trend || calculateTrend(data.completionRate.rate, data.completionRate.previousRate),
      comparisonPeriod: data.completionRate.comparisonPeriod,
      icon: CheckCircleIcon,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
      route: '/admin/reports?type=completion',
      description: `${data.completionRate.previousRate.toFixed(1)}% ${data.completionRate.comparisonPeriod}`,
    },
    {
      id: 'placementRate',
      title: 'Placement Percentage',
      value: `${data.placementRate.rate.toFixed(1)}%`,
      trend: data.placementRate.trend || calculateTrend(data.placementRate.rate, data.placementRate.previousRate),
      comparisonPeriod: data.placementRate.comparisonPeriod,
      icon: WorkIcon,
      color: theme.palette.secondary.main,
      bgColor: alpha(theme.palette.secondary.main, 0.1),
      route: '/admin/reports?type=placement',
      description: `${data.placementRate.previousRate.toFixed(1)}% ${data.placementRate.comparisonPeriod}`,
    },
    {
      id: 'revenue',
      title: 'Revenue Summary',
      value: formatCurrency(data.revenue.total, data.revenue.currency),
      trend: data.revenue.trend || calculateTrend(data.revenue.total, data.revenue.previousValue),
      comparisonPeriod: data.revenue.comparisonPeriod,
      icon: AttachMoneyIcon,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      route: '/admin/reports?type=financial',
      description: `${formatCurrency(data.revenue.previousValue, data.revenue.currency)} ${data.revenue.comparisonPeriod}`,
    },
    {
      id: 'alerts',
      title: 'System Alerts',
      value: formatNumber(data.alerts.total),
      trend: 0, // Alerts don't have trends
      comparisonPeriod: 'Active alerts',
      icon: WarningIcon,
      color: data.alerts.critical > 0 ? theme.palette.error.main : theme.palette.grey[600],
      bgColor: data.alerts.critical > 0 
        ? alpha(theme.palette.error.main, 0.1) 
        : alpha(theme.palette.grey[600], 0.1),
      route: '/admin/alerts',
      description: `${data.alerts.critical} critical, ${data.alerts.warning} warnings`,
      badges: [
        { label: `${data.alerts.critical} Critical`, color: 'error', show: data.alerts.critical > 0 },
        { label: `${data.alerts.warning} Warning`, color: 'warning', show: data.alerts.warning > 0 },
        { label: `${data.alerts.info} Info`, color: 'info', show: data.alerts.info > 0 },
      ],
    },
  ];

  /**
   * Render loading skeleton
   */
  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={item}>
            <Card>
              <CardContent>
                <Skeleton variant="circular" width={48} height={48} />
                <Skeleton variant="text" width="60%" sx={{ mt: 2 }} />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="80%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {kpiCards.map((card) => {
        const IconComponent = card.icon;
        const trendColor = getTrendColor(card.trend, card.id === 'alerts');
        const trendIcon = getTrendIcon(card.trend);

        return (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
              onClick={() => handleCardClick(card.id, card.route)}
            >
              <CardContent>
                {/* Icon and Action Button */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={2}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: card.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComponent sx={{ color: card.color, fontSize: 28 }} />
                  </Box>
                  <IconButton
                    size="small"
                    sx={{ mt: -1, mr: -1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(card.id, card.route);
                    }}
                  >
                    <ArrowForwardIcon fontSize="small" />
                  </IconButton>
                </Stack>

                {/* Title */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontWeight: 500 }}
                >
                  {card.title}
                </Typography>

                {/* Main Value */}
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    color: theme.palette.text.primary,
                  }}
                >
                  {card.value}
                </Typography>

                {/* Trend Indicator */}
                {card.trend !== 0 && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    mb={1}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: trendColor,
                      }}
                    >
                      {trendIcon}
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          ml: 0.5,
                        }}
                      >
                        {Math.abs(card.trend).toFixed(1)}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {card.comparisonPeriod}
                    </Typography>
                  </Stack>
                )}

                {/* Description or Badges */}
                {card.badges ? (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {card.badges
                      .filter((badge) => badge.show)
                      .map((badge, index) => (
                        <Chip
                          key={index}
                          label={badge.label}
                          color={badge.color}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                          }}
                        />
                      ))}
                  </Stack>
                ) : (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {card.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default KPIMetricsCards;
