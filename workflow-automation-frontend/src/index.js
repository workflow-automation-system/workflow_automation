import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Suppress ResizeObserver loop errors (benign warnings in browsers like Chrome)
const isResizeObserverError = (msg) =>
  typeof msg === 'string' &&
  (msg.includes('ResizeObserver'));

window.addEventListener('error', (e) => {
  if (isResizeObserverError(e.message)) {
    e.stopImmediatePropagation();
    e.stopPropagation();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (isResizeObserverError(e.reason?.message)) {
    e.stopImmediatePropagation();
    e.stopPropagation();
  }
});

const originalOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (isResizeObserverError(message)) return true;
  if (originalOnError) {
    return originalOnError(message, source, lineno, colno, error);
  }
  return false;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();