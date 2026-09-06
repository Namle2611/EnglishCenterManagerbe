import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0 }}>Admin Portal</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>Welcome, <strong>{user?.fullName}</strong> (ADMIN)</span>
          <Link to="/change-password" style={linkButtonStyle}>Change Password</Link>
          <button onClick={handleLogout} style={logoutButtonStyle}>Sign Out</button>
        </div>
      </header>

      <main style={mainStyle}>
        {/* Navigation Grid */}
        <div style={navGridStyle}>
          <Link to="/admin/students" style={navCardStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Quản lý học viên</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              Xem danh sách, tìm kiếm, tạo mới và quản lý trạng thái học viên
            </p>
          </Link>
          <Link to="/admin/teachers" style={navCardStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍🏫</div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Quản lý giáo viên</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              Xem danh sách, tìm kiếm, tạo mới và quản lý trạng thái giáo viên
            </p>
          </Link>
          <Link to="/admin/courses" style={navCardStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>Quản lý khóa học</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
              Xem danh sách, tìm kiếm, tạo mới và quản lý trạng thái khóa học
            </p>
          </Link>
        </div>

        <div style={cardStyle}>
          <h3>Administrator Overview</h3>
          <p>Authentication and Role-based authorization verified successfully.</p>
          <div style={infoBoxStyle}>
            <div><strong>User ID:</strong> {user?.id}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Roles:</strong> {user?.roles.join(', ')}</div>
            <div><strong>Status:</strong> {user?.isActive ? 'Active' : 'Inactive'}</div>
          </div>
        </div>
      </main>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f1f5f9',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  color: '#ffffff',
  padding: '1rem 2rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const mainStyle: React.CSSProperties = {
  padding: '2rem',
  maxWidth: '900px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const navGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem'
};

const navCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '0.5rem',
  padding: '1.5rem',
  textDecoration: 'none',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e2e8f0',
  transition: 'transform 0.15s, box-shadow 0.15s',
  display: 'block'
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '0.5rem',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
};

const infoBoxStyle: React.CSSProperties = {
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '0.375rem',
  display: 'grid',
  gap: '0.5rem'
};

const linkButtonStyle: React.CSSProperties = {
  color: '#93c5fd',
  textDecoration: 'none',
  fontSize: '0.875rem'
};

const logoutButtonStyle: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '0.875rem'
};
