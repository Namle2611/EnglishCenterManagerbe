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

    // Email
    const email = formData.email.trim();
    if (!email) {
      errors.email = 'Email là bắt buộc.';
    } else if (email.length > 255) {
      errors.email = 'Email không được vượt quá 255 ký tự.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Định dạng email không hợp lệ.';
      }
    }

    // FullName
    const fullName = formData.fullName.trim();
    if (!fullName) {
      errors.fullName = 'Họ và tên là bắt buộc.';
    } else if (fullName.length > 150) {
      errors.fullName = 'Họ và tên không được vượt quá 150 ký tự.';
    }

    // Phone
    const phone = formData.phone.trim();
    if (phone && phone.length > 20) {
      errors.phone = 'Số điện thoại không được vượt quá 20 ký tự.';
    }

    // AvatarUrl
    const avatarUrl = formData.avatarUrl.trim();
    if (avatarUrl && avatarUrl.length > 500) {
      errors.avatarUrl = 'Đường dẫn ảnh đại diện không được vượt quá 500 ký tự.';
    }

    // DateOfBirth: cannot be in future
    if (formData.dateOfBirth) {
      const today = new Date().toISOString().substring(0, 10);
      if (formData.dateOfBirth > today) {
        errors.dateOfBirth = 'Ngày sinh không thể ở trong tương lai.';
      }
    }

    // Gender
    const gender = formData.gender.trim();
    if (gender && gender.length > 20) {
      errors.gender = 'Giới tính không được vượt quá 20 ký tự.';
    }

    // Address
    const address = formData.address.trim();
    if (address && address.length > 500) {
      errors.address = 'Địa chỉ không được vượt quá 500 ký tự.';
    }

    // CurrentLevel
    const level = formData.currentLevel.trim();
    if (level && level.length > 50) {
      errors.currentLevel = 'Trình độ hiện tại không được vượt quá 50 ký tự.';
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
          password: formData.password, // Raw password transmitted as typed
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim() || null,
          avatarUrl: formData.avatarUrl.trim() || null,
          dateOfBirth: formData.dateOfBirth || null,
          gender: formData.gender.trim() || null,
          address: formData.address.trim() || null,
          currentLevel: formData.currentLevel.trim() || null
        };
        await onSubmit(payload);
        // Clear password immediately on successful submit
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
          <span style={{ fontWeight: 'bold' }}>✕ Lỗi:</span> {serverError}
        </div>
      )}

      {/* Read-only info in Edit mode */}
      {mode === 'edit' && readOnlyData && (
        <div style={readOnlySectionStyle}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Mã học viên (Cố định):</label>
            <div style={readOnlyValueStyle}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {readOnlyData.studentCode || '-'}
              </span>
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Ngày nhập học:</label>
            <div style={readOnlyValueStyle}>
              {formatDateOnly(readOnlyData.enrollmentDate)}
            </div>
          </div>

          {readOnlyData.status && (
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Trạng thái hiện tại:</label>
              <div>
                <StudentStatusBadge status={readOnlyData.status} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primary fields grid */}
      <div style={gridStyle}>
        {/* Student Code (Create Mode Only) */}
        {mode === 'create' && (
          <div style={fieldGroupStyle}>
            <label htmlFor="studentCode" style={labelStyle}>
              Mã học viên <span style={requiredStarStyle}>*</span>
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
                borderColor: validationErrors.studentCode ? '#ef4444' : '#cbd5e1'
              }}
              required
            />
            {validationErrors.studentCode && (
              <span style={fieldErrorStyle}>{validationErrors.studentCode}</span>
            )}
          </div>
        )}

        {/* Full Name */}
        <div style={fieldGroupStyle}>
          <label htmlFor="fullName" style={labelStyle}>
            Họ và tên <span style={requiredStarStyle}>*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="VD: Nguyễn Văn A"
            maxLength={150}
            disabled={isBusy}
            style={{
              ...inputStyle,
              borderColor: validationErrors.fullName ? '#ef4444' : '#cbd5e1'
            }}
            required
          />
          {validationErrors.fullName && (
            <span style={fieldErrorStyle}>{validationErrors.fullName}</span>
          )}
        </div>

        {/* Email */}
        <div style={fieldGroupStyle}>
          <label htmlFor="email" style={labelStyle}>
            Email <span style={requiredStarStyle}>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="VD: student@example.com"
            maxLength={255}
            disabled={isBusy}
            style={{
              ...inputStyle,
              borderColor: validationErrors.email ? '#ef4444' : '#cbd5e1'
            }}
            required
          />
          {validationErrors.email && (
            <span style={fieldErrorStyle}>{validationErrors.email}</span>
          )}
        </div>

        {/* Password (Create Mode Only) */}
        {mode === 'create' && (
          <div style={fieldGroupStyle}>
            <label htmlFor="password" style={labelStyle}>
              Mật khẩu <span style={requiredStarStyle}>*</span> (Tối thiểu 8 ký tự)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={isBusy}
                style={{
                  ...inputStyle,
                  paddingRight: '3rem',
                  borderColor: validationErrors.password ? '#ef4444' : '#cbd5e1'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isBusy}
                style={passwordToggleStyle}
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

        {/* Phone */}
        <div style={fieldGroupStyle}>
          <label htmlFor="phone" style={labelStyle}>
            Số điện thoại
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="VD: 0912345678"
            maxLength={20}
            disabled={isBusy}
            style={{
              ...inputStyle,
              borderColor: validationErrors.phone ? '#ef4444' : '#cbd5e1'
            }}
          />
          {validationErrors.phone && (
            <span style={fieldErrorStyle}>{validationErrors.phone}</span>
          )}
        </div>

        {/* Date of Birth */}
        <div style={fieldGroupStyle}>
          <label htmlFor="dateOfBirth" style={labelStyle}>
            Ngày sinh
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            disabled={isBusy}
            style={{
              ...inputStyle,
              borderColor: validationErrors.dateOfBirth ? '#ef4444' : '#cbd5e1'
            }}
          />
          {validationErrors.dateOfBirth && (
            <span style={fieldErrorStyle}>{validationErrors.dateOfBirth}</span>
          )}
        </div>

        {/* Gender */}
        <div style={fieldGroupStyle}>
          <label htmlFor="gender" style={labelStyle}>
            Giới tính
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            disabled={isBusy}
            style={{
              ...inputStyle,
              borderColor: validationErrors.gender ? '#ef4444' : '#cbd5e1'
            }}
          >
            <option value="">-- Chọn giới tính --</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
          {validationErrors.gender && (
            <span style={fieldErrorStyle}>{validationErrors.gender}</span>
          )}
        </div>

        {/* Current Level */}
        <div style={fieldGroupStyle}>
          <label htmlFor="currentLevel" style={labelStyle}>
            Trình độ hiện tại
          </label>
          <input
            id="currentLevel"
            name="currentLevel"
            type="text"
            value={formData.currentLevel}
            onChange={handleChange}
            placeholder="VD: A1, B1, IELTS 6.0..."
            maxLength={50}
            disabled={isBusy}
            style={{
              ...inputStyle,
              borderColor: validationErrors.currentLevel ? '#ef4444' : '#cbd5e1'
            }}
          />
          {validationErrors.currentLevel && (
            <span style={fieldErrorStyle}>{validationErrors.currentLevel}</span>
          )}
        </div>
      </div>

      {/* Full width fields */}
      <div style={fieldGroupStyle}>
        <label htmlFor="avatarUrl" style={labelStyle}>
          Đường dẫn ảnh đại diện (Avatar URL)
        </label>
        <input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          value={formData.avatarUrl}
          onChange={handleChange}
          placeholder="https://example.com/avatar.jpg"
          maxLength={500}
          disabled={isBusy}
          style={{
            ...inputStyle,
            borderColor: validationErrors.avatarUrl ? '#ef4444' : '#cbd5e1'
          }}
        />
        {validationErrors.avatarUrl && (
          <span style={fieldErrorStyle}>{validationErrors.avatarUrl}</span>
        )}
      </div>

      <div style={fieldGroupStyle}>
        <label htmlFor="address" style={labelStyle}>
          Địa chỉ
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="VD: Số 123, đường ABC, Hà Nội"
          maxLength={500}
          rows={3}
          disabled={isBusy}
          style={{
            ...inputStyle,
            resize: 'vertical',
            fontFamily: 'inherit',
            borderColor: validationErrors.address ? '#ef4444' : '#cbd5e1'
          }}
        />
        {validationErrors.address && (
          <span style={fieldErrorStyle}>{validationErrors.address}</span>
        )}
      </div>

      {/* Action buttons */}
      <div style={buttonContainerStyle}>
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
            ? 'Đang lưu...'
            : mode === 'create'
            ? 'Tạo mới học viên'
            : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
};

const formStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '1.5rem',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem'
};

const readOnlySectionStyle: React.CSSProperties = {
  padding: '1rem',
  backgroundColor: '#f8fafc',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem'
};

const readOnlyValueStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: '#334155',
  marginTop: '0.25rem'
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1.25rem'
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#334155'
};

const requiredStarStyle: React.CSSProperties = {
  color: '#ef4444',
  marginLeft: '2px'
};

const inputStyle: React.CSSProperties = {
  padding: '0.55rem 0.75rem',
  fontSize: '0.875rem',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
  width: '100%',
  transition: 'border-color 0.15s'
};

const passwordToggleStyle: React.CSSProperties = {
  position: 'absolute',
  right: '0.5rem',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#64748b',
  cursor: 'pointer',
  padding: '0.25rem 0.5rem'
};

const fieldErrorStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#ef4444',
  fontWeight: 500
};

const errorBannerStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  borderRadius: '6px',
  border: '1px solid #fecaca',
  fontSize: '0.875rem'
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
  marginTop: '0.5rem',
  paddingTop: '1rem',
  borderTop: '1px solid #f1f5f9'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '0.55rem 1.25rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  backgroundColor: '#f1f5f9',
  color: '#475569',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  cursor: 'pointer'
};

const submitButtonStyle: React.CSSProperties = {
  padding: '0.55rem 1.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};
