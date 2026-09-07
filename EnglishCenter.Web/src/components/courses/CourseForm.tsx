import React, { useState } from 'react';
import type { CourseDetail, CreateCoursePayload, UpdateCoursePayload } from '../../types/course.types';
import { validateDurationMonths, validateTuitionFee } from '../../utils/courseHelper';

type CourseFormProps =
  | {
      mode: 'create';
      initialData?: never;
      onSubmit: (payload: CreateCoursePayload) => Promise<void>;
      onCancel: () => void;
      isSubmitting?: boolean;
      serverError?: string | null;
    }
  | {
      mode: 'edit';
      initialData?: CourseDetail | null;
      onSubmit: (payload: UpdateCoursePayload) => Promise<void>;
      onCancel: () => void;
      isSubmitting?: boolean;
      serverError?: string | null;
    };

export const CourseForm: React.FC<CourseFormProps> = (props) => {
  const {
    mode,
    initialData,
    onCancel,
    isSubmitting = false,
    serverError = null
  } = props;

  // Form field states
  const [courseCode, setCourseCode] = useState<string>(initialData?.courseCode || '');
  const [courseName, setCourseName] = useState<string>(initialData?.courseName || '');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [level, setLevel] = useState<string>(initialData?.level || '');
  const [durationMonths, setDurationMonths] = useState<string>(
    initialData?.durationMonths !== undefined ? String(initialData.durationMonths) : ''
  );
  const [tuitionFee, setTuitionFee] = useState<string>(
    initialData?.tuitionFee !== undefined ? String(initialData.tuitionFee) : ''
  );

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. CourseCode (only validated in create mode)
    if (mode === 'create') {
      const codeTrim = courseCode.trim();
      if (codeTrim.length === 0) {
        newErrors.courseCode = 'Mã khóa học là bắt buộc.';
      } else if (codeTrim.length > 30) {
        newErrors.courseCode = 'Mã khóa học không được vượt quá 30 ký tự.';
      }
    }

    // 2. CourseName
    const nameTrim = courseName.trim();
    if (nameTrim.length === 0) {
      newErrors.courseName = 'Tên khóa học là bắt buộc.';
    } else if (nameTrim.length > 200) {
      newErrors.courseName = 'Tên khóa học không được vượt quá 200 ký tự.';
    }

    // 3. Level (optional, max 50)
    if (level.trim().length > 50) {
      newErrors.level = 'Trình độ không được vượt quá 50 ký tự.';
    }

    // 4. DurationMonths (must be positive integer)
    const durationValidation = validateDurationMonths(durationMonths);
    if (!durationValidation.isValid) {
      newErrors.durationMonths = durationValidation.error || 'Thời lượng không hợp lệ.';
    }

    // 5. TuitionFee (must be non-negative decimal string, scale <= 2, no commas)
    const feeValidation = validateTuitionFee(tuitionFee);
    if (!feeValidation.isValid) {
      newErrors.tuitionFee = feeValidation.error || 'Học phí không hợp lệ.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const durationVal = validateDurationMonths(durationMonths).value!;
    const feeVal = tuitionFee.trim(); // Transmitted as validated decimal string to prevent floating-point precision loss
    const descVal = description.trim().length > 0 ? description.trim() : null;
    const levelVal = level.trim().length > 0 ? level.trim() : null;

    if (props.mode === 'create') {
      const payload: CreateCoursePayload = {
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        description: descVal,
        level: levelVal,
        durationMonths: durationVal,
        tuitionFee: feeVal
      };
      await props.onSubmit(payload);
    } else {
      const payload: UpdateCoursePayload = {
        courseName: courseName.trim(),
        description: descVal,
        level: levelVal,
        durationMonths: durationVal,
        tuitionFee: feeVal
      };
      await props.onSubmit(payload);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: '860px'
      }}
    >
      {serverError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '0.875rem 1.125rem',
            fontSize: '0.875rem'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{serverError}</span>
        </div>
      )}

      {/* Section 1: Thông tin cơ bản */}
      <div
        style={{
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
        }}
      >
        <h3
          style={{
            margin: '0 0 1.25rem 0',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-text, #0f172a)',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--color-border, #f1f5f9)'
          }}
        >
          Thông tin cơ bản
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {/* CourseCode */}
          <div style={fieldGroupStyle}>
            <label htmlFor="course-code" style={labelStyle}>
              Mã khóa học <span style={{ color: '#ef4444' }}>*</span>
            </label>
            {mode === 'create' ? (
              <input
                id="course-code"
                type="text"
                value={courseCode}
                onChange={(e) => {
                  setCourseCode(e.target.value);
                  if (errors.courseCode) {
                    setErrors((prev) => ({ ...prev, courseCode: '' }));
                  }
                }}
                placeholder="Ví dụ: IELTS_BASIC, TOEIC_500..."
                disabled={isSubmitting}
                maxLength={30}
                style={{
                  ...inputStyle,
                  borderColor: errors.courseCode ? '#ef4444' : 'var(--color-border, #cbd5e1)'
                }}
              />
            ) : (
              <input
                id="course-code"
                type="text"
                value={courseCode}
                disabled
                style={{
                  ...inputStyle,
                  backgroundColor: 'var(--color-surface-hover, #f1f5f9)',
                  color: 'var(--color-text-muted, #64748b)',
                  cursor: 'not-allowed'
                }}
                title="Mã khóa học là bất biến sau khi tạo"
              />
            )}
            {errors.courseCode && <span style={fieldErrorStyle}>{errors.courseCode}</span>}
            {mode === 'edit' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
                Mã khóa học không thể chỉnh sửa sau khi tạo.
              </span>
            )}
          </div>

          {/* CourseName */}
          <div style={fieldGroupStyle}>
            <label htmlFor="course-name" style={labelStyle}>
              Tên khóa học <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="course-name"
              type="text"
              value={courseName}
              onChange={(e) => {
                setCourseName(e.target.value);
                if (errors.courseName) {
                  setErrors((prev) => ({ ...prev, courseName: '' }));
                }
              }}
              placeholder="Ví dụ: Khóa học Tiếng Anh Giao Tiếp Cơ Bản"
              disabled={isSubmitting}
              maxLength={200}
              style={{
                ...inputStyle,
                borderColor: errors.courseName ? '#ef4444' : 'var(--color-border, #cbd5e1)'
              }}
            />
            {errors.courseName && <span style={fieldErrorStyle}>{errors.courseName}</span>}
          </div>

          {/* Level */}
          <div style={fieldGroupStyle}>
            <label htmlFor="course-level" style={labelStyle}>
              Trình độ (tùy chọn)
            </label>
            <input
              id="course-level"
              type="text"
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                if (errors.level) {
                  setErrors((prev) => ({ ...prev, level: '' }));
                }
              }}
              placeholder="Ví dụ: A1, B2, 6.5+, Sơ cấp..."
              disabled={isSubmitting}
              maxLength={50}
              style={{
                ...inputStyle,
                borderColor: errors.level ? '#ef4444' : 'var(--color-border, #cbd5e1)'
              }}
            />
            {errors.level && <span style={fieldErrorStyle}>{errors.level}</span>}
          </div>
        </div>
      </div>

      {/* Section 2: Thời lượng & Học phí */}
      <div
        style={{
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
        }}
      >
        <h3
          style={{
            margin: '0 0 1.25rem 0',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-text, #0f172a)',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--color-border, #f1f5f9)'
          }}
        >
          Thời lượng & Học phí
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {/* DurationMonths */}
          <div style={fieldGroupStyle}>
            <label htmlFor="course-duration" style={labelStyle}>
              Thời lượng (tháng) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="course-duration"
              type="number"
              min="1"
              step="1"
              value={durationMonths}
              onChange={(e) => {
                setDurationMonths(e.target.value);
                if (errors.durationMonths) {
                  setErrors((prev) => ({ ...prev, durationMonths: '' }));
                }
              }}
              placeholder="Ví dụ: 3, 6, 12..."
              disabled={isSubmitting}
              style={{
                ...inputStyle,
                borderColor: errors.durationMonths ? '#ef4444' : 'var(--color-border, #cbd5e1)'
              }}
            />
            {errors.durationMonths && <span style={fieldErrorStyle}>{errors.durationMonths}</span>}
          </div>

          {/* TuitionFee */}
          <div style={fieldGroupStyle}>
            <label htmlFor="course-tuition" style={labelStyle}>
              Học phí (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="course-tuition"
              type="text"
              value={tuitionFee}
              onChange={(e) => {
                setTuitionFee(e.target.value);
                if (errors.tuitionFee) {
                  setErrors((prev) => ({ ...prev, tuitionFee: '' }));
                }
              }}
              placeholder="Ví dụ: 1500000 hoặc 1500000.50 (nhập 0 nếu miễn phí)"
              disabled={isSubmitting}
              style={{
                ...inputStyle,
                borderColor: errors.tuitionFee ? '#ef4444' : 'var(--color-border, #cbd5e1)'
              }}
            />
            {errors.tuitionFee && <span style={fieldErrorStyle}>{errors.tuitionFee}</span>}
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
              Nhập số không dấu phẩy (ví dụ: 1500000; có thể nhập 0; tối đa 2 chữ số thập phân).
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: Mô tả chi tiết */}
      <div
        style={{
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
        }}
      >
        <h3
          style={{
            margin: '0 0 1.25rem 0',
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-text, #0f172a)',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--color-border, #f1f5f9)'
          }}
        >
          Mô tả khóa học
        </h3>

        <div style={fieldGroupStyle}>
          <label htmlFor="course-desc" style={labelStyle}>
            Nội dung mô tả (tùy chọn)
          </label>
          <textarea
            id="course-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập thông tin chi tiết, mục tiêu, đối tượng tham gia khóa học..."
            disabled={isSubmitting}
            style={{
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text, #0f172a)',
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          paddingTop: '0.5rem'
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: '0.5625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: 'var(--color-surface, #ffffff)',
            color: 'var(--color-text-secondary, #475569)',
            border: '1px solid var(--color-border, #cbd5e1)',
            borderRadius: 'var(--radius-md, 8px)',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '0.5625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            backgroundColor: 'var(--color-primary, #1e40af)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-md, 8px)',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Đang tạo khóa học...'
              : 'Đang lưu thay đổi...'
            : mode === 'create'
              ? 'Tạo khóa học'
              : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary, #334155)'
};

const inputStyle: React.CSSProperties = {
  padding: '0.5625rem 0.875rem',
  fontSize: '0.875rem',
  borderRadius: 'var(--radius-md, 8px)',
  border: '1px solid var(--color-border, #cbd5e1)',
  backgroundColor: 'var(--color-surface, #ffffff)',
  color: 'var(--color-text, #0f172a)',
  outline: 'none',
  transition: 'border-color 0.15s ease'
};

const fieldErrorStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#ef4444',
  marginTop: '0.125rem'
};

