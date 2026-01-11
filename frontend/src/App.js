import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Family from './pages/Family';
import Monthly from './pages/Monthly';
import Calendar from './pages/Calendar';
import Health from './pages/Health';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return !user ? children : <Navigate to="/dashboard" />;
}

// 알림 권한 요청 컴포넌트
function NotificationPermissionRequest() {
  const { user } = useAuth();

  useEffect(() => {
    const requestPermission = async () => {
      if (!user) return;
      if (typeof Notification === 'undefined') return;
      if (Notification.permission !== 'default') return;

      // 약간의 딜레이 후 권한 요청 (UX 개선)
      setTimeout(async () => {
        await Notification.requestPermission();
      }, 1500);
    };

    requestPermission();
  }, [user]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <NotificationPermissionRequest />
          <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/family"
            element={
              <PrivateRoute>
                <Family />
              </PrivateRoute>
            }
          />
          <Route
            path="/monthly"
            element={
              <PrivateRoute>
                <Monthly />
              </PrivateRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <PrivateRoute>
                <Calendar />
              </PrivateRoute>
            }
          />
          <Route
            path="/health"
            element={
              <PrivateRoute>
                <Health />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
