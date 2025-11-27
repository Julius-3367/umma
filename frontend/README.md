# Labour Mobility Management System - Frontend

A production-ready Material UI frontend for the Labour Mobility SaaS platform built with React, Vite, Material UI, and Redux Toolkit.

## 🚀 Features

- **Material UI Design System**: Professional enterprise UI with responsive design
- **Role-Based Access Control**: Support for Admin, Trainer, Candidate, Recruiter, Broker, and Employer roles
- **Redux Toolkit State Management**: Centralized state with RTK Query for API calls
- **Protected Routes**: Authentication and authorization with role-based navigation
- **Data Visualization**: Charts and graphs using Recharts
- **File Upload**: Drag & drop file uploads with progress tracking
- **Responsive Design**: Mobile-first approach with Material UI breakpoints
- **Accessibility**: WCAG compliant with keyboard navigation support

## 🛠️ Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Material UI (MUI)** - Component library
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Recharts** - Data visualization
- **Notistack** - Toast notifications
- **JWT Decode** - Token parsing

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd labour-mobility/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_AUTH_REFRESH_ENDPOINT=/auth/refresh
   VITE_DEMO_MODE=false
   ```

## 🚀 Development

### Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_AUTH_REFRESH_ENDPOINT` | Token refresh endpoint | `/auth/refresh` |
| `VITE_DEMO_MODE` | Enable demo mode with mock data | `false` |

## 🏗️ Project Structure

```
src/
├── api/                    # API configuration and services
│   └── axios.js            # Axios instance with interceptors
├── app/                    # Redux store configuration
│   └── store.js            # Store setup
├── components/             # Reusable components
│   ├── layout/            # Layout components
│   │   ├── AppLayout.jsx  # Main app layout
│   │   ├── Topbar.jsx     # Top navigation bar
│   │   └── Sidebar.jsx    # Side navigation
│   ├── ui/                # UI components
│   │   ├── Loader.jsx     # Loading spinner
│   │   ├── ConfirmDialog.jsx # Confirmation dialog
│   │   └── FileUploader.jsx # File upload component
│   └── tables/            # Data table components
│       └── AdminTable.jsx # MUI DataGrid wrapper
├── features/              # Redux feature slices
│   ├── auth/             # Authentication
│   ├── users/            # User management
│   └── candidates/       # Candidate management
├── pages/                # Page components
│   ├── Auth/            # Authentication pages
│   ├── Admin/           # Admin pages
│   ├── Candidate/       # Candidate pages
│   ├── Recruiter/       # Recruiter pages
│   ├── Broker/          # Broker pages
│   ├── Trainer/         # Trainer pages
│   └── Employer/        # Employer pages
├── theme/               # Material UI theme
│   └── theme.js         # Theme configuration
├── utils/               # Utility functions
│   ├── roleUtils.js     # Role-based utilities
│   └── dateUtils.js     # Date formatting utilities
└── App.jsx              # Main app component
```

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access
- **Trainer**: Course and attendance management
- **Candidate**: Profile and document management
- **Recruiter**: Candidate submission, tracking, and placement management
- **Broker**: Commission and candidate management
- **Employer**: Job management and interview scheduling

### Protected Routes
Routes are protected based on user roles:
```jsx
<ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
  <AdminDashboard />
</ProtectedRoute>
```

### Token Management
- Access tokens for API authentication
- Refresh tokens for token renewal
- Automatic token refresh on 401 responses
- Logout on refresh failure

## 📊 Data Visualization

### Charts Available
- Line charts for trends over time
- Bar charts for comparisons
- Pie charts for distribution
- Area charts for cumulative data

### Example Usage
```jsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

<LineChart data={data}>
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="value" stroke="#8884d8" />
</LineChart>
```

## 🎨 Theming

### Custom Theme
The application uses a custom Material UI theme with:
- Primary color: Teal (#00695c)
- Secondary color: Indigo (#3f51b5)
- Professional typography
- Custom component styles
- Responsive breakpoints

### Theme Customization
Edit `src/theme/theme.js` to modify:
- Color palette
- Typography
- Component styles
- Spacing and shadows

## 📱 Responsive Design

### Breakpoints
- **xs**: 0px and up
- **sm**: 600px and up
- **md**: 900px and up
- **lg**: 1200px and up
- **xl**: 1536px and up

### Mobile Features
- Collapsible sidebar
- Touch-friendly interactions
- Responsive data tables
- Mobile-optimized forms

## 🔧 API Integration

### Axios Configuration
```javascript
// Automatic token attachment
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Error Handling
- Global error interceptor
- Token refresh on 401
- User-friendly error messages
- Network error handling

## 🧪 Testing

### Demo Mode
Set `VITE_DEMO_MODE=true` to enable demo mode with mock data.

### Demo Credentials
- **Admin**: admin@labourmobility.com / admin123
- **Trainer**: trainer@labourmobility.com / trainer123
- **Candidate**: candidate@labourmobility.com / candidate123

## 🚀 Deployment

### Build Process
```bash
npm run build
```

### Environment Variables for Production
```env
VITE_API_BASE_URL=https://api.labourmobility.com/api
VITE_AUTH_REFRESH_ENDPOINT=/auth/refresh
VITE_DEMO_MODE=false
```

### Docker Deployment
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📝 Development Notes

### Code Quality
- ESLint configuration for code quality
- Prettier for code formatting
- Consistent naming conventions
- Comprehensive error handling

### Performance
- Code splitting with React.lazy
- Memoization for expensive components
- Optimized bundle size
- Lazy loading for routes

### Accessibility
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Focus management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for Labour Mobility Management**