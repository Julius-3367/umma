# KPI Metrics Cards Component - Documentation

## Overview
The KPI Metrics Cards component is a powerful, reusable dashboard widget that displays key performance indicators with trend analysis, visual appeal, and interactive features.

## Features

### 1. **Six KPI Metrics**
- **Total Enrollments**: Track total course enrollments with month-over-month trends
- **Active Trainees**: Monitor current active trainees in the system
- **Monthly Completion Rate**: Display course completion percentage
- **Placement Percentage**: Show successful job placement rates
- **Revenue Summary**: Track financial performance
- **System Alerts**: Display critical system notifications

### 2. **Visual Elements**
- Icon representation for each metric
- Color-coded background
- Large, readable metric values
- Trend indicators (up/down arrows)
- Comparison period display
- Responsive grid layout

### 3. **Interactive Features**
- Click-to-navigate functionality
- Hover effects with elevation
- Custom click handlers support
- Loading skeleton states
- Responsive design (mobile, tablet, desktop)

## Installation & Usage

### Basic Implementation

```jsx
import React from 'react';
import KPIMetricsCards from './components/dashboard/KPIMetricsCards';

function Dashboard() {
  const metrics = {
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

  return <KPIMetricsCards metrics={metrics} />;
}
```

### With API Integration

```jsx
import React, { useState, useEffect } from 'react';
import KPIMetricsCards from './components/dashboard/KPIMetricsCards';
import { adminService } from './api/admin';

function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboard();
      const data = response.data.data;
      
      setMetrics({
        enrollments: {
          total: data.stats.totalEnrollments || 0,
          trend: data.stats.enrollmentTrend || 0,
          comparisonPeriod: 'vs last month',
          previousValue: data.stats.previousEnrollments || 0,
        },
        activeTrainees: {
          total: data.stats.activeTrainees || 0,
          trend: data.stats.traineesTrend || 0,
          comparisonPeriod: 'vs last month',
          previousValue: data.stats.previousTrainees || 0,
        },
        // ... other metrics
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return <KPIMetricsCards metrics={metrics} loading={loading} />;
}
```

### With Custom Click Handlers

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import KPIMetricsCards from './components/dashboard/KPIMetricsCards';

function Dashboard() {
  const navigate = useNavigate();

  const handleCardClick = (cardType) => {
    switch (cardType) {
      case 'enrollments':
        navigate('/admin/enrollments');
        break;
      case 'activeTrainees':
        navigate('/admin/users?role=candidate&status=active');
        break;
      case 'completionRate':
        navigate('/admin/reports?type=completion');
        break;
      case 'placementRate':
        navigate('/admin/reports?type=placement');
        break;
      case 'revenue':
        navigate('/admin/reports?type=financial');
        break;
      case 'alerts':
        navigate('/admin/alerts');
        break;
      default:
        break;
    }
  };

  return (
    <KPIMetricsCards 
      metrics={metrics} 
      onCardClick={handleCardClick}
    />
  );
}
```

## Props

### `metrics` (Object)
The metrics data object containing KPI values and trends.

```typescript
{
  enrollments: {
    total: number,           // Total enrollment count
    trend: number,           // Percentage change (e.g., 12.5 for 12.5%)
    comparisonPeriod: string, // e.g., "vs last month"
    previousValue: number,   // Previous period value for comparison
  },
  activeTrainees: {
    total: number,
    trend: number,
    comparisonPeriod: string,
    previousValue: number,
  },
  completionRate: {
    rate: number,            // Percentage (e.g., 78.5)
    trend: number,
    comparisonPeriod: string,
    previousRate: number,    // Previous period rate
  },
  placementRate: {
    rate: number,
    trend: number,
    comparisonPeriod: string,
    previousRate: number,
  },
  revenue: {
    total: number,           // Revenue amount
    trend: number,
    comparisonPeriod: string,
    previousValue: number,
    currency: string,        // Currency code (e.g., "USD", "EUR")
  },
  alerts: {
    total: number,           // Total alerts
    critical: number,        // Critical alert count
    warning: number,         // Warning alert count
    info: number,            // Info alert count
  },
}
```

### `loading` (Boolean)
Default: `false`

Shows loading skeleton when `true`. Useful for async data fetching.

```jsx
<KPIMetricsCards metrics={metrics} loading={isLoading} />
```

### `onCardClick` (Function)
Optional callback function invoked when a card is clicked.

```jsx
const handleCardClick = (cardType) => {
  console.log(`Card clicked: ${cardType}`);
  // Custom logic here
};

