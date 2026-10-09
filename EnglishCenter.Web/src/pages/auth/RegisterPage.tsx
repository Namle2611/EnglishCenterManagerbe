import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import type { RegisterRequest, RegistrationRole } from '../../types/registration.types';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<RegistrationRole>('STUDENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Teacher specific fields
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');

  // Student specific fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có tối thiểu 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (role === 'TEACHER') {
      if (!specialization.trim()) {
        setError('Vui lòng nhập chuyên môn giảng dạy.');
        return;
      }
      if (experienceYears === '' || experienceYears < 0) {
        setError('Vui lòng nhập số năm kinh nghiệm hợp lệ (>= 0).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: RegisterRequest = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        requestedRole: role
      };

      if (role === 'TEACHER') {
        payload.specialization = specialization.trim();
        payload.qualification = qualification.trim() || undefined;
        payload.experienceYears = Number(experienceYears);
      } else if (role === 'STUDENT') {
        if (dateOfBirth) payload.dateOfBirth = dateOfBirth;
        if (gender) payload.gender = gender;
        if (address.trim()) payload.address = address.trim();
      }

      const res = await authService.register(payload);
      if (res.success) {
        navigate('/register/verify-email', {
          state: {
            email: email.trim(),
            role
          }
        });
      } else {
        setError(res.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string } } };
        setError(axErr.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã xảy ra lỗi trong quá trình đăng ký.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={brandLockupStyle}>
            <span style={{ fontSize: '1.75rem', lineHeight: 1 }} aria-hidden="true">🏛️</span>
            <h1 style={titleStyle}>English Center Manager</h1>
          </div>
          <p style={subtitleStyle}>
            Đăng ký tài khoản học viên hoặc ứng tuyển công tác
          </p>
        </div>

        {error && (
          <div style={alertErrorStyle} role="alert">
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Role selection */}
          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="role-select">
              Vai trò đăng ký <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <select
              id="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value as RegistrationRole)}
              disabled={isSubmitting}
              style={selectStyle}
            >
              <option value="STUDENT">🎓 Học viên (Student)</option>
              <option value="TEACHER">👨‍🏫 Giảng viên (Teacher)</option>
              <option value="STAFF">💼 Nhân viên (Staff)</option>
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="fullname-input">
              Họ và tên <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <input
              id="fullname-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              disabled={isSubmitting}
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="email-input">
              Địa chỉ Email <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              disabled={isSubmitting}
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="phone-input">
              Số điện thoại
            </label>
            <input
              id="phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912345678"
              disabled={isSubmitting}
              style={inputStyle}
            />
          </div>

          {/* Teacher Specific Fields */}
          {role === 'TEACHER' && (
            <>
              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="specialization-input">
                  Chuyên môn giảng dạy <span style={{ color: 'var(--status-danger-text)' }}>*</span>
                </label>
                <input
                  id="specialization-input"
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="IELTS, TOEIC, Giao tiếp học thuật..."
                  disabled={isSubmitting}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="qualification-input">
                  Chứng chỉ / Bằng cấp
                </label>
                <input
                  id="qualification-input"
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="ThS. TESOL, IELTS 8.5..."
                  disabled={isSubmitting}
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="exp-input">
                  Số năm kinh nghiệm <span style={{ color: 'var(--status-danger-text)' }}>*</span>
                </label>
                <input
                  id="exp-input"
                  type="number"
                  min="0"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="3"
                  disabled={isSubmitting}
                  required
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {/* Student Specific Fields */}
          {role === 'STUDENT' && (
            <>
              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="dob-input">
                  Ngày sinh
                </label>
                <input
                  id="dob-input"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isSubmitting}
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="gender-select">
                  Giới tính
                </label>
                <select
                  id="gender-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={isSubmitting}
                  style={selectStyle}
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle} htmlFor="address-input">
                  Địa chỉ
                </label>
                <input
                  id="address-input"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Hà Nội, TP.HCM..."
                  disabled={isSubmitting}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="password-input">
              Mật khẩu <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              disabled={isSubmitting}
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle} htmlFor="confirm-password-input">
              Xác nhận mật khẩu <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <input
              id="confirm-password-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              disabled={isSubmitting}
              required
              style={inputStyle}
            />
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            disabled={isSubmitting}
            style={{
              ...buttonStyle,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Đang gửi thông tin...' : 'Tiếp tục nhận mã OTP'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Đã có tài khoản? </span>
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Đăng nhập ngay
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
  maxWidth: '480px',
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
  fontSize: '1.375rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  margin: 0
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)',
  textAlign: 'center',
  margin: 0
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
  marginBottom: '1.5rem'
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '1.25rem'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  marginBottom: '0.375rem'
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

const selectStyle: React.CSSProperties = {
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
