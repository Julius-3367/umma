import React, { useEffect, useState, Suspense } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile, logoutUser } from './features/auth/authThunks';
import { selectCurrentUser, selectIsAuthenticated } from './features/auth/authSlice';

// Auth Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';

// Dashboard Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import CreateEditUser from './pages/admin/CreateEditUser';
import AdminCourses from './pages/admin/Courses';
import AdminCreateCourse from './pages/admin/CreateCourse';
import AdminEnrollments from './pages/admin/Enrollments';
import AdminCompanies from './pages/admin/Companies';
import AdminCandidateDetails from './pages/admin/CandidateDetails';
import AdminCandidates from './pages/admin/Candidates';
import CreateEditCompany from './pages/admin/CompanyForm';
import CompanyDetails from './pages/admin/CompanyDetails';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import AppealsManagement from './pages/admin/AppealsManagement';
import CertificateManagement from './pages/admin/CertificateManagement';
import VettingDashboard from './pages/admin/VettingDashboard';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CandidateCourses from './pages/candidate/MyCourses';
import CandidateDocuments from './pages/candidate/Documents';
import CandidateAttendance from './pages/candidate/AttendancePage';
import CandidateAssessments from './pages/candidate/AssessmentsPage';
import CandidateCertificates from './pages/candidate/CertificatesPage';
import CandidateProfile from './pages/candidate/ProfileSettings';
import CandidateCourseDetails from './pages/candidate/CourseDetails';
import PlacementPage from './pages/candidate/PlacementPage';
import AdminCourseDetails from './pages/admin/CourseDetails';
import CandidateCalendar from './pages/candidate/Calendar';
import CandidateNotifications from './pages/candidate/Notifications';
import TrainerDashboard from './pages/trainer/Dashboard';
import TrainerAttendance from './pages/trainer/Attendance';
import RecruiterDashboard from './pages/recruiter/Dashboard';
import RecruiterCandidates from './pages/recruiter/Candidates';
import RecruiterPlacements from './pages/recruiter/Placements';
import RecruiterCompanies from './pages/recruiter/Companies';
import RecruiterReports from './pages/recruiter/Reports';
import BrokerDashboard from './pages/broker/Dashboard';

// Lazy-loaded trainer components
const MyCourses = React.lazy(() => import('./pages/trainer/MyCourses'));
const CourseStudents = React.lazy(() => import('./pages/trainer/CourseStudents'));
const CourseAttendance = React.lazy(() => import('./pages/trainer/CourseAttendance'));
const CourseAssessments = React.lazy(() => import('./pages/trainer/CourseAssessments'));
const TrainerStudents = React.lazy(() => import('./pages/trainer/TrainerStudents'));
const TrainerAssessments = React.lazy(() => import('./pages/trainer/TrainerAssessments'));
const TrainerSchedule = React.lazy(() => import('./pages/trainer/TrainerSchedule'));

// Layout Components
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Role constants
const ROLES = {
  ADMIN: 'admin',
  CANDIDATE: 'candidate',
  TRAINER: 'trainer',
  BROKER: 'broker',
  EMPLOYER: 'employer',
  RECRUITER: 'recruiter',
};

// Role-based dashboard mapping
const getDashboardComponent = role => {
  switch (role?.toLowerCase()) {
    case ROLES.ADMIN:
      return AdminDashboard;
    case ROLES.CANDIDATE:
      return CandidateDashboard;
    case ROLES.TRAINER:
      return TrainerDashboard;
    case ROLES.BROKER:
      return BrokerDashboard;
    case ROLES.RECRUITER:
    case ROLES.EMPLOYER:
      return RecruiterDashboard;
    default:
      return () => <Navigate to="/login" replace />;
  }
};

/**
 * Loading Component - Material-UI themed
 */
const LoadingScreen = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress
          size={64}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
            mb: 2,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 500,
            mb: 1,
          }}
        >
          UMSL Labor Mobility
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
          }}
        >
          Loading your dashboard...
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * Main App Component
 */
