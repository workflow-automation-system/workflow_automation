import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmailVerification from './pages/auth/EmailVerification';
import VerifyEmail from './pages/auth/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Organisation from './pages/Organisation';
import AppConnections from './pages/AppConnections';
import Templates from './pages/Templates';
import CreateWorkflow from './pages/CreateWorkflow';
import WorkflowDetail from './pages/WorkflowDetail';
import Workflows from './pages/Workflows';
import Settings from './pages/Settings';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route wrapper (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { initTheme } = useThemeStore();

  // Initialize theme on app load
  React.useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/email-verification"
          element={
            <PublicRoute>
              <EmailVerification />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <VerifyEmail />
            </PublicRoute>
          }
        />

        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
            <Route path="/" element={<Dashboard />} />
            <Route path="/organisation" element={<Organisation />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/app-connections" element={<AppConnections />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/create-workflow" element={<CreateWorkflow />} />
            <Route path="/workflow/:id" element={<WorkflowDetail />} />
            <Route path="/workflows/:id" element={<WorkflowDetail />} />
            <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch all - redirect to dashboard or login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
