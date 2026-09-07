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
    } else if (email.length > 256) {
      errors.email = 'Email không được vượt quá 256 ký tự.';
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
    } else if (fullName.length > 100) {
      errors.fullName = 'Họ và tên không được vượt quá 100 ký tự.';
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
    } else if (spec.length > 100) {
      errors.specialization = 'Chuyên môn không được vượt quá 100 ký tự.';
    }

    // Qualification
    const qual = formData.qualification.trim();
    if (qual && qual.length > 200) {
      errors.qualification = 'Bằng cấp / Chứng chỉ không được vượt quá 200 ký tự.';
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
        setFormData((prev) => ({ ...prev, password: '' }));
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
              <span style={readOnlyLabelStyle}>Mã giáo viên (bất biến)</span>
              <span style={readOnlyCodeBadgeStyle} className="font-mono">
                {readOnlyData.teacherCode || '—'}
              </span>
            </div>

            {readOnlyData.status && (
              <div style={readOnlyItemStyle}>
                <span style={readOnlyLabelStyle}>Trạng thái hiện tại</span>
                <div style={{ marginTop: '0.2rem' }}>
                  <TeacherStatusBadge status={readOnlyData.status} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 1: Core Account Info */}
      <div style={sectionCardStyle}>
        <h3 style={sectionTitleStyle}>Thông tin định danh & tài khoản</h3>
        <p style={sectionSubtitleStyle}>Các trường bắt buộc để thiết lập tài khoản giáo viên trong trung tâm.</p>

        <div style={fieldsGridStyle}>
          {mode === 'create' && (
            <div style={fieldGroupStyle}>
              <label htmlFor="teacherCode" style={labelStyle}>
                Mã giáo viên <span style={{ color: 'var(--status-danger-text)' }}>*</span>
              </label>
              <input
                id="teacherCode"
                name="teacherCode"
                type="text"
                value={formData.teacherCode}
                onChange={handleChange}
                placeholder="VD: TCH2026001"
                maxLength={20}
                disabled={isBusy}
                style={{
                  ...inputStyle,
                  borderColor: validationErrors.teacherCode ? 'var(--status-danger-border)' : 'var(--color-border-strong)'
                }}
                required
              />
              {validationErrors.teacherCode && (
                <span style={fieldErrorStyle}>{validationErrors.teacherCode}</span>
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
              placeholder="VD: Nguyễn Văn B"
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
              placeholder="teacher@example.com"
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

      {/* Section 2: Professional & Academic Qualifications */}
      <div style={sectionCardStyle}>
        <h3 style={sectionTitleStyle}>Chuyên môn & Học vị giảng dạy</h3>
        <p style={sectionSubtitleStyle}>Thông tin bằng cấp, kinh nghiệm và ngày bắt đầu công tác.</p>

        <div style={fieldsGridStyle}>
          <div style={fieldGroupStyle}>
            <label htmlFor="specialization" style={labelStyle}>
              Chuyên môn đào tạo <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <input
              id="specialization"
              name="specialization"
              type="text"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="VD: IELTS, Tiếng Anh Giao Tiếp, Ngữ Pháp..."
              maxLength={100}
              disabled={isBusy}
              style={{
                ...inputStyle,
                borderColor: validationErrors.specialization ? 'var(--status-danger-border)' : 'var(--color-border-strong)'
              }}
              required
            />
            {validationErrors.specialization && (
              <span style={fieldErrorStyle}>{validationErrors.specialization}</span>
            )}
          </div>

          <div style={fieldGroupStyle}>
            <label htmlFor="experienceYears" style={labelStyle}>
              Kinh nghiệm giảng dạy (Năm) <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <input
              id="experienceYears"
              name="experienceYears"
              type="number"
              min="0"
              step="1"
              value={formData.experienceYears}
              onChange={handleChange}
              placeholder="0, 1, 2..."
              disabled={isBusy}
              className="tabular-nums"
              style={{
                ...inputStyle,
                borderColor: validationErrors.experienceYears ? 'var(--status-danger-border)' : 'var(--color-border-strong)'
              }}
              required
            />
            {validationErrors.experienceYears && (
              <span style={fieldErrorStyle}>{validationErrors.experienceYears}</span>
            )}
          </div>

          <div style={fieldGroupStyle}>
            <label htmlFor="hireDate" style={labelStyle}>
              Ngày vào làm <span style={{ color: 'var(--status-danger-text)' }}>*</span>
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
                borderColor: validationErrors.hireDate ? 'var(--status-danger-border)' : 'var(--color-border-strong)'
              }}
              required
            />
            {validationErrors.hireDate && (
              <span style={fieldErrorStyle}>{validationErrors.hireDate}</span>
            )}
          </div>

          <div style={fieldGroupStyle}>
            <label htmlFor="qualification" style={labelStyle}>Bằng cấp / Chứng chỉ</label>
            <input
              id="qualification"
              name="qualification"
              type="text"
              value={formData.qualification}
              onChange={handleChange}
              placeholder="VD: Thạc sĩ Ngôn ngữ Anh, CELTA, TESOL..."
              maxLength={200}
              disabled={isBusy}
              style={inputStyle}
            />
            {validationErrors.qualification && (
              <span style={fieldErrorStyle}>{validationErrors.qualification}</span>
            )}
          </div>

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
            <label htmlFor="avatarUrl" style={labelStyle}>Ảnh đại diện (URL)</label>
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

      {/* Actions */}
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
            ? '+ Tạo giáo viên mới'
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
