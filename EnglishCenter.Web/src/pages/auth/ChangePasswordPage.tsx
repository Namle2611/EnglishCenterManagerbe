import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { changePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Confirmation password does not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword });
      alert('Password changed successfully. Please log in with your new password.');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to change password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.5rem', color: '#1e293b' }}>Change Password</h2>
        <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
          Update your account password. All active sessions will be terminated.
        </p>

        {error && (
          <div style={alertErrorStyle}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle} htmlFor="current-pw">Current Password</label>
            <input
              id="current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isSubmitting}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle} htmlFor="new-pw">New Password (min 8 chars)</label>
            <input
              id="new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isSubmitting}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle} htmlFor="confirm-pw">Confirm New Password</label>
            <input
              id="confirm-pw"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              disabled={isSubmitting}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...buttonStyle,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              style={cancelButtonStyle}
            >
              Back
            </button>
          </div>
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
  backgroundColor: '#f8fafc',
  padding: '1rem',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '0.75rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  width: '100%',
  maxWidth: '420px',
  padding: '2rem'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#334155',
  marginBottom: '0.25rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  borderRadius: '0.375rem',
  border: '1px solid #cbd5e1',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
  outline: 'none'
};

const buttonStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontWeight: 600,
  border: 'none',
  borderRadius: '0.375rem'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.25rem',
  backgroundColor: '#f1f5f9',
  color: '#475569',
  fontWeight: 600,
  border: '1px solid #cbd5e1',
  borderRadius: '0.375rem',
  cursor: 'pointer'
};

const alertErrorStyle: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  padding: '0.75rem',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  marginBottom: '1rem'
};
