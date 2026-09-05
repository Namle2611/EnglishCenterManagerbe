import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ backgroundColor: '#1d4ed8', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Teacher Portal</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>Welcome, <strong>{user?.fullName}</strong> (TEACHER)</span>
          <Link to="/change-password" style={{ color: '#bfdbfe', textDecoration: 'none' }}>Change Password</Link>
          <button onClick={handleLogout} style={{ padding: '0.375rem 0.75rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </header>
      <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>Teacher Overview (Phase 3 Placeholder)</h3>
          <p>Email: {user?.email}</p>
        </div>
      </main>
    </div>
  );
};
