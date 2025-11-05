import React from 'react';
import { Box, Container, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

const AuthBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#ffffff',
  backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(120, 190, 33, 0.03) 0%, transparent 50%)',
  position: 'relative',
}));

const AuthContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  position: 'relative',
  zIndex: 1,
}));

const AuthLayout = ({ children }) => {
  const theme = useTheme();
  
  return (
    <AuthBackground>
      <AuthContainer maxWidth="lg" component="main">
        <Box sx={{ width: '100%', maxWidth: 480 }}>
          {children}
        </Box>
      </AuthContainer>
    </AuthBackground>
  );
};

export default AuthLayout;
