import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getRoleHomeRoute } from '../../utils/roleHelper';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login({ email: email.trim(), password });
      const targetRoute = getRoleHomeRoute(data.user.roles);
      navigate(targetRoute, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Brand Header */}
        <div style={headerStyle}>
          <div style={brandLockupStyle}>
            <span style={{ fontSize: '1.75rem', lineHeight: 1 }} aria-hidden="true">🏛️</span>
            <h1 style={titleStyle}>English Center Manager</h1>
          </div>
          <p style={subtitleStyle}>
            Hệ thống quản lý trung tâm Anh ngữ chuyên nghiệp
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={alertErrorStyle} role="alert">
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="email-input">
              Địa chỉ Email <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@englishcenter.local"
              disabled={isSubmitting}
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="password-input">
              Mật khẩu <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              disabled={isSubmitting}
              required
              style={inputStyle}
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            style={{
              ...buttonStyle,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
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
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--color-border)',
  width: '100%',
  maxWidth: '420px',
  padding: '2.5rem 2rem'
};

const headerStyle: React.CSSProperties = {
  marginBottom: '2rem'
};

const brandLockupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  marginBottom: '0.5rem'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.375rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  letterSpacing: '-0.02em'
};

const subtitleStyle: React.CSSProperties = {
  margin: '0.5rem 0 0',
  color: 'var(--color-text-secondary)',
  fontSize: '0.875rem',
  lineHeight: 1.4
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '1.25rem'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: '0.375rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-strong)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  fontWeight: 600,
  fontSize: '0.875rem',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  marginTop: '0.5rem',
  transition: 'background-color 0.15s ease'
};

const alertErrorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  backgroundColor: 'var(--status-danger-bg)',
  border: '1px solid var(--status-danger-border)',
  color: 'var(--status-danger-text)',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem',
  marginBottom: '1.25rem',
  lineHeight: 1.4
};
