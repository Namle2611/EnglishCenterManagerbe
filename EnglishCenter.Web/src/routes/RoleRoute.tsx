import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getRoleHomeRoute } from '../utils/roleHelper';

interface RoleRouteProps {
  requiredRole?: string;
  allowedRoles?: string[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ requiredRole, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'var(--color-canvas)',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-sans)'
        }}
      >
        <div>Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  // Determine authorized roles: allowedRoles takes priority if provided, else requiredRole
  const effectiveRoles: string[] = allowedRoles || (requiredRole ? [requiredRole] : []);

  const hasAccess = user && effectiveRoles.some((role) => user.roles.includes(role));

  if (!hasAccess) {
    const homeRoute = user ? getRoleHomeRoute(user.roles) : '/login';

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-canvas)',
          padding: '1.5rem'
        }}
      >
        <div
          style={{
            padding: '2.5rem 2rem',
            textAlign: 'center',
            maxWidth: '480px',
            width: '100%',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ fontSize: '3rem', lineHeight: 1, marginBottom: '1rem' }}>🛡️</div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            403 - Truy cập bị từ chối
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Bạn không có quyền truy cập vào khu vực này.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.75rem',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger-text)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1.75rem'
            }}
          >
            Yêu cầu vai trò: {effectiveRoles.join(' hoặc ')}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => window.history.back()}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: 'var(--color-surface-subtle)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              &larr; Quay lại
            </button>
            <button
              type="button"
              onClick={() => navigate(homeRoute, { replace: true })}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
