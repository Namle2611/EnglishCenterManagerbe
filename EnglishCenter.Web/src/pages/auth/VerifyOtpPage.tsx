import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

interface LocationState {
  email?: string;
  role?: string;
}

export const VerifyOtpPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as LocationState) || {};

  const [email, setEmail] = useState(state.email || '');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Verification outcome state
  const [isVerified, setIsVerified] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
      setError('Mã OTP phải bao gồm chính xác 6 chữ số.');
      return;
    }

    if (!email.trim()) {
      setError('Thiếu thông tin địa chỉ email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.verifyOtp({
        email: email.trim(),
        otp: trimmedOtp
      });

      if (res.success && res.data) {
        setIsVerified(true);
        setIsPendingApproval(res.data.isPendingApproval);
      } else {
        setError(res.message || 'Mã xác thực không hợp lệ.');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string } } };
        setError(axErr.response?.data?.message || 'Xác thực OTP thất bại.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã xảy ra lỗi khi xác thực mã OTP.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setError(null);
    setSuccessInfo(null);

    if (!email.trim()) {
      setError('Thiếu thông tin địa chỉ email.');
      return;
    }

    setIsResending(true);
    try {
      const res = await authService.resendOtp({ email: email.trim() });
      if (res.success) {
        setOtp('');
        setCooldown(60);
        setSuccessInfo('Mã OTP mới đã được gửi.');
      } else {
        setError(res.message || 'Không thể gửi lại mã OTP.');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string } } };
        setError(axErr.response?.data?.message || 'Không thể gửi lại mã OTP.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã xảy ra lỗi khi gửi lại mã OTP.');
      }
    } finally {
      setIsResending(false);
    }
  };

  // Outcome screen for completed Student
  if (isVerified && !isPendingApproval) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '3rem', lineHeight: 1 }} aria-hidden="true">🎉</span>
            <h1 style={{ ...titleStyle, marginTop: '1rem' }}>Xác thực email thành công!</h1>
            <p style={{ ...subtitleStyle, marginTop: '0.5rem', fontSize: '0.95rem' }}>
              Tài khoản học viên của bạn đã được tạo và kích hoạt. Bạn có thể đăng nhập ngay bây giờ.
            </p>
          </div>

          <button
            id="login-cta-btn"
            onClick={() => navigate('/login')}
            style={buttonStyle}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  // Outcome screen for pending Teacher / Staff
  if (isVerified && isPendingApproval) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '3rem', lineHeight: 1 }} aria-hidden="true">⏳</span>
            <h1 style={{ ...titleStyle, marginTop: '1rem' }}>Email đã được xác thực!</h1>
            <p style={{ ...subtitleStyle, marginTop: '0.75rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Yêu cầu đăng ký của bạn đang chờ Admin phê duyệt. Ban quản trị trung tâm sẽ xem xét hồ sơ và thông báo qua email khi tài khoản được kích hoạt.
            </p>
          </div>

          <button
            id="back-home-btn"
            onClick={() => navigate('/login')}
            style={buttonStyle}
          >
            Quay lại trang Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={brandLockupStyle}>
            <span style={{ fontSize: '1.75rem', lineHeight: 1 }} aria-hidden="true">✉️</span>
            <h1 style={titleStyle}>Xác thực mã OTP</h1>
          </div>
          <p style={subtitleStyle}>
            Nhập mã gồm 6 chữ số đã được gửi đến địa chỉ email
          </p>
          <div style={emailBadgeStyle}>
            {email || 'Chưa cung cấp email'}
          </div>
        </div>

        {error && (
          <div style={alertErrorStyle} role="alert">
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successInfo && (
          <div style={alertSuccessStyle} role="status">
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>✅</span>
            <span>{successInfo}</span>
          </div>
        )}

        <form onSubmit={handleVerify} noValidate>
          {!state.email && (
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="verify-email-input">
                Địa chỉ Email
              </label>
              <input
                id="verify-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                disabled={isSubmitting}
                required
                style={inputStyle}
              />
            </div>
          )}

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="otp-input">
              Mã OTP (6 chữ số)
            </label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                // Keep leading zeros and restrict to digits only
                const val = e.target.value.replace(/\D/g, '');
                setOtp(val);
              }}
              placeholder="004271"
              disabled={isSubmitting}
              autoComplete="one-time-code"
              required
              style={otpInputStyle}
            />
            <p style={hintTextStyle}>
              Mã OTP có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này.
            </p>
          </div>

          <button
            id="verify-submit-btn"
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            style={{
              ...buttonStyle,
              opacity: isSubmitting || otp.length !== 6 ? 0.7 : 1,
              cursor: isSubmitting || otp.length !== 6 ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Đang xác thực...' : 'Xác thực OTP'}
          </button>
        </form>

        <div style={resendSectionStyle}>
          <button
            id="resend-otp-btn"
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            style={{
              ...resendButtonStyle,
              opacity: cooldown > 0 || isResending ? 0.6 : 1,
              cursor: cooldown > 0 || isResending ? 'not-allowed' : 'pointer'
            }}
          >
            {isResending
              ? 'Đang gửi...'
              : cooldown > 0
              ? `Gửi lại mã sau (${cooldown}s)`
              : 'Gửi lại mã OTP'}
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <Link to="/register" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
            &larr; Quay lại trang đăng ký
          </Link>
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
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--color-border)',
  width: '100%',
  maxWidth: '440px',
  padding: '2.5rem 2rem'
};

const headerStyle: React.CSSProperties = {
  marginBottom: '1.75rem',
  textAlign: 'center'
};

const brandLockupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  marginBottom: '0.5rem'
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.375rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  margin: 0
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)',
  margin: '0.25rem 0 0 0'
};

const emailBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '0.75rem',
  padding: '0.35rem 0.85rem',
  backgroundColor: 'var(--color-canvas)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--color-primary)'
};

const alertErrorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--status-danger-bg)',
  border: '1px solid var(--status-danger-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--status-danger-text)',
  fontSize: '0.875rem',
  marginBottom: '1.25rem'
};

const alertSuccessStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--status-success-bg, #ecfdf5)',
  border: '1px solid var(--status-success-border, #a7f3d0)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--status-success-text, #065f46)',
  fontSize: '0.875rem',
  marginBottom: '1.25rem'
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '1.25rem'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  marginBottom: '0.375rem',
  textAlign: 'center'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  fontSize: '0.9375rem',
  color: 'var(--color-text-primary)',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  boxSizing: 'border-box'
};

const otpInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  fontSize: '1.75rem',
  fontWeight: 700,
  letterSpacing: '0.5rem',
  textAlign: 'center',
  color: 'var(--color-text-primary)',
  backgroundColor: 'var(--color-surface)',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  boxSizing: 'border-box'
};

const hintTextStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-secondary)',
  marginTop: '0.5rem',
  textAlign: 'center',
  margin: '0.5rem 0 0 0'
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  fontSize: '1rem',
  fontWeight: 600,
  color: '#ffffff',
  backgroundColor: 'var(--color-primary)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  transition: 'background-color 0.15s ease',
  marginTop: '0.5rem'
};

const resendSectionStyle: React.CSSProperties = {
  marginTop: '1.25rem',
  textAlign: 'center'
};

const resendButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  fontSize: '0.875rem',
  fontWeight: 600,
  padding: '0.25rem 0.5rem'
};
