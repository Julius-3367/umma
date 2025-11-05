/**
 * KPI Metrics Cards Component - Usage Examples
 * 
 * This file demonstrates various ways to use the KPIMetricsCards component
 * in your dashboard or analytics pages.
 */

import React, { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import KPIMetricsCards from '../components/dashboard/KPIMetricsCards';

// Example 1: Basic Usage with Static Data
export const BasicExample = () => {
  const staticMetrics = {
    enrollments: {
      total: 1250,
      trend: 12.5,
      comparisonPeriod: 'vs last month',
      previousValue: 1112,
    },
    activeTrainees: {
      total: 850,
      trend: 8.3,
      comparisonPeriod: 'vs last month',
      previousValue: 785,
    },
    completionRate: {
      rate: 78.5,
      trend: 5.2,
      comparisonPeriod: 'vs last month',
      previousRate: 74.6,
    },
    placementRate: {
      rate: 85.2,
      trend: 3.8,
      comparisonPeriod: 'vs last month',
      previousRate: 82.1,
    },
    revenue: {
      total: 524000,
      trend: 15.7,
      comparisonPeriod: 'vs last month',
      previousValue: 452800,
      currency: 'USD',
    },
    alerts: {
      total: 12,
      critical: 2,
      warning: 7,
      info: 3,
    },
  };

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <KPIMetricsCards metrics={staticMetrics} />
      </Box>
    </Container>
  );
};

// Example 2: Loading State
export const LoadingExample = () => {
  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <KPIMetricsCards loading={true} />
      </Box>
    </Container>
  );
};

// Example 3: With API Data
export const APIExample = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // Replace with your actual API call
      const response = await fetch('/api/admin/dashboard/metrics');
      const data = await response.json();
      
      // Transform API response to match component structure
      setMetrics({
        enrollments: {
          total: data.stats.totalEnrollments,
          trend: data.stats.enrollmentTrend,
          comparisonPeriod: 'vs last month',
          previousValue: data.stats.previousEnrollments,
        },
        activeTrainees: {
          total: data.stats.activeTrainees,
          trend: data.stats.traineesTrend,
          comparisonPeriod: 'vs last month',
          previousValue: data.stats.previousTrainees,
        },
        completionRate: {
          rate: data.stats.completionRate,
          trend: data.stats.completionTrend,
          comparisonPeriod: 'vs last month',
          previousRate: data.stats.previousCompletionRate,
        },
        placementRate: {
          rate: data.stats.placementRate,
          trend: data.stats.placementTrend,
          comparisonPeriod: 'vs last month',
          previousRate: data.stats.previousPlacementRate,
        },
        revenue: {
          total: data.stats.revenue,
          trend: data.stats.revenueTrend,
          comparisonPeriod: 'vs last month',
          previousValue: data.stats.previousRevenue,
          currency: 'USD',
        },
        alerts: {
          total: data.alerts.total,
          critical: data.alerts.critical,
          warning: data.alerts.warning,
          info: data.alerts.info,
        },
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <KPIMetricsCards 
          metrics={metrics} 
          loading={loading}
        />
      </Box>
    </Container>
  );
};

// Example 4: With Custom Click Handlers
export const CustomClickExample = () => {
  const handleCardClick = (cardType) => {
    console.log(`Card clicked: ${cardType}`);
    
    // Custom navigation logic
    switch (cardType) {
      case 'enrollments':
        // Navigate to enrollments page with filters
        console.log('Navigate to enrollments');
        break;
      case 'activeTrainees':
        // Navigate to candidates list
        console.log('Navigate to candidates');
        break;
      case 'completionRate':
        // Show completion rate details modal
        console.log('Show completion modal');
        break;
      case 'placementRate':
        // Navigate to placement reports
        console.log('Navigate to placements');
        break;
      case 'revenue':
        // Navigate to financial dashboard
        console.log('Navigate to finance');
        break;
      case 'alerts':
        // Open alerts panel
        console.log('Open alerts');
        break;
      default:
        break;
    }
  };

  const metrics = {
    enrollments: { total: 1250, trend: 12.5, comparisonPeriod: 'vs last month', previousValue: 1112 },
    activeTrainees: { total: 850, trend: 8.3, comparisonPeriod: 'vs last month', previousValue: 785 },
    completionRate: { rate: 78.5, trend: 5.2, comparisonPeriod: 'vs last month', previousRate: 74.6 },
    placementRate: { rate: 85.2, trend: 3.8, comparisonPeriod: 'vs last month', previousRate: 82.1 },
    revenue: { total: 524000, trend: 15.7, comparisonPeriod: 'vs last month', previousValue: 452800, currency: 'USD' },
    alerts: { total: 12, critical: 2, warning: 7, info: 3 },
  };

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <KPIMetricsCards 
          metrics={metrics} 
          onCardClick={handleCardClick}
        />
      </Box>
    </Container>
  );
};

