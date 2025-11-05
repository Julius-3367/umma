import React from 'react';
import ReactDOM from 'react-dom/client';

// Minimal test to see what's breaking
const TestApp = () => {
  return (
    <div style={{ 
      padding: '50px', 
      fontFamily: 'Arial', 
      background: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1>✅ React is Working!</h1>
      <p>If you see this, React is rendering correctly.</p>
      <p>The issue is with one of the imports in main.jsx</p>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<TestApp />);
  console.log('✅ Minimal React app rendered successfully');
}
