# Authentication Testing Guide

## Overview
The UMSL platform includes a complete authentication system with login, registration, and role-based access control. This guide explains how to test the authentication functionality.

## Demo Mode
The application is currently running in demo mode (`VITE_DEMO_MODE=true`), which allows testing without a backend API.

## Demo Credentials

Use these credentials to test different user roles:

### Admin Account
- **Email**: admin@umsl.edu
- **Password**: admin123
- **Role**: Administrator
- **Expected Redirect**: /admin/dashboard

### Trainer Account  
- **Email**: trainer@umsl.edu
- **Password**: trainer123
- **Role**: Instructor/Trainer
- **Expected Redirect**: /trainer/dashboard

### Candidate Account
- **Email**: candidate@umsl.edu
- **Password**: candidate123
- **Role**: Student/Candidate
- **Expected Redirect**: /candidate/dashboard

### Recruiter Account
- **Email**: recruiter@umsl.edu
- **Password**: recruiter123
- **Role**: Recruiter
- **Expected Redirect**: /recruiter/dashboard

### Broker Account
- **Email**: broker@umsl.edu
- **Password**: broker123
- **Role**: Broker
- **Expected Redirect**: /broker/dashboard

## Testing Authentication Flow

### 1. Access Authentication Test Page
Visit `/auth-test` to see the authentication status and available test credentials.

### 2. Test Login Process
1. Go to `/login`
2. Enter any of the demo credentials above
3. Click "Sign In"
4. Verify redirection to role-specific dashboard
5. Check that navigation menu shows correct role-based options

### 3. Test Registration Process
1. Go to `/register`
2. Fill out the registration form
3. Select appropriate role from dropdown
4. Submit form
5. Verify auto-login and redirection (if enabled)

### 4. Test Role-Based Access
1. Login with different roles
2. Verify access to role-specific dashboards
3. Test navigation restrictions
4. Verify logout functionality

### 5. Test Session Persistence
1. Login and navigate around
2. Refresh the page
3. Verify authentication persists
4. Test logout clears session

## Authentication Features

### ✅ Login Features
- Email/password authentication
- Form validation with real-time feedback
- Role-based redirection after login
- Error handling with user-friendly messages
- Remember me functionality (persistent sessions)

### ✅ Registration Features
- Complete user registration form
- Role selection during registration
- Password confirmation validation
- Email format validation
- Auto-login after registration (configurable)
- Success/error notifications

### ✅ Security Features
- Protected routes with role-based access control
- Automatic token refresh
- Session persistence across page refreshes
- Secure logout with session cleanup
- Input sanitization and validation

### ✅ User Experience
- Loading states during authentication
- Clear error messages
- Responsive design for all devices
- Accessible form controls
- Intuitive navigation flow

## Configuration Options

### Environment Variables
```env
VITE_DEMO_MODE=true                    # Enable demo mode for testing
VITE_AUTH_AUTO_LOGIN_AFTER_REGISTER=true  # Auto-login after registration
VITE_API_BASE_URL=http://localhost:5000/api  # API endpoint
```

### Demo Mode vs Production Mode
- **Demo Mode**: Uses mock data and demo users for testing
- **Production Mode**: Connects to real API endpoints
- **Auto-switching**: Service automatically detects mode from environment

## Troubleshooting

### Common Issues

1. **Login Not Working**
   - Verify demo mode is enabled
   - Check credentials match exactly (case-sensitive)
   - Clear browser cache and cookies

2. **Registration Not Working**
   - Ensure all required fields are filled
   - Verify password confirmation matches
   - Check email format is valid

3. **Redirection Issues**
   - Verify user role is set correctly
   - Check that role-based routes exist in App.jsx
   - Clear localStorage and try again

4. **Session Not Persisting**
   - Check that localStorage is enabled in browser
   - Verify Redux persistence is configured correctly
   - Clear application data and re-login

### Debug Tools

1. **Browser Developer Tools**
   - Check Console for authentication errors
   - Monitor Network tab for API calls
   - Inspect localStorage for auth state

2. **Authentication Test Page**
   - Visit `/auth-test` to see current auth status
   - Test different credentials
   - View system configuration

3. **Redux DevTools**
   - Monitor auth state changes
   - Check action payloads
   - Verify reducer behavior

## API Integration

When switching to production mode, ensure your backend API supports:

- `POST /auth/login` - User login
- `POST /auth/register` - User registration  
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user profile

Expected response formats are documented in the auth service files.

## Next Steps

1. **Backend Integration**: Connect to real authentication API
2. **OAuth Integration**: Add Google/Facebook login options
3. **Email Verification**: Implement email confirmation flow
4. **Password Reset**: Add forgot password functionality
5. **Security Audit**: Review and enhance security measures

The authentication system is now ready for testing and production deployment! 🎉
