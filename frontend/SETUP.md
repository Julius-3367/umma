# Labour Mobility Frontend Setup Guide

## 🚀 Quick Start

This guide will help you get the Labour Mobility frontend application up and running with enhanced dashboards and demo data.

## 📋 Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (or yarn/pnpm)
- **Git**: For version control

## 🛠️ Installation Steps

### 1. Clone and Navigate
```bash
# If not already done
cd "Labour mobility/frontend"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Missing Dependencies
If you encounter issues with circular progress bars or other UI components:
```bash
npm install react-circular-progressbar@^2.1.0
```

### 4. Environment Configuration
Create a `.env` file in the frontend root directory:

```env
# Demo Mode (set to true for development)
VITE_DEMO_MODE=true

# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# App Configuration
VITE_APP_NAME="Labour Mobility Platform"
VITE_APP_VERSION="1.0.0"

# Feature Flags
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=false
```

### 5. Start Development Server
```bash
npm run dev
```

The application will start on `http://localhost:5173`

## 🎭 Demo Mode

The application includes comprehensive demo data and can run completely standalone without a backend.

### Demo User Credentials

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | admin@labormobility.com | admin123 | Full system access |
| **Candidate** | candidate@labormobility.com | candidate123 | Student portal |
| **Trainer** | trainer@labormobility.com | trainer123 | Course management |
| **Employer** | employer@labormobility.com | employer123 | Recruitment portal |
| **Broker** | broker@labormobility.com | broker123 | Referral management |
| **Recruiter** | recruiter@labormobility.com | recruiter123 | Placement coordination |

## 🏗️ Architecture Overview

### Dashboard Components
- **Admin Dashboard**: System management, user analytics, financial overview
- **Candidate Dashboard**: Course progress, attendance, assessments, certificates
- **Employer Dashboard**: Job postings, applications, interview management
- **Broker Dashboard**: Referral tracking, commission management
- **Trainer Dashboard**: Course management, student progress
- **Recruiter Dashboard**: Placement coordination, candidate matching

### Key Features
- ✅ Role-based authentication and routing
- ✅ Responsive design for all devices
- ✅ Interactive charts and analytics
- ✅ Real-time notifications
- ✅ Document management
- ✅ Progress tracking
- ✅ Commission and payment tracking
- ✅ System health monitoring

### Technology Stack
- **Framework**: React 19.1.1 with Vite
- **State Management**: Zustand for auth, local state for components
- **UI Components**: Headless UI, Heroicons, Material-UI
- **Styling**: Tailwind CSS 4.x
- **Charts**: Recharts
- **Forms**: React Hook Form with Yup validation
- **Routing**: React Router 7.x
- **Notifications**: Notistack

## 🎨 UI/UX Features

### Design System
- Modern card-based layouts
- Consistent color schemes
- Smooth animations and transitions
- Mobile-first responsive design
- Accessibility-compliant components

### Interactive Elements
- Circular progress indicators
- Interactive charts with tooltips
- Real-time data updates
- Drag-and-drop file uploads
- Advanced filtering and search

## 🔧 Development

### Available Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Project Structure
```
src/
├── api/                 # API services and mock data
├── components/          # Reusable UI components
├── layouts/            # Page layouts (AppLayout, AuthLayout)
├── pages/              # Route components
│   ├── auth/           # Authentication pages
│   ├── admin/          # Admin dashboard
│   ├── candidate/      # Candidate portal
│   ├── employer/       # Employer dashboard
│   ├── recruiter/      # Recruiter dashboard
│   ├── broker/         # Broker dashboard
│   └── ...
├── seed/               # Demo data and mock responses
├── store/              # Zustand stores
├── utils/              # Utility functions
└── App.jsx            # Main application component
```

### Adding New Features

1. **New Dashboard Section**: Create components in respective page directories
2. **New API Endpoint**: Add to `src/api/index.js` with demo data support
3. **New Demo Data**: Update `src/seed/demoData.js`
4. **New Route**: Add to `src/App.jsx` routing configuration

## 🚦 Troubleshooting

### Common Issues

**Issue**: `Cannot find module 'react-circular-progressbar'`
```bash
npm install react-circular-progressbar@^2.1.0
```

**Issue**: Dashboard not loading after login
- Check browser console for errors
- Verify demo credentials are correct
- Clear browser local storage: `localStorage.clear()`

**Issue**: Charts not displaying
- Ensure Recharts is installed: `npm install recharts@^3.3.0`
- Check browser console for chart-related errors

**Issue**: Tailwind styles not applying
- Verify `tailwind.config.js` configuration
- Restart development server: `npm run dev`

### Debug Mode
Enable debug logging by adding to your `.env`:
```env
VITE_DEBUG=true
```

## 🌐 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
```env
VITE_DEMO_MODE=false
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Deployment Platforms
- **Vercel**: Connect GitHub repository for automatic deployments
- **Netlify**: Drag and drop `dist` folder or connect repository
- **AWS S3 + CloudFront**: Upload `dist` folder to S3 bucket

## 📊 Features by Role

### Admin Dashboard
- System health monitoring
- User management
- Financial analytics
- Course performance metrics
- Real-time alerts and notifications

### Candidate Portal
- Course progress tracking
- Attendance records
- Assessment results
- Certificate downloads
- Document uploads

### Employer Dashboard
- Job posting management
- Application tracking
- Interview scheduling
- Candidate analytics
- Performance metrics

### Broker Dashboard
- Referral management
- Commission tracking
- Monthly performance analytics
- Payment history
- Conversion rate monitoring

## 🔐 Security Notes

- Demo mode uses mock authentication
- Sensitive data should not be used in demo mode
- Production deployment requires proper backend authentication
- API keys and secrets should be stored in environment variables

## 🤝 Support

For technical support or questions:
1. Check this documentation
2. Review browser console for errors
3. Check network tab for failed API requests
4. Verify environment configuration

## 📱 Mobile Support

All dashboards are fully responsive and optimized for:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktop (1024px+)
- Large screens (1440px+)

Features include:
- Collapsible navigation
- Touch-friendly controls
- Optimized chart displays
- Stack-friendly layouts

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Demo Mode**: ✅ Enabled by default