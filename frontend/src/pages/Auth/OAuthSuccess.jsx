import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { setAuth } from '../../features/auth/authSlice';
import { getUserProfile } from '../../features/auth/authThunks';
import { ROLES } from '../../utils/roleUtils';

const roleRedirectMap = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.TRAINER]: '/trainer/dashboard',
  [ROLES.CANDIDATE]: '/candidate/dashboard',
  [ROLES.BROKER]: '/broker/dashboard',
  [ROLES.RECRUITER]: '/recruiter/dashboard',
  [ROLES.EMPLOYER]: '/recruiter/dashboard',
};

const OAuthSuccess = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, accessToken } = useSelector((state) => state.auth);

  useEffect(() => {
    const tokenFromQuery = searchParams.get('accessToken');

    if (!tokenFromQuery) {
      navigate('/login', { replace: true });
      return;
    }

    const initializeSession = async () => {
      try {
        if (!accessToken) {
          dispatch(setAuth({ accessToken: tokenFromQuery }));
        }

        const profileResult = await dispatch(getUserProfile()).unwrap();
        const resolvedUser = profileResult?.data?.user || profileResult?.user || profileResult;

        const roleKey = resolvedUser?.role?.toLowerCase();
        const fallbackPath = '/dashboard';
        const destination = roleRedirectMap[roleKey] || fallbackPath;
        navigate(destination, { replace: true });
      } catch (error) {
        console.error('OAuth initialization failed:', error);
        navigate('/login', { replace: true });
      }
    };

    initializeSession();
  }, [dispatch, searchParams, navigate, accessToken]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        textAlign: 'center',
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="h6" color="text.secondary">
        Signing you in...
      </Typography>
    </Box>
  );
};

export default OAuthSuccess;
