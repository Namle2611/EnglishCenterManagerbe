import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { LoginPage } from './pages/auth/LoginPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { getRoleHomeRoute } from './utils/roleHelper';

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleHomeRoute(user.roles)} replace />;
  }

  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePasswordPage />} />

            {/* Admin only */}
            <Route element={<RoleRoute requiredRole="ADMIN" />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Staff only */}
            <Route element={<RoleRoute requiredRole="STAFF" />}>
              <Route path="/staff" element={<StaffDashboard />} />
            </Route>

            {/* Teacher only */}
            <Route element={<RoleRoute requiredRole="TEACHER" />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
            </Route>

            {/* Student only */}
            <Route element={<RoleRoute requiredRole="STUDENT" />}>
              <Route path="/student" element={<StudentDashboard />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
