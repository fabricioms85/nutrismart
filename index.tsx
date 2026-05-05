import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("FATAL: Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

console.log("Root element found, mounting React app...");

const root = ReactDOM.createRoot(rootElement);
console.log("Root created");

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
        <Analytics />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);