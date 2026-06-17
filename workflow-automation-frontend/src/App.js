import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmailVerification from './pages/auth/EmailVerification';
import VerifyEmail from './pages/auth/VerifyEmail';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Organisation from './pages/Organisation';
import AppConnections from './pages/AppConnections';
import Templates from './pages/Templates';
import CreateWorkflow from './pages/CreateWorkflow';
import WorkflowDetail from './pages/WorkflowDetail';
import Workflows from './pages/Workflows';
import Settings from './pages/Settings';
import PermissionDenied from './pages/PermissionDenied';
import AdminConsole from './pages/AdminConsole';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { ROLES } from './utils/rbac';

const AuthBoot = ({ children }) => {
  const { initTheme } = useThemeStore();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  React.useEffect(() => {
    initTheme();
    initializeAuth();
  }, [initTheme, initializeAuth]);

  React.useEffect(() => {
    const refreshSession = () => {
      if (document.visibilityState === 'visible' && localStorage.getItem('token')) {
        initializeAuth();
      }
    };

    document.addEventListener('visibilitychange', refreshSession);
    return () => document.removeEventListener('visibilitychange', refreshSession);
  }, [initializeAuth]);

  return children;
};

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F6F5FA] font-urbanist text-sm text-[#5C5C5C]">
    Loading workspace access...
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const RoleGuard = ({ allowedRoles, children }) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const role = String(user?.role || ROLES.USER).toUpperCase();

  if (!allowedRoles.map((value) => value.toUpperCase()).includes(role)) {
    return <Navigate to="/forbidden" replace state={{ from: location }} />;
  }

  return children;
};

function App() {
  return (
    <AuthBoot>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            }
          />
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

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route
              path="/create-workflow"
              element={
                <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.USER]}>
                  <CreateWorkflow />
                </RoleGuard>
              }
            />
            <Route path="/workflow/:id" element={<WorkflowDetail />} />
            <Route path="/workflows/:id" element={<WorkflowDetail />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/forbidden" element={<PermissionDenied />} />
            <Route path="/profile" element={<Profile />} />

            <Route
              path="/organisation"
              element={
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <Organisation />
                </RoleGuard>
              }
            />
            <Route
              path="/app-connections"
              element={
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AppConnections />
                </RoleGuard>
              }
            />
            <Route
              path="/settings"
              element={
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <Settings />
                </RoleGuard>
              }
            />
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AdminConsole />
                </RoleGuard>
              }
            />
            <Route
              path="/audit"
              element={
                <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                  <AuditLogs />
                </RoleGuard>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthBoot>
  );
}

export default App;
