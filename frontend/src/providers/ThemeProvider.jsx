import React, { useEffect, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { theme, rtlTheme, darkTheme } from '../theme/theme';
// RTL plugin will be conditionally imported when needed

/**
 * Theme Provider with comprehensive style loading and RTL support
 * Ensures all Material-UI styles are loaded before app initialization
 */
const ThemeProvider = ({ children }) => {
  const [isStylesLoaded, setIsStylesLoaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [isRTL, setIsRTL] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme loading and initialization
  useEffect(() => {
    const loadStyles = async () => {
      // Ensure theme is properly initialized
      console.log('🎨 Loading UMSL Labor Mobility Theme...');

      // Pre-load critical theme values
      const themeReady = new Promise(resolve => {
        // Wait for next tick to ensure theme is fully constructed
        setTimeout(() => {
          console.log('✅ Theme loaded:', {
            primary: theme.palette.primary.main,
            secondary: theme.palette.secondary.main,
            breakpoints: theme.breakpoints.values,
            typography: theme.typography.fontFamily,
          });
          resolve();
        }, 100);
      });

      // Wait for DOM to be ready
      const domReady = new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', resolve, { once: true });
        }
      });

      // Wait for both conditions
      await Promise.all([themeReady, domReady]);

      console.log('🚀 All styles loaded, initializing app...');
      setIsStylesLoaded(true);
    };

    loadStyles();
  }, []);

  // Theme switching utilities
  const switchTheme = (options = {}) => {
    const { rtl = isRTL, dark = isDarkMode } = options;

    let newTheme = theme;

    if (dark && rtl) {
      newTheme = { ...darkTheme, direction: 'rtl' };
    } else if (dark) {
      newTheme = darkTheme;
    } else if (rtl) {
      newTheme = rtlTheme;
    }

    setCurrentTheme(newTheme);
    setIsRTL(rtl);
    setIsDarkMode(dark);

    // Update document direction
    document.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');

    console.log('🎨 Theme switched:', { rtl, dark });
  };

  // Expose theme controls to window for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.themeControls = {
        switchToRTL: () => switchTheme({ rtl: true }),
        switchToLTR: () => switchTheme({ rtl: false }),
        switchToDark: () => switchTheme({ dark: true }),
        switchToLight: () => switchTheme({ dark: false }),
        getCurrentTheme: () => currentTheme,
        getThemeInfo: () => ({
          isRTL,
          isDarkMode,
          primaryColor: currentTheme.palette.primary.main,
          secondaryColor: currentTheme.palette.secondary.main,
        }),
      };

      console.log('🛠️ Theme controls available in window.themeControls');
    }
  }, [currentTheme, isRTL, isDarkMode]);

  // Loading screen component
  const LoadingScreen = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <div
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#3B82F6',
            marginBottom: '8px',
          }}
        >
          UMSL Labor Mobility
        </div>
        <div
          style={{
            fontSize: '14px',
            color: '#64748b',
          }}
        >
          Loading theme and styles...
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  // Don't render children until styles are loaded
  if (!isStylesLoaded) {
    return <LoadingScreen />;
  }

  return (
    <StyledEngineProvider injectFirst>
      <MuiThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </StyledEngineProvider>
  );
};

// Higher-order component for theme access
export const withTheme = Component => {
  return React.forwardRef((props, ref) => <Component {...props} ref={ref} />);
};

// Hook for accessing theme utilities - moved inside component context
export const useThemeUtils = () => {
  return {
    switchTheme: window.themeControls?.switchToRTL || (() => {}),
    getCurrentTheme: () => window.themeControls?.getCurrentTheme() || theme,
    getThemeInfo: () =>
      window.themeControls?.getThemeInfo() || {
        isRTL: false,
        isDarkMode: false,
      },
  };
};

export default ThemeProvider;
