console.log('🚀 Main.jsx loading...');

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './app/store';

console.log('📦 Imports loaded, store:', store ? 'OK' : 'MISSING');

// Import i18n configuration
import './i18n/config';

console.log('🌍 i18n loaded');

// Import theme provider
import ThemeProvider from './providers/ThemeProvider.jsx';
import { theme } from './theme/theme.js';

console.log('🎨 Theme loaded:', theme ? 'OK' : 'MISSING');

// Import main app component
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

console.log('📱 App component loaded:', App ? 'OK' : 'MISSING');
console.log('🛡️ ErrorBoundary loaded:', ErrorBoundary ? 'OK' : 'MISSING');

// Import Tailwind CSS (ensure it loads first)
import './index.css';

console.log('💅 Styles imported');

/**
 * Enhanced App Wrapper
 */
const AppWrapper = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            autoHideDuration={5000}
            preventDuplicate
            dense
            style={{
              fontFamily: theme.typography.fontFamily,
            }}
          >
            <App />
          </SnackbarProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

/**
 * Application initialization
 */
const initializeApp = async () => {
  console.log('🚀 Initializing UMSL Labor Mobility Platform...');

  // Initialize demo mode if environment variable is set
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    console.log('🎭 Running in demo mode with mock data');
  }

  try {
    console.log('📦 Loading application...');

    // Get root element
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('❌ Root element not found!');
      throw new Error('Root element not found');
    }

    console.log('✅ Root element found');

    // Create React root and render app
    const root = ReactDOM.createRoot(rootElement);

    console.log('🎯 Rendering app...');

    root.render(
      <React.StrictMode>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <AppWrapper />
          </PersistGate>
        </Provider>
      </React.StrictMode>
    );

    console.log('✅ App initialized successfully');

    // Add global error boundary for unhandled errors
    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled promise rejection:', event.reason);
    });

    window.addEventListener('error', event => {
      console.error('Global error:', event.error);
    });
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    // Display error in DOM if React fails to render
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif;">
          <div style="text-align: center; padding: 2rem;">
            <h1 style="color: #ef4444; margin-bottom: 1rem;">Failed to Load Application</h1>
            <p style="color: #666; margin-bottom: 1rem;">${error.message}</p>
            <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #1e40af; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Start the application
initializeApp();