const App = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsInitialized(true);
    } else if (isAuthenticated && !user) {
      // If authenticated but no user data, fetch profile
      const fetchUserProfile = async () => {
        try {
          await dispatch(getUserProfile()).unwrap();
        } catch (error) {
          dispatch(logoutUser());
          navigate('/login');
        } finally {
          setIsInitialized(true);
        }
      };
      fetchUserProfile();
    } else {
      setIsInitialized(true);
    }
  }, [dispatch, isAuthenticated, user, navigate]);

  // Debug logging
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, user });
  }, [isAuthenticated, user]);

  // Redirect authenticated users away from auth pages (except landing page)
  useEffect(() => {
    console.log('Checking route protection for path:', location.pathname);
    if (
      isAuthenticated &&
      user &&
      (location.pathname === '/login' || location.pathname === '/register')
    ) {
      const userRole = user.role?.toLowerCase() || 'candidate';
      console.log('Redirecting to dashboard for role:', userRole);
      navigate(`/dashboard/${userRole}`, { replace: true });
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  // Show loading screen while checking authentication
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={<LandingPage />}
        />
        <Route
          path="/login"
          element={
            isAuthenticated && user ? (
              <Navigate
                to={`/dashboard/${user.role?.toLowerCase() || 'candidate'}`}
                replace
              />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated && user ? (
              <Navigate
                to={`/dashboard/${user.role?.toLowerCase() || 'candidate'}`}
                replace
              />
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <div>Forgot Password Page</div>
            )
          }
        />
        <Route
          path="/reset-password"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <div>Reset Password Page</div>
            )
          }
        />
        <Route
          path="/verify-email"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <div>Verify Email Page</div>
            )
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard/:role"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardRouter />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Legacy dashboard route - redirect to role-specific dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {isAuthenticated && user ? (
                <Navigate
                  to={`/dashboard/${user.role?.toLowerCase() || 'candidate'}`}
                  replace
                />
              ) : (
                <Navigate to="/login" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* Individual role routes for backward compatibility */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AppLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="users/new" element={<CreateEditUser />} />
                  <Route path="users/:id" element={<CreateEditUser />} />
                  <Route path="users/:id/edit" element={<CreateEditUser />} />
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="courses/:courseId" element={<AdminCourseDetails />} />
                  <Route path="courses/new" element={<AdminCreateCourse />} />
                  <Route path="courses/:id/edit" element={<AdminCreateCourse />} />
                  <Route path="enrollments" element={<AdminEnrollments />} />
                  <Route path="candidates" element={<AdminCandidates />} />
                  <Route path="candidates/:id" element={<AdminCandidateDetails />} />
                  <Route path="companies" element={<AdminCompanies />} />
                  <Route path="companies/new" element={<CreateEditCompany />} />
                  <Route path="companies/:companyId" element={<CompanyDetails />} />
                  <Route path="companies/:companyId/edit" element={<CreateEditCompany />} />
                  <Route path="attendance" element={<AttendanceManagement />} />
                  <Route path="appeals" element={<AppealsManagement />} />
                  <Route path="certificates" element={<CertificateManagement />} />
                  <Route path="vetting" element={<VettingDashboard />} />
                  <Route path="companies" element={<AdminCompanies />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidate/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CANDIDATE]}>
              <AppLayout>
                <Routes>
                  <Route path="dashboard" element={<CandidateDashboard />} />
                  <Route path="courses" element={<CandidateCourses />} />
                  <Route path="courses/:courseId" element={<CandidateCourseDetails />} />
                  <Route path="documents" element={<CandidateDocuments />} />
                  <Route path="attendance" element={<CandidateAttendance />} />
                  <Route path="assessments" element={<CandidateAssessments />} />
                  <Route path="certificates" element={<CandidateDocuments />} />
                  <Route path="placement" element={<PlacementPage />} />
                  <Route path="jobs" element={<PlacementPage />} />
                  <Route path="profile" element={<CandidateProfile />} />
                  <Route path="calendar" element={<CandidateCalendar />} />
                  <Route path="notifications" element={<CandidateNotifications />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/trainer/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.TRAINER]}>
              <AppLayout>
                <Suspense fallback={
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                  </Box>
                }>
                  <Routes>
                    <Route path="dashboard" element={<TrainerDashboard />} />
                    <Route path="attendance" element={<TrainerAttendance />} />
                    <Route path="my-courses" element={<MyCourses />} />
                    <Route path="students" element={<TrainerStudents />} />
                    <Route path="assessments" element={<TrainerAssessments />} />
                    <Route path="schedule" element={<TrainerSchedule />} />
                    <Route path="courses/:courseId/students" element={<CourseStudents />} />
                    <Route path="courses/:courseId/attendance" element={<CourseAttendance />} />
                    <Route path="courses/:courseId/assessments" element={<CourseAssessments />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.RECRUITER]}>
              <AppLayout>
                <Routes>
                  <Route index element={<RecruiterDashboard />} />
                  <Route path="dashboard" element={<RecruiterDashboard />} />
                  <Route path="candidates" element={<RecruiterCandidates />} />
                  <Route path="placements" element={<RecruiterPlacements />} />
                  <Route path="companies" element={<RecruiterCompanies />} />
                  <Route path="reports" element={<RecruiterReports />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/broker/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.BROKER]}>
              <AppLayout>
                <BrokerDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYER]}>
              <AppLayout>
                <RecruiterDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Box>
  );
};

/**
 * Dashboard Router Component
 * Routes to the appropriate dashboard based on user role
 */
const DashboardRouter = () => {
  const { user } = useSelector((state) => state.auth);
  const { role: urlRole } = useParams();

  const normalizeRoleKey = (value) => {
    if (!value) return value;
    const lower = value.toLowerCase();
    return lower === 'agent' ? 'recruiter' : lower;
  };

  const rawRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const userRole = normalizeRoleKey(rawRole);
  const normalizedUrlRole = normalizeRoleKey(urlRole);

  // If URL role doesn't match user role, redirect to correct dashboard
  if (normalizedUrlRole && normalizedUrlRole !== userRole) {
    return <Navigate to={`/dashboard/${userRole}`} replace />;
  }

  // Get the appropriate dashboard component
  const DashboardComponent = getDashboardComponent(userRole);

  return <DashboardComponent />;
};

export default App;
