# API Endpoint Mappings

This document outlines the expected API endpoints for the Labour Mobility frontend and provides fallback configurations when backend endpoints are not available.

## 🔐 Authentication Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/auth/login` | POST | User login | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| `/auth/refresh` | POST | Refresh access token | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `/auth/logout` | POST | User logout | `{ refreshToken }` | `{ message }` |
| `/auth/profile` | GET | Get user profile | - | `{ user }` |

## 👥 User Management Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/users` | GET | Get all users | Query: `{ page, limit, search, role }` | `{ users, pagination }` |
| `/users/:id` | GET | Get user by ID | - | `{ user }` |
| `/users` | POST | Create user | `{ email, password, firstName, lastName, role }` | `{ user }` |
| `/users/:id` | PUT | Update user | `{ email, firstName, lastName, role }` | `{ user }` |
| `/users/:id` | DELETE | Delete user | - | `{ message }` |

## 👤 Candidate Management Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/candidates` | GET | Get all candidates | Query: `{ page, limit, search, status }` | `{ candidates, pagination }` |
| `/candidates/:id` | GET | Get candidate by ID | - | `{ candidate }` |
| `/candidates` | POST | Create candidate | `{ name, email, phone, documents }` | `{ candidate }` |
| `/candidates/:id` | PUT | Update candidate | `{ name, email, phone, status }` | `{ candidate }` |
| `/candidates/:id` | DELETE | Delete candidate | - | `{ message }` |
| `/candidates/:id/docs` | POST | Upload document | `FormData` | `{ document }` |
| `/candidates/:id/documents/:docId` | GET | Download document | - | `Blob` |

## 📚 Course Management Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/courses` | GET | Get all courses | Query: `{ page, limit, search, status }` | `{ courses, pagination }` |
| `/courses/:id` | GET | Get course by ID | - | `{ course }` |
| `/courses` | POST | Create course | `{ name, description, duration, maxStudents }` | `{ course }` |
| `/courses/:id` | PUT | Update course | `{ name, description, duration, maxStudents }` | `{ course }` |
| `/courses/:id` | DELETE | Delete course | - | `{ message }` |
| `/courses/:id/enroll` | POST | Enroll student | `{ studentId }` | `{ enrollment }` |
| `/courses/:id/attendance` | GET | Get attendance | - | `{ attendance }` |
| `/courses/:id/attendance` | POST | Mark attendance | `{ studentId, present }` | `{ attendance }` |

## 📊 Dashboard & Reports Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/dashboard` | GET | Get dashboard data | - | `{ stats, charts, recentActivity }` |
| `/reports/placements` | GET | Get placement reports | Query: `{ startDate, endDate }` | `{ data }` |
| `/reports/revenue` | GET | Get revenue reports | Query: `{ startDate, endDate }` | `{ data }` |
| `/reports/export` | GET | Export reports | Query: `{ type, format, startDate, endDate }` | `Blob` |

## 🔔 Notifications Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/notifications` | GET | Get user notifications | Query: `{ page, limit }` | `{ notifications, unreadCount }` |
| `/notifications/:id` | PUT | Mark notification as read | - | `{ notification }` |
| `/notifications` | DELETE | Clear all notifications | - | `{ message }` |

## 🏢 Recruiter & Broker Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/recruiters` | GET | Get all recruiters | Query: `{ page, limit, search }` | `{ recruiters, pagination }` |
| `/recruiters/:id/candidates` | GET | Get recruiter candidates | - | `{ candidates }` |
| `/recruiters/:id/submissions` | GET | Get recruiter submissions | - | `{ submissions }` |
| `/brokers` | GET | Get all brokers | Query: `{ page, limit, search }` | `{ brokers, pagination }` |
| `/brokers/:id/commissions` | GET | Get broker's commissions | - | `{ commissions }` |

## 💼 Recruiter Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/recruiters/offers` | GET | Get job offers | Query: `{ page, limit, status }` | `{ offers, pagination }` |
| `/recruiters/offers` | POST | Create job offer | `{ title, description, requirements, salary }` | `{ offer }` |
| `/recruiters/interviews` | GET | Get interviews | Query: `{ page, limit, status }` | `{ interviews, pagination }` |
| `/recruiters/interviews` | POST | Schedule interview | `{ candidateId, date, time, location }` | `{ interview }` |
| `/recruiters/placements` | GET | Get placements | Query: `{ page, limit, status }` | `{ placements, pagination }` |

## 🔧 Fallback Configuration

### Demo Mode
When `VITE_DEMO_MODE=true`, the frontend uses mock data instead of API calls:

```javascript
// In src/api/axios.js
if (import.meta.env.VITE_DEMO_MODE === 'true') {
  // Use mock responses
  return mockApiResponses.login(credentials);
}
```

### Missing Endpoints
If any endpoint is not available in the backend, update the following files:

1. **API Service Files**: Add fallback logic in service files
2. **Mock Data**: Update `src/seed/demoData.js` with additional mock responses
3. **Error Handling**: Add graceful degradation in components

### Environment Variables
```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_AUTH_REFRESH_ENDPOINT=/auth/refresh

# Demo Mode
VITE_DEMO_MODE=false

# Feature Flags
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_FILE_UPLOADS=true
VITE_ENABLE_REPORTS=true
```

## 📝 Implementation Notes

### Error Handling
- All API calls should handle network errors gracefully
- Show user-friendly error messages
- Implement retry logic for failed requests
- Log errors for debugging

### Authentication
- Store tokens securely (prefer memory over localStorage)
- Implement automatic token refresh
- Handle token expiration gracefully
- Clear tokens on logout

### Data Validation
- Validate API responses against expected schemas
- Handle malformed responses
- Provide fallback data when possible
- Show loading states during API calls

### Performance
- Implement request caching where appropriate
- Use pagination for large datasets
- Optimize image and file uploads
- Implement lazy loading for routes

## 🚀 Next Steps

1. **Backend Integration**: Update API endpoints to match backend implementation
2. **Error Handling**: Add comprehensive error handling for all API calls
3. **Testing**: Add unit tests for API service functions
4. **Documentation**: Update API documentation as endpoints are implemented
5. **Monitoring**: Add API call monitoring and analytics
