import React, { useEffect, useState } from 'react';
import type {
  CreateTeacherPayload,
  TeacherStatus,
  UpdateTeacherPayload
} from '../../types/teacher.types';
import { toDateInputValue } from '../../utils/teacherHelper';
import { TeacherStatusBadge } from './TeacherStatusBadge';

export interface TeacherFormValues {
  teacherCode: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  specialization: string;
  qualification: string;
  experienceYears: string | number;
  hireDate: string;
}

interface TeacherFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<TeacherFormValues>;
  readOnlyData?: {
    teacherCode?: string;
    status?: TeacherStatus;
  };
  onSubmit: (payload: CreateTeacherPayload | UpdateTeacherPayload) => Promise<void>;
  isLoading?: boolean;
  serverError?: string | null;
  onCancel?: () => void;
}

export const TeacherForm: React.FC<TeacherFormProps> = ({
  mode,
  initialValues,
  readOnlyData,
  onSubmit,
  isLoading = false,
  serverError,
  onCancel
}) => {
  const [formData, setFormData] = useState<TeacherFormValues>({
    teacherCode: initialValues?.teacherCode || '',
    email: initialValues?.email || '',
    password: initialValues?.password || '',
    fullName: initialValues?.fullName || '',
    phone: initialValues?.phone || '',
    avatarUrl: initialValues?.avatarUrl || '',
    specialization: initialValues?.specialization || '',
    qualification: initialValues?.qualification || '',
    experienceYears:
      initialValues?.experienceYears !== undefined && initialValues?.experienceYears !== null
        ? String(initialValues.experienceYears)
        : '',
    hireDate: toDateInputValue(initialValues?.hireDate)
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync when initialValues change (e.g. after fetch in Edit mode)
  useEffect(() => {
    if (initialValues) {
      setFormData({
        teacherCode: initialValues.teacherCode || '',
        email: initialValues.email || '',
        password: initialValues.password || '',
        fullName: initialValues.fullName || '',
        phone: initialValues.phone || '',
        avatarUrl: initialValues.avatarUrl || '',
        specialization: initialValues.specialization || '',
        qualification: initialValues.qualification || '',
        experienceYears:
          initialValues.experienceYears !== undefined && initialValues.experienceYears !== null
            ? String(initialValues.experienceYears)
            : '',
        hireDate: toDateInputValue(initialValues.hireDate)
      });
    }
  }, [initialValues]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for field as user edits
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

    // TeacherCode (Create only)
    if (mode === 'create') {
      const code = formData.teacherCode.trim();
      if (!code) {
        errors.teacherCode = 'Mã giáo viên là bắt buộc.';
      } else if (code.length > 20) {
        errors.teacherCode = 'Mã giáo viên không được vượt quá 20 ký tự.';
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

    // Specialization
    const spec = formData.specialization.trim();
    if (!spec) {
      errors.specialization = 'Chuyên môn là bắt buộc.';
    } else if (spec.length > 150) {
      errors.specialization = 'Chuyên môn không được vượt quá 150 ký tự.';
    }

    // Qualification
    const qual = formData.qualification.trim();
    if (qual && qual.length > 255) {
      errors.qualification = 'Bằng cấp / Chứng chỉ không được vượt quá 255 ký tự.';
    }

    // ExperienceYears: 0 is valid, empty string is invalid, negative/decimal/NaN is invalid
    const expRaw = String(formData.experienceYears).trim();
    if (expRaw === '') {
      errors.experienceYears = 'Số năm kinh nghiệm là bắt buộc.';
    } else {
      const expNum = Number(expRaw);
      if (isNaN(expNum) || !Number.isInteger(expNum) || expNum < 0) {
        errors.experienceYears = 'Số năm kinh nghiệm phải là số nguyên không âm (≥ 0).';
      }
    }

    // HireDate: required and cannot be in future
    if (!formData.hireDate) {
      errors.hireDate = 'Ngày vào làm là bắt buộc.';
    } else {
      const today = new Date().toISOString().substring(0, 10);
      if (formData.hireDate > today) {
        errors.hireDate = 'Ngày vào làm không thể ở trong tương lai.';
      }
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
        const payload: CreateTeacherPayload = {
          teacherCode: formData.teacherCode.trim(),
          email: formData.email.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim() || null,
          avatarUrl: formData.avatarUrl.trim() || null,
          specialization: formData.specialization.trim(),
          qualification: formData.qualification.trim() || null,
          experienceYears: Number(formData.experienceYears),
          hireDate: formData.hireDate
        };
        await onSubmit(payload);
      } else {
        const payload: UpdateTeacherPayload = {
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim() || null,
          avatarUrl: formData.avatarUrl.trim() || null,
          specialization: formData.specialization.trim(),
          qualification: formData.qualification.trim() || null,
          experienceYears: Number(formData.experienceYears),
          hireDate: formData.hireDate
        };
        await onSubmit(payload);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} style={formContainerStyle} noValidate>
      {serverError && (
        <div style={serverErrorStyle} role="alert">
          {serverError}
        </div>
      )}

      {/* Read-only Context for Edit Mode */}
      {mode === 'edit' && readOnlyData && (
        <div style={readOnlyCardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={readOnlyLabelStyle}>Mã giáo viên (Cố định):</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>
              {readOnlyData.teacherCode || formData.teacherCode}
            </span>
          </div>
          {readOnlyData.status && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={readOnlyLabelStyle}>Trạng thái hiện tại:</span>
              <TeacherStatusBadge status={readOnlyData.status} />
            </div>
          )}
        </div>
      )}

      {/* Section 1: Account Information */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>1. Thông tin tài khoản & Định danh</h3>
        <div style={gridStyle}>
          {/* Teacher Code (Create only) */}
          {mode === 'create' && (
            <div style={formGroupStyle}>
              <label htmlFor="teacherCode" style={labelStyle}>
                Mã giáo viên <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="teacherCode"
                name="teacherCode"
                type="text"
                value={formData.teacherCode}
                onChange={handleChange}
                placeholder="Ví dụ: TEA001"
                disabled={isBusy}
                maxLength={20}
                style={{
                  ...inputStyle,
                  borderColor: validationErrors.teacherCode ? '#ef4444' : '#cbd5e1'
                }}
              />
              {validationErrors.teacherCode && (
                <span style={fieldErrorStyle}>{validationErrors.teacherCode}</span>
              )}
            </div>
          )}

          {/* Email */}
          <div style={formGroupStyle}>
            <label htmlFor="email" style={labelStyle}>
              Email đăng nhập <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="teacher@example.com"
              disabled={isBusy}
              maxLength={255}
              style={{
                ...inputStyle,
                borderColor: validationErrors.email ? '#ef4444' : '#cbd5e1'
              }}
            />
            {validationErrors.email && (
              <span style={fieldErrorStyle}>{validationErrors.email}</span>
            )}
          </div>

          {/* Password (Create only) */}
          {mode === 'create' && (
            <div style={formGroupStyle}>
              <label htmlFor="password" style={labelStyle}>
                Mật khẩu ban đầu <span style={{ color: '#ef4444' }}>*</span>
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
                    borderColor: validationErrors.password ? '#ef4444' : '#cbd5e1'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={togglePasswordButtonStyle}
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

      {/* Section 2: Personal Profile */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>2. Thông tin cá nhân</h3>
        <div style={gridStyle}>
          {/* Full Name */}
          <div style={formGroupStyle}>
            <label htmlFor="fullName" style={labelStyle}>
              Họ và tên <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              disabled={isBusy}
              maxLength={150}
              style={{
                ...inputStyle,
                borderColor: validationErrors.fullName ? '#ef4444' : '#cbd5e1'
              }}
            />
            {validationErrors.fullName && (
              <span style={fieldErrorStyle}>{validationErrors.fullName}</span>
            )}
          </div>

          {/* Phone */}
          <div style={formGroupStyle}>
            <label htmlFor="phone" style={labelStyle}>
              Số điện thoại
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0912345678"
              disabled={isBusy}
              maxLength={20}
              style={{
                ...inputStyle,
                borderColor: validationErrors.phone ? '#ef4444' : '#cbd5e1'
              }}
            />
            {validationErrors.phone && (
              <span style={fieldErrorStyle}>{validationErrors.phone}</span>
            )}
          </div>

          {/* Avatar URL */}
          <div style={{ ...formGroupStyle, gridColumn: 'span 2' }}>
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
              disabled={isBusy}
              maxLength={500}
              style={{
                ...inputStyle,
                borderColor: validationErrors.avatarUrl ? '#ef4444' : '#cbd5e1'
              }}
            />
            {validationErrors.avatarUrl && (
              <span style={fieldErrorStyle}>{validationErrors.avatarUrl}</span>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Professional Info */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>3. Thông tin chuyên môn & Công tác</h3>
        <div style={gridStyle}>
          {/* Specialization */}
          <div style={formGroupStyle}>
            <label htmlFor="specialization" style={labelStyle}>
              Chuyên môn <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="specialization"
              name="specialization"
              type="text"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="Ví dụ: IELTS, TOEIC, Giao tiếp..."
              disabled={isBusy}
              maxLength={150}
              style={{
                ...inputStyle,
                borderColor: validationErrors.specialization ? '#ef4444' : '#cbd5e1'
              }}
            />
            {validationErrors.specialization && (
              <span style={fieldErrorStyle}>{validationErrors.specialization}</span>
            )}
          </div>

          {/* Qualification */}
          <div style={formGroupStyle}>
            <label htmlFor="qualification" style={labelStyle}>
              Bằng cấp / Chứng chỉ
            </label>
            <input
              id="qualification"
              name="qualification"
              type="text"
              value={formData.qualification}
              onChange={handleChange}
              placeholder="Ví dụ: Thạc sĩ TESOL, IELTS 8.5..."
              disabled={isBusy}
              maxLength={255}
              style={{
                ...inputStyle,
                borderColor: validationErrors.qualification ? '#ef4444' : '#cbd5e1'
              }}
            />
            {validationErrors.qualification && (
              <span style={fieldErrorStyle}>{validationErrors.qualification}</span>
            )}
          </div>

          {/* Experience Years */}
          <div style={formGroupStyle}>
            <label htmlFor="experienceYears" style={labelStyle}>
              Số năm kinh nghiệm <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="experienceYears"
              name="experienceYears"
              type="number"
              min="0"
              step="1"
              value={formData.experienceYears}
              onChange={handleChange}
              placeholder="0"
              disabled={isBusy}
              style={{
                ...inputStyle,
                borderColor: validationErrors.experienceYears ? '#ef4444' : '#cbd5e1'
              }}
            />
            {validationErrors.experienceYears && (
              <span style={fieldErrorStyle}>{validationErrors.experienceYears}</span>
            )}
          </div>

          {/* Hire Date */}
          <div style={formGroupStyle}>
            <label htmlFor="hireDate" style={labelStyle}>
              Ngày vào làm <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="hireDate"
              name="hireDate"
              type="date"
              value={formData.hireDate}
              onChange={handleChange}
              disabled={isBusy}
              style={{
                ...inputStyle,
                borderColor: validationErrors.hireDate ? '#ef4444' : '#cbd5e1'
              }}
            />
            {validationErrors.hireDate && (
              <span style={fieldErrorStyle}>{validationErrors.hireDate}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={formActionsStyle}>
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
            ? 'Đang xử lý...'
            : mode === 'create'
            ? 'Tạo mới giáo viên'
            : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
};

const formContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  backgroundColor: '#ffffff',
  padding: '1.75rem',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  fontWeight: 600,
  color: '#0f172a',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '0.5rem'
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem'
};

const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#334155'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.55rem 0.75rem',
  fontSize: '0.875rem',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  outline: 'none',
  backgroundColor: '#ffffff',
  color: '#1e293b',
  transition: 'border-color 0.15s ease'
};

const togglePasswordButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: '0.5rem',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  color: '#64748b',
  fontSize: '0.8rem',
  fontWeight: 500,
  cursor: 'pointer',
  padding: '0.25rem 0.5rem'
};

const fieldErrorStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#ef4444',
  marginTop: '0.15rem'
};

const serverErrorStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  color: '#b91c1c',
  fontSize: '0.875rem'
};

const readOnlyCardStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2rem',
  padding: '0.875rem 1.25rem',
  backgroundColor: '#f8fafc',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  alignItems: 'center'
};

const readOnlyLabelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#64748b',
  textTransform: 'uppercase',
  fontWeight: 600
};

const formActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  paddingTop: '1rem',
  borderTop: '1px solid #f1f5f9'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '0.55rem 1.25rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#475569',
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  cursor: 'pointer'
};

const submitButtonStyle: React.CSSProperties = {
  padding: '0.55rem 1.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#ffffff',
  backgroundColor: '#2563eb',
  border: 'none',
  borderRadius: '6px'
};