// Example 5: Real-time Updates
export const RealTimeExample = () => {
  const [metrics, setMetrics] = useState({
    enrollments: { total: 1250, trend: 12.5, comparisonPeriod: 'vs last month', previousValue: 1112 },
    activeTrainees: { total: 850, trend: 8.3, comparisonPeriod: 'vs last month', previousValue: 785 },
    completionRate: { rate: 78.5, trend: 5.2, comparisonPeriod: 'vs last month', previousRate: 74.6 },
    placementRate: { rate: 85.2, trend: 3.8, comparisonPeriod: 'vs last month', previousRate: 82.1 },
    revenue: { total: 524000, trend: 15.7, comparisonPeriod: 'vs last month', previousValue: 452800, currency: 'USD' },
    alerts: { total: 12, critical: 2, warning: 7, info: 3 },
  });

  useEffect(() => {
    // Simulate real-time updates every 30 seconds
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        enrollments: {
          ...prev.enrollments,
          total: prev.enrollments.total + Math.floor(Math.random() * 5),
        },
        alerts: {
          ...prev.alerts,
          total: prev.alerts.total + Math.floor(Math.random() * 2),
        },
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <KPIMetricsCards metrics={metrics} />
      </Box>
    </Container>
  );
};

// Example 6: Different Time Periods
export const TimePeriodExample = () => {
  const [period, setPeriod] = useState('month');
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Fetch metrics based on selected period
    fetchMetricsByPeriod(period);
  }, [period]);

  const fetchMetricsByPeriod = async (selectedPeriod) => {
    // Simulate API call with different periods
    const comparisonText = {
      day: 'vs yesterday',
      week: 'vs last week',
      month: 'vs last month',
      quarter: 'vs last quarter',
      year: 'vs last year',
    };

    setMetrics({
      enrollments: {
        total: 1250,
        trend: 12.5,
        comparisonPeriod: comparisonText[selectedPeriod],
        previousValue: 1112,
      },
      activeTrainees: {
        total: 850,
        trend: 8.3,
        comparisonPeriod: comparisonText[selectedPeriod],
        previousValue: 785,
      },
      completionRate: {
        rate: 78.5,
        trend: 5.2,
        comparisonPeriod: comparisonText[selectedPeriod],
        previousRate: 74.6,
      },
      placementRate: {
        rate: 85.2,
        trend: 3.8,
        comparisonPeriod: comparisonText[selectedPeriod],
        previousRate: 82.1,
      },
      revenue: {
        total: 524000,
        trend: 15.7,
        comparisonPeriod: comparisonText[selectedPeriod],
        previousValue: 452800,
        currency: 'USD',
      },
      alerts: {
        total: 12,
        critical: 2,
        warning: 7,
        info: 3,
      },
    });
  };

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        {/* Period selector would go here */}
        <KPIMetricsCards metrics={metrics} />
      </Box>
    </Container>
  );
};

/**
 * Backend API Response Format
 * 
 * Your backend should return data in this format:
 * 
 * {
 *   "success": true,
 *   "data": {
 *     "stats": {
 *       "totalEnrollments": 1250,
 *       "previousEnrollments": 1112,
 *       "enrollmentTrend": 12.5,
 *       "activeTrainees": 850,
 *       "previousTrainees": 785,
 *       "traineesTrend": 8.3,
 *       "completionRate": 78.5,
 *       "previousCompletionRate": 74.6,
 *       "completionTrend": 5.2,
 *       "placementRate": 85.2,
 *       "previousPlacementRate": 82.1,
 *       "placementTrend": 3.8,
 *       "revenue": 524000,
 *       "previousRevenue": 452800,
 *       "revenueTrend": 15.7,
 *     },
 *     "alerts": {
 *       "total": 12,
 *       "critical": 2,
 *       "warning": 7,
 *       "info": 3
 *     }
 *   }
 * }
 */
