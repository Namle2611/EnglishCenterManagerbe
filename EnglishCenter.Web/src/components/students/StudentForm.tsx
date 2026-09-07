import React, { useEffect, useState } from 'react';
import type {
  CreateStudentPayload,
  StudentStatus,
  UpdateStudentPayload
} from '../../types/student.types';
import { formatDateOnly, toDateInputValue } from '../../utils/studentHelper';
import { StudentStatusBadge } from './StudentStatusBadge';

export interface FormValues {
  studentCode: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  currentLevel: string;
}

interface StudentFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<FormValues>;
  readOnlyData?: {
    studentCode?: string;
    enrollmentDate?: string;
    status?: StudentStatus;
  };
  onSubmit: (payload: CreateStudentPayload | UpdateStudentPayload) => Promise<void>;
  isLoading?: boolean;
  serverError?: string | null;
  onCancel?: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  mode,
  initialValues,
  readOnlyData,
  onSubmit,
  isLoading = false,
  serverError,
  onCancel
}) => {
  const [formData, setFormData] = useState<FormValues>({
    studentCode: initialValues?.studentCode || '',
    email: initialValues?.email || '',
    password: initialValues?.password || '',
    fullName: initialValues?.fullName || '',
    phone: initialValues?.phone || '',
    avatarUrl: initialValues?.avatarUrl || '',
    dateOfBirth: toDateInputValue(initialValues?.dateOfBirth),
    gender: initialValues?.gender || '',
    address: initialValues?.address || '',
    currentLevel: initialValues?.currentLevel || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync when initialValues change (e.g. in Edit mode after fetch)
  useEffect(() => {
    if (initialValues) {
      setFormData({
        studentCode: initialValues.studentCode || '',
        email: initialValues.email || '',
        password: initialValues.password || '',
        fullName: initialValues.fullName || '',
        phone: initialValues.phone || '',
        avatarUrl: initialValues.avatarUrl || '',
        dateOfBirth: toDateInputValue(initialValues.dateOfBirth),
        gender: initialValues.gender || '',
        address: initialValues.address || '',
        currentLevel: initialValues.currentLevel || ''
      });
    }
  }, [initialValues]);

  // Clean password on unmount to ensure security lifecycle
  useEffect(() => {
    return () => {
      setFormData((prev) => ({ ...prev, password: '' }));
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field as user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // StudentCode (Create only)
    if (mode === 'create') {
      const code = formData.studentCode.trim();
      if (!code) {
        errors.studentCode = 'Mã học viên là bắt buộc.';
      } else if (code.length > 20) {
        errors.studentCode = 'Mã học viên không được vượt quá 20 ký tự.';
      }

      // Password (Create only)
      if (!formData.password) {
        errors.password = 'Mật khẩu là bắt buộc.';
      } else if (formData.password.length < 8) {
        errors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
      }
    }

    // FullName (Required)
    const name = formData.fullName.trim();
    if (!name) {
      errors.fullName = 'Họ và tên là bắt buộc.';
    } else if (name.length > 100) {
      errors.fullName = 'Họ và tên không được vượt quá 100 ký tự.';
    }

    // Email (Required, format check)
    const email = formData.email.trim();
    if (!email) {
      errors.email = 'Email là bắt buộc.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Định dạng email không hợp lệ.';
    } else if (email.length > 256) {
      errors.email = 'Email không được vượt quá 256 ký tự.';
    }

    // Phone (Optional, max 20)
    if (formData.phone && formData.phone.trim().length > 20) {
      errors.phone = 'Số điện thoại không được vượt quá 20 ký tự.';
    }

    // CurrentLevel (Optional, max 50)
    if (formData.currentLevel && formData.currentLevel.trim().length > 50) {
      errors.currentLevel = 'Trình độ hiện tại không được vượt quá 50 ký tự.';
    }

    // Address (Optional, max 500)
    if (formData.address && formData.address.trim().length > 500) {
      errors.address = 'Địa chỉ không được vượt quá 500 ký tự.';
    }

    // AvatarUrl (Optional, max 500)
    if (formData.avatarUrl && formData.avatarUrl.trim().length > 500) {
      errors.avatarUrl = 'Đường dẫn ảnh đại diện không được vượt quá 500 ký tự.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const payload: CreateStudentPayload = {
          studentCode: formData.studentCode.trim(),
          email: formData.email.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim() || null,
          avatarUrl: formData.avatarUrl.trim() || null,
          dateOfBirth: formData.dateOfBirth || null,
          gender: formData.gender.trim() || null,
          address: formData.address.trim() || null,
          currentLevel: formData.currentLevel.trim() || null
        };
        await onSubmit(payload);
        setFormData((prev) => ({ ...prev, password: '' }));
      } else {
        const payload: UpdateStudentPayload = {
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim() || null,
          avatarUrl: formData.avatarUrl.trim() || null,
          dateOfBirth: formData.dateOfBirth || null,
          gender: formData.gender.trim() || null,
          address: formData.address.trim() || null,
          currentLevel: formData.currentLevel.trim() || null
        };
        await onSubmit(payload);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} style={formStyle} noValidate>
      {/* Server error banner */}
      {serverError && (
        <div style={errorBannerStyle} role="alert">
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚠️</span>
          <span>{serverError}</span>
        </div>
      )}

      {/* Read-only info in Edit mode */}
      {mode === 'edit' && readOnlyData && (
        <div style={readOnlyCardStyle}>
          <div style={readOnlyGridStyle}>
            <div style={readOnlyItemStyle}>
              <span style={readOnlyLabelStyle}>Mã học viên (bất biến)</span>
              <span style={readOnlyCodeBadgeStyle} className="font-mono">
                {readOnlyData.studentCode || '—'}
              </span>
            </div>

            <div style={readOnlyItemStyle}>
              <span style={readOnlyLabelStyle}>Ngày nhập học (bất biến)</span>
              <span style={readOnlyValueStyle}>
                {formatDateOnly(readOnlyData.enrollmentDate)}
              </span>
            </div>

            {readOnlyData.status && (
              <div style={readOnlyItemStyle}>
                <span style={readOnlyLabelStyle}>Trạng thái hiện tại</span>
                <div style={{ marginTop: '0.2rem' }}>
                  <StudentStatusBadge status={readOnlyData.status} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 1: Account / Core Information */}
      <div style={sectionCardStyle}>
        <h3 style={sectionTitleStyle}>Thông tin định danh & tài khoản</h3>
        <p style={sectionSubtitleStyle}>Các trường bắt buộc để thiết lập tài khoản học viên trong trung tâm.</p>

        <div style={fieldsGridStyle}>
          {mode === 'create' && (
            <div style={fieldGroupStyle}>
              <label htmlFor="studentCode" style={labelStyle}>
                Mã học viên <span style={{ color: 'var(--status-danger-text)' }}>*</span>
              </label>
              <input
                id="studentCode"
                name="studentCode"
                type="text"
                value={formData.studentCode}
                onChange={handleChange}
                placeholder="VD: STU2026001"
                maxLength={20}
                disabled={isBusy}
                style={{
                  ...inputStyle,
                  borderColor: validationErrors.studentCode ? 'var(--status-danger-border)' : 'var(--color-border-strong)'
                }}
                required
              />
              {validationErrors.studentCode && (
                <span style={fieldErrorStyle}>{validationErrors.studentCode}</span>
              )}
            </div>
          )}

          <div style={fieldGroupStyle}>
            <label htmlFor="fullName" style={labelStyle}>
              Họ và tên <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="VD: Nguyễn Văn A"
              maxLength={100}
              disabled={isBusy}
              style={{
                ...inputStyle,
                borderColor: validationErrors.fullName ? 'var(--status-danger-border)' : 'var(--color-border-strong)'
              }}
              required
            />
            {validationErrors.fullName && (
              <span style={fieldErrorStyle}>{validationErrors.fullName}</span>
            )}
          </div>

          <div style={fieldGroupStyle}>
            <label htmlFor="email" style={labelStyle}>
              Email liên hệ <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="student@example.com"
              maxLength={256}
              disabled={isBusy}
              style={{
                ...inputStyle,
                borderColor: validationErrors.email ? 'var(--status-danger-border)' : 'var(--color-border-strong)'
              }}
              required
            />
            {validationErrors.email && (
              <span style={fieldErrorStyle}>{validationErrors.email}</span>
            )}
          </div>

          {mode === 'create' && (
            <div style={fieldGroupStyle}>
              <label htmlFor="password" style={labelStyle}>
                Mật khẩu khởi tạo <span style={{ color: 'var(--status-danger-text)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tối thiểu 8 ký tự"
                  disabled={isBusy}
                  style={{
                    ...inputStyle,
                    paddingRight: '3rem',
                    borderColor: validationErrors.password ? 'var(--status-danger-border)' : 'var(--color-border-strong)'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={togglePasswordBtnStyle}
                  tabIndex={-1}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              {validationErrors.password && (
                <span style={fieldErrorStyle}>{validationErrors.password}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Personal & Academic Details */}
      <div style={sectionCardStyle}>
        <h3 style={sectionTitleStyle}>Thông tin cá nhân & học vụ</h3>
        <p style={sectionSubtitleStyle}>Các thông tin bổ sung phục vụ liên lạc và phân lớp học viên.</p>

        <div style={fieldsGridStyle}>
          <div style={fieldGroupStyle}>
            <label htmlFor="phone" style={labelStyle}>Số điện thoại</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0912345678"
              maxLength={20}
              disabled={isBusy}
              style={inputStyle}
            />
            {validationErrors.phone && (
              <span style={fieldErrorStyle}>{validationErrors.phone}</span>
            )}
          </div>

          <div style={fieldGroupStyle}>
            <label htmlFor="currentLevel" style={labelStyle}>Trình độ hiện tại</label>
            <input
              id="currentLevel"
              name="currentLevel"
              type="text"
              value={formData.currentLevel}
              onChange={handleChange}
              placeholder="VD: A1, B2, IELTS 5.5..."
              maxLength={50}
              disabled={isBusy}
              style={inputStyle}
            />
            {validationErrors.currentLevel && (
              <span style={fieldErrorStyle}>{validationErrors.currentLevel}</span>
            )}
          </div>

          <div style={fieldGroupStyle}>
            <label htmlFor="dateOfBirth" style={labelStyle}>Ngày sinh</label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              disabled={isBusy}
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label htmlFor="gender" style={labelStyle}>Giới tính</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={isBusy}
              style={inputStyle}
            >
              <option value="">-- Chọn giới tính --</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div style={{ ...fieldGroupStyle, gridColumn: '1 / -1' }}>
            <label htmlFor="address" style={labelStyle}>Địa chỉ cư trú</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Nhập địa chỉ liên hệ đầy đủ..."
              maxLength={500}
              rows={2}
              disabled={isBusy}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            {validationErrors.address && (
              <span style={fieldErrorStyle}>{validationErrors.address}</span>
            )}
          </div>

          <div style={{ ...fieldGroupStyle, gridColumn: '1 / -1' }}>
            <label htmlFor="avatarUrl" style={labelStyle}>Đường dẫn ảnh đại diện (URL)</label>
            <input
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              value={formData.avatarUrl}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
              maxLength={500}
              disabled={isBusy}
              style={inputStyle}
            />
            {validationErrors.avatarUrl && (
              <span style={fieldErrorStyle}>{validationErrors.avatarUrl}</span>
            )}
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div style={actionsRowStyle}>
        <button
          type="submit"
          disabled={isBusy}
          style={{
            ...submitButtonStyle,
            opacity: isBusy ? 0.7 : 1,
            cursor: isBusy ? 'not-allowed' : 'pointer'
          }}
        >
          {isBusy
            ? 'Đang xử lý...'
            : mode === 'create'
            ? '+ Tạo học viên mới'
            : 'Lưu thay đổi'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            style={cancelButtonStyle}
          >
            Hủy bỏ
          </button>
        )}
      </div>
    </form>
  );
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-sm)',
  padding: '1.75rem'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.0625rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  margin: '0 0 0.25rem 0'
};

const sectionSubtitleStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  margin: '0 0 1.25rem 0'
};

const fieldsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.25rem'
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)'
};

const inputStyle: React.CSSProperties = {
  padding: '0.55rem 0.8rem',
  fontSize: '0.875rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-strong)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  boxSizing: 'border-box'
};

const togglePasswordBtnStyle: React.CSSProperties = {
  position: 'absolute',
  right: '0.5rem',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
  padding: '0.25rem 0.5rem'
};

const fieldErrorStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--status-danger-text)',
  fontWeight: 500
};

const readOnlyCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface-subtle)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  padding: '1.25rem 1.5rem'
};

const readOnlyGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem'
};

const readOnlyItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const readOnlyLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const readOnlyValueStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 500,
  color: 'var(--color-text-primary)'
};

const readOnlyCodeBadgeStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--color-primary)',
  backgroundColor: 'var(--color-surface)',
  padding: '0.2rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  width: 'fit-content'
};

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
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
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-secondary)',
  fontWeight: 500,
  fontSize: '0.875rem',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
};

const errorBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  backgroundColor: 'var(--status-danger-bg)',
  border: '1px solid var(--status-danger-border)',
  color: 'var(--status-danger-text)',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.8125rem'
};
