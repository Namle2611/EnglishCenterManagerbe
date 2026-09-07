import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getRoleHomeRoute } from '../../utils/roleHelper';

export const NotFoundPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleReturnHome = () => {
    if (isAuthenticated && user?.roles) {
      navigate(getRoleHomeRoute(user.roles), { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconBadgeStyle}>🔍</div>
        <h1 style={titleStyle}>404 - Không tìm thấy trang</h1>
        <p style={descriptionStyle}>
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã được chuyển sang địa chỉ khác.
        </p>
        <div style={actionRowStyle}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={secondaryButtonStyle}
          >
            &larr; Quay lại
          </button>
          <button
            type="button"
            onClick={handleReturnHome}
            style={primaryButtonStyle}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--color-canvas)',
  padding: '1.5rem'
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-md)',
  padding: '2.5rem 2rem',
  maxWidth: '480px',
  width: '100%',
  textAlign: 'center'
};

const iconBadgeStyle: React.CSSProperties = {
  fontSize: '3rem',
  lineHeight: 1,
  marginBottom: '1rem'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  marginBottom: '0.5rem'
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  color: 'var(--color-text-secondary)',
  lineHeight: 1.5,
  marginBottom: '1.75rem'
};

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem'
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.625rem 1.25rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease'
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '0.625rem 1.25rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  backgroundColor: 'var(--color-surface-subtle)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease'
};
