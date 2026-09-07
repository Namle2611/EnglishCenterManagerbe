import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { LoginPage } from './pages/auth/LoginPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentCreatePage } from './pages/students/StudentCreatePage';
import { StudentDetailPage } from './pages/students/StudentDetailPage';
import { StudentEditPage } from './pages/students/StudentEditPage';
import { StudentListPage } from './pages/students/StudentListPage';
import { CourseCreatePage } from './pages/courses/CourseCreatePage';
import { CourseDetailPage } from './pages/courses/CourseDetailPage';
import { CourseEditPage } from './pages/courses/CourseEditPage';
import { CourseListPage } from './pages/courses/CourseListPage';
import { TeacherCreatePage } from './pages/teachers/TeacherCreatePage';
import { TeacherDetailPage } from './pages/teachers/TeacherDetailPage';
import { TeacherEditPage } from './pages/teachers/TeacherEditPage';
import { TeacherListPage } from './pages/teachers/TeacherListPage';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { getRoleHomeRoute } from './utils/roleHelper';
import { NotFoundPage } from './pages/common/NotFoundPage';

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
            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<StudentListPage />} />
              <Route path="/admin/students/new" element={<StudentCreatePage />} />
              <Route path="/admin/students/:id" element={<StudentDetailPage />} />
              <Route path="/admin/students/:id/edit" element={<StudentEditPage />} />
              <Route path="/admin/teachers" element={<TeacherListPage />} />
              <Route path="/admin/teachers/new" element={<TeacherCreatePage />} />
              <Route path="/admin/teachers/:id" element={<TeacherDetailPage />} />
              <Route path="/admin/teachers/:id/edit" element={<TeacherEditPage />} />
              <Route path="/admin/courses" element={<CourseListPage />} />
              <Route path="/admin/courses/new" element={<CourseCreatePage />} />
              <Route path="/admin/courses/:id" element={<CourseDetailPage />} />
              <Route path="/admin/courses/:id/edit" element={<CourseEditPage />} />
            </Route>

            {/* Staff only */}
            <Route element={<RoleRoute allowedRoles={['STAFF']} />}>
              <Route path="/staff" element={<StaffDashboard />} />
              <Route path="/staff/students" element={<StudentListPage />} />
              <Route path="/staff/students/new" element={<StudentCreatePage />} />
              <Route path="/staff/students/:id" element={<StudentDetailPage />} />
              <Route path="/staff/students/:id/edit" element={<StudentEditPage />} />
              <Route path="/staff/courses" element={<CourseListPage />} />
              <Route path="/staff/courses/new" element={<CourseCreatePage />} />
              <Route path="/staff/courses/:id" element={<CourseDetailPage />} />
              <Route path="/staff/courses/:id/edit" element={<CourseEditPage />} />
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