<KPIMetricsCards metrics={metrics} onCardClick={handleCardClick} />
```

## Card Types (cardType parameter)
- `'enrollments'` - Total Enrollments card
- `'activeTrainees'` - Active Trainees card
- `'completionRate'` - Completion Rate card
- `'placementRate'` - Placement Percentage card
- `'revenue'` - Revenue Summary card
- `'alerts'` - System Alerts card

## Styling & Customization

### Color Scheme
Each card has a predefined color scheme based on its type:
- **Enrollments**: Primary (Blue)
- **Active Trainees**: Info (Cyan)
- **Completion Rate**: Success (Green)
- **Placement Rate**: Secondary (Purple)
- **Revenue**: Warning (Orange)
- **Alerts**: Error (Red) if critical alerts exist, Gray otherwise

### Responsive Behavior
- **Mobile (xs)**: 1 card per row
- **Tablet (sm)**: 2 cards per row
- **Desktop (md)**: 3 cards per row
- **Large Desktop (lg)**: 6 cards per row

Grid configuration:
```jsx
<Grid item xs={12} sm={6} md={4} lg={2}>
```

### Hover Effects
- **Transform**: Slight lift effect (`translateY(-4px)`)
- **Shadow**: Elevated shadow on hover
- **Transition**: Smooth 0.3s transition

## Trend Calculation

The component automatically calculates trends if not provided:

```javascript
const calculateTrend = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};
```

### Trend Colors
- **Positive trends**: Green (Success color)
- **Negative trends**: Red (Error color)
- **No change**: Gray (Text secondary)

### Trend Icons
- **Upward trend**: `<TrendingUpIcon />`
- **Downward trend**: `<TrendingDownIcon />`
- **No change**: No icon displayed

## Backend API Integration

### Expected API Response Format

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalEnrollments": 1250,
      "previousEnrollments": 1112,
      "enrollmentTrend": 12.5,
      
      "activeTrainees": 850,
      "previousTrainees": 785,
      "traineesTrend": 8.3,
      
      "completionRate": 78.5,
      "previousCompletionRate": 74.6,
      "completionTrend": 5.2,
      
      "placementRate": 85.2,
      "previousPlacementRate": 82.1,
      "placementTrend": 3.8,
      
      "totalRevenue": 524000,
      "previousRevenue": 452800,
      "revenueTrend": 15.7,
      
      "totalAlerts": 12,
      "criticalAlerts": 2,
      "warningAlerts": 7,
      "infoAlerts": 3
    }
  }
}
```

### Backend Controller Example (Node.js/Express)

```javascript
const getDashboardMetrics = async (req, res) => {
  try {
    const currentMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // Fetch current month data
    const currentEnrollments = await Enrollment.count({
      where: {
        createdAt: {
          gte: currentMonth,
        },
      },
    });
    
    // Fetch previous month data
    const previousEnrollments = await Enrollment.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
    });
    
    // Calculate trend
    const enrollmentTrend = ((currentEnrollments - previousEnrollments) / previousEnrollments) * 100;
    
    // Fetch other metrics...
    
    res.json({
      success: true,
      data: {
        stats: {
          totalEnrollments: currentEnrollments,
          previousEnrollments,
          enrollmentTrend,
          // ... other metrics
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

## Performance Considerations

1. **Lazy Loading**: Consider lazy loading the component for large dashboards
2. **Memoization**: Use `React.memo` if parent re-renders frequently
3. **Data Caching**: Cache API responses to reduce server load
4. **Skeleton Loading**: Always show loading state during data fetch

## Accessibility

- All cards are keyboard navigable
- ARIA labels included for screen readers
- Proper color contrast ratios
- Focus indicators on interactive elements

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- React 18+
- Material-UI 5.x
- React Router 6.x
- @mui/icons-material

## Testing

### Unit Test Example

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import KPIMetricsCards from './KPIMetricsCards';

test('renders all KPI cards', () => {
  const metrics = {
    enrollments: { total: 1250, trend: 12.5, comparisonPeriod: 'vs last month', previousValue: 1112 },
    // ... other metrics
  };
  
  render(<KPIMetricsCards metrics={metrics} />);
  
  expect(screen.getByText('Total Enrollments')).toBeInTheDocument();
  expect(screen.getByText('1,250')).toBeInTheDocument();
  expect(screen.getByText('12.5%')).toBeInTheDocument();
});

test('calls onCardClick when card is clicked', () => {
  const handleClick = jest.fn();
  const metrics = { /* ... */ };
  
  render(<KPIMetricsCards metrics={metrics} onCardClick={handleClick} />);
  
  fireEvent.click(screen.getByText('Total Enrollments').closest('div'));
  
  expect(handleClick).toHaveBeenCalledWith('enrollments');
});
```

## Common Issues & Solutions

### Issue: Trends not calculating correctly
**Solution**: Ensure `previousValue` is provided in metrics data

### Issue: Cards not clickable
**Solution**: Verify `onCardClick` prop is passed or default routes exist

### Issue: Loading state stuck
**Solution**: Check that `loading` prop is properly toggled after data fetch

### Issue: Number formatting issues
**Solution**: Ensure numeric values are passed, not strings

## Future Enhancements

- [ ] Custom icon support per card
- [ ] Configurable card order
- [ ] Export to PDF/Excel
- [ ] Real-time WebSocket updates
- [ ] Comparison mode (YoY, QoQ)
- [ ] Drill-down charts on click
- [ ] Custom trend calculation formulas
- [ ] Dark mode support

## License

This component is part of the Labour Mobility Management System and is proprietary software.

## Support

For issues or questions, contact the development team or create an issue in the project repository.

---

**Last Updated**: November 2, 2025  
**Version**: 1.0.0  
**Author**: Development Team
