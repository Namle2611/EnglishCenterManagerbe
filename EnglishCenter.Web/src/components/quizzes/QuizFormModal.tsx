import React, { useEffect, useState } from 'react';
import type { QuizDetailResponse, QuizListItemResponse, TeacherQuizClassLookupItemResponse } from '../../types/quiz.types';
import { utcToLocalInput } from '../../utils/quizHelper';

interface QuizFormModalProps {
  isOpen: boolean;
  quizToEdit?: QuizListItemResponse | QuizDetailResponse | null;
  classes: TeacherQuizClassLookupItemResponse[];
  onSubmit: (formData: {
    classId: number;
    title: string;
    description: string;
    durationMinutes: number | null;
    maxAttempts: number;
    startAt: string;
    endAt: string;
  }) => Promise<void>;
  onClose: () => void;
}

export const QuizFormModal: React.FC<QuizFormModalProps> = ({
  isOpen,
  quizToEdit,
  classes,
  onSubmit,
  onClose
}) => {
  const isEditing = Boolean(quizToEdit);
  const attemptsExist = (quizToEdit?.attemptCount || 0) > 0;

  const [classId, setClassId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void Promise.resolve().then(() => {
        if (quizToEdit) {
          setClassId(quizToEdit.classId);
          setTitle(quizToEdit.title);
          setDescription(('description' in quizToEdit && quizToEdit.description) ? quizToEdit.description : '');
          setDurationMinutes(quizToEdit.durationMinutes ? quizToEdit.durationMinutes.toString() : '');
          setMaxAttempts(quizToEdit.maxAttempts ? quizToEdit.maxAttempts.toString() : '1');
          setStartAt(utcToLocalInput(quizToEdit.startAt));
          setEndAt(utcToLocalInput(quizToEdit.endAt));
        } else {
          setClassId(classes[0]?.classId || 0);
          setTitle('');
          setDescription('');
          setDurationMinutes('45');
          setMaxAttempts('1');
          setStartAt('');
          setEndAt('');
        }
        setValidationError(null);
        setIsSubmitting(false);
      });
    }
  }, [isOpen, quizToEdit, classes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Client-side validations
    if (!isEditing && (!classId || classId <= 0)) {
      setValidationError('Vui lòng chọn lớp học áp dụng.');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Tiêu đề bài kiểm tra là bắt buộc.');
      return;
    }
    if (trimmedTitle.length > 200) {
      setValidationError('Tiêu đề không được vượt quá 200 ký tự.');
      return;
    }

    const parsedMaxAttempts = parseInt(maxAttempts, 10);
    if (isNaN(parsedMaxAttempts) || parsedMaxAttempts < 1) {
      setValidationError('Số lần làm bài tối đa phải lớn hơn hoặc bằng 1.');
      return;
    }

    let parsedDuration: number | null = null;
    if (durationMinutes.trim()) {
      const dur = parseInt(durationMinutes, 10);
      if (isNaN(dur) || dur <= 0) {
        setValidationError('Thời lượng bài kiểm tra phải là số nguyên dương lớn hơn 0.');
        return;
      }
      parsedDuration = dur;
    }

    if (startAt && endAt) {
      const startDate = new Date(startAt).getTime();
      const endDate = new Date(endAt).getTime();
      if (endDate <= startDate) {
        setValidationError('Thời gian kết thúc phải sau thời gian bắt đầu.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        classId,
        title: trimmedTitle,
        description: description.trim(),
        durationMinutes: parsedDuration,
        maxAttempts: parsedMaxAttempts,
        startAt,
        endAt
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi lưu bài kiểm tra.';
      setValidationError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            {isEditing ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}
          </h2>
          <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Đóng">
            &times;
          </button>
        </div>

        {attemptsExist && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--status-warning-bg, rgba(245, 158, 11, 0.1))',
              color: 'var(--status-warning-text, #b45309)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              border: '1px solid var(--status-warning-border, rgba(245, 158, 11, 0.25))',
              marginBottom: '1rem'
            }}
          >
            ⚠️ Bài kiểm tra đã có học viên làm bài ({quizToEdit?.attemptCount} lượt). Thời lượng, số lần làm bài và thời gian mở/đóng đã bị khóa chỉnh sửa.
          </div>
        )}

        {validationError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger-text)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              border: '1px solid var(--status-danger-border)',
              marginBottom: '1rem'
            }}
          >
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Class selector: only when creating */}
          {!isEditing ? (
            <div style={formGroupStyle}>
              <label htmlFor="modal-class-select" style={labelStyle}>
                Lớp học <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                id="modal-class-select"
                value={classId}
                onChange={(e) => setClassId(parseInt(e.target.value, 10))}
                required
                style={inputStyle}
              >
                <option value={0} disabled>-- Chọn lớp học --</option>
                {classes.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.classCode} - {c.courseName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={formGroupStyle}>
              <label style={labelStyle}>Lớp học áp dụng</label>
              <div style={{ ...inputStyle, backgroundColor: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)' }}>
                {quizToEdit?.classCode} - {quizToEdit?.courseName}
              </div>
            </div>
          )}

          {/* Title */}
          <div style={formGroupStyle}>
            <label htmlFor="modal-title-input" style={labelStyle}>
              Tiêu đề bài kiểm tra <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="modal-title-input"
              type="text"
              placeholder="VD: Kiểm tra giữa kỳ Unit 1-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={formGroupStyle}>
            <label htmlFor="modal-desc-input" style={labelStyle}>Mô tả / Hướng dẫn làm bài</label>
            <textarea
              id="modal-desc-input"
              rows={3}
              placeholder="Ghi chú thêm về nội dung kiểm tra, yêu cầu hoặc quy định..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Duration */}
            <div style={formGroupStyle}>
              <label htmlFor="modal-duration-input" style={labelStyle}>Thời lượng (phút)</label>
              <input
                id="modal-duration-input"
                type="number"
                min={1}
                placeholder="Để trống nếu không giới hạn"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                disabled={attemptsExist}
                style={attemptsExist ? disabledInputStyle : inputStyle}
              />
            </div>

            {/* Max attempts */}
            <div style={formGroupStyle}>
              <label htmlFor="modal-maxattempts-input" style={labelStyle}>
                Số lần làm bài tối đa <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="modal-maxattempts-input"
                type="number"
                min={1}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                disabled={attemptsExist}
                required
                style={attemptsExist ? disabledInputStyle : inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* StartAt */}
            <div style={formGroupStyle}>
              <label htmlFor="modal-startat-input" style={labelStyle}>Thời gian mở bài kiểm tra</label>
              <input
                id="modal-startat-input"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                disabled={attemptsExist}
                style={attemptsExist ? disabledInputStyle : inputStyle}
              />
            </div>

            {/* EndAt */}
            <div style={formGroupStyle}>
              <label htmlFor="modal-endat-input" style={labelStyle}>Thời gian đóng bài kiểm tra</label>
              <input
                id="modal-endat-input"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                disabled={attemptsExist}
                style={attemptsExist ? disabledInputStyle : inputStyle}
              />
            </div>
          </div>

          <div style={footerStyle}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={cancelBtnStyle}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={submitBtnStyle}
            >
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo bản nháp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  width: '100%',
  maxWidth: '560px',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '1.75rem',
  boxShadow: 'var(--shadow-xl)',
  border: '1px solid var(--color-border)'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.25rem'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: 'var(--color-text-secondary)',
  padding: '0.25rem'
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '1.125rem'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '0.375rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  boxSizing: 'border-box'
};

const disabledInputStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: 'var(--color-surface-subtle)',
  color: 'var(--color-text-muted)',
  cursor: 'not-allowed'
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '1.5rem'
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface-subtle)',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer'
};

const submitBtnStyle: React.CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer'
};
