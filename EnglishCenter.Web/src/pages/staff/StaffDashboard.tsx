import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const StaffDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header
        style={{
          backgroundColor: '#0f766e',
          color: '#fff',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h2 style={{ margin: 0 }}>Staff Portal</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>
            Welcome, <strong>{user?.fullName}</strong> (STAFF)
          </span>
          <Link to="/change-password" style={{ color: '#99f6e4', textDecoration: 'none' }}>
            Change Password
          </Link>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Navigation Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <Link
            to="/staff/students"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              display: 'block'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Quản lý học viên</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              Xem danh sách, tìm kiếm, tạo mới và quản lý trạng thái học viên
            </p>
          </Link>
          <Link
            to="/staff/courses"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              display: 'block'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Quản lý khóa học</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              Xem danh sách, tìm kiếm, tạo mới và quản lý trạng thái khóa học
            </p>
          </Link>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>Staff Overview</h3>
          <p>Email: {user?.email}</p>
        </div>
      </main>
    </div>
  );
};
