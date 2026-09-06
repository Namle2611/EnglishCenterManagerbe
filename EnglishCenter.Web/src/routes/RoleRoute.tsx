import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RoleRouteProps {
  requiredRole?: string;
  allowedRoles?: string[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ requiredRole, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'sans-serif'
        }}
      >
        <div>Loading permissions...</div>
      </div>
    );
  }

  // Determine authorized roles: allowedRoles takes priority if provided, else requiredRole
  const effectiveRoles: string[] = allowedRoles || (requiredRole ? [requiredRole] : []);

  const hasAccess = user && effectiveRoles.some((role) => user.roles.includes(role));

  if (!hasAccess) {
    return (
      <div
        style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          maxWidth: '500px',
          margin: '4rem auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚫</div>
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>403 - Access Denied</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Bạn không có quyền truy cập vào trang này (yêu cầu vai trò: {effectiveRoles.join(' hoặc ')}).
        </p>
        <button
          type="button"
          onClick={() => window.history.back()}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          &larr; Quay lại
        </button>
      </div>
    );
  }

  return <Outlet />;
};
