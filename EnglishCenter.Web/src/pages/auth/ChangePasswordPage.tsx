import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { getRoleHomeRoute } from '../../utils/roleHelper';

export const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, changePassword } = useAuth();
  const navigate = useNavigate();

  const homeRoute = user ? getRoleHomeRoute(user.roles) : '/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Mật khẩu mới phải khác với mật khẩu hiện tại.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword });
      alert('Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Đổi mật khẩu"
        subtitle="Cập nhật mật khẩu tài khoản của bạn. Sau khi đổi, các phiên đăng nhập khác sẽ kết thúc."
        breadcrumbs={[
          { label: 'Trang chủ', path: homeRoute },
          { label: 'Đổi mật khẩu' }
        ]}
      />

      <div style={cardWrapperStyle}>
        <div style={cardStyle}>
          {error && (
            <div style={alertErrorStyle} role="alert">
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="current-pw">
                Mật khẩu hiện tại <span style={{ color: 'var(--status-danger-text)' }}>*</span>
              </label>
              <input
                id="current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Nhập mật khẩu hiện tại"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="new-pw">
                Mật khẩu mới <span style={{ color: 'var(--status-danger-text)' }}>*</span>
              </label>
              <input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Tối thiểu 8 ký tự"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="confirm-pw">
                Xác nhận mật khẩu mới <span style={{ color: 'var(--status-danger-text)' }}>*</span>
              </label>
              <input
                id="confirm-pw"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Nhập lại mật khẩu mới"
                style={inputStyle}
              />
            </div>

            <div style={actionsRowStyle}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...submitButtonStyle,
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
                style={cancelButtonStyle}
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
};

const cardWrapperStyle: React.CSSProperties = {
  maxWidth: '540px'
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-sm)',
  padding: '2rem'
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
  boxSizing: 'border-box'
};

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginTop: '1.5rem'
};

const submitButtonStyle: React.CSSProperties = {
  padding: '0.625rem 1.25rem',
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  fontWeight: 600,
  fontSize: '0.875rem',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  transition: 'background-color 0.15s ease'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '0.625rem 1.25rem',
  backgroundColor: 'var(--color-surface-subtle)',
  color: 'var(--color-text-secondary)',
  fontWeight: 500,
  fontSize: '0.875rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
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
  marginBottom: '1.25rem'
};
