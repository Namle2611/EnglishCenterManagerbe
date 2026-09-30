import React, { useRef, useState } from 'react';
import type {
  AssignmentDetail,
  CreateSubmissionPayload,
  SubmissionDetail,
  UpdateSubmissionPayload
} from '../../types/assignment.types';
import {
  isPastDeadline,
  isValidHttpUrl,
  normalizeNullableString
} from '../../utils/assignmentHelper';

interface StudentSubmissionFormProps {
  assignment: AssignmentDetail;
  existingSubmission?: SubmissionDetail | null;
  onSubmit: (payload: CreateSubmissionPayload | UpdateSubmissionPayload) => Promise<void>;
  isResubmit?: boolean;
}

export const StudentSubmissionForm: React.FC<StudentSubmissionFormProps> = ({
  assignment,
  existingSubmission,
  onSubmit,
  isResubmit = false
}) => {
  const [content, setContent] = useState<string>(existingSubmission?.content || '');
  const [fileUrl, setFileUrl] = useState<string>(existingSubmission?.fileUrl || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const isLate = isPastDeadline(assignment.deadline);
  const isCompletedMember = assignment.studentMembershipStatus === 'Completed';

  // Completed students cannot submit or resubmit
  if (isCompletedMember) {
    return (
      <div
        style={{
          padding: '1.25rem',
          backgroundColor: 'rgba(107, 114, 128, 0.08)',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border, #e5e7eb)',
          color: 'var(--color-text-secondary, #4b5563)',
          fontSize: '0.9rem',
          lineHeight: 1.5
        }}
      >
        <span style={{ marginRight: '0.4rem' }}>ℹ️</span>
        Bạn đã hoàn thành lớp học. Bài tập được hiển thị ở chế độ chỉ đọc.
      </div>
    );
  }

  // Graded submissions cannot be resubmitted
  if (existingSubmission?.isGraded) {
    return (
      <div
        style={{
          padding: '1.25rem',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#059669',
          fontSize: '0.9rem',
          lineHeight: 1.5
        }}
      >
        <span style={{ marginRight: '0.4rem' }}>✓</span>
        Bài làm của bạn đã được chấm điểm. Không thể chỉnh sửa hoặc nộp lại.
      </div>
    );
  }

  // Closed assignment cannot receive submissions
  if (assignment.status === 'Closed') {
    return (
      <div
        style={{
          padding: '1.25rem',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#dc2626',
          fontSize: '0.9rem',
          lineHeight: 1.5
        }}
      >
        <span style={{ marginRight: '0.4rem' }}>🔒</span>
        Bài tập đã đóng. Không thể nộp bài hoặc chỉnh sửa bài nộp.
      </div>
    );
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const trimmedContent = content.trim();
    const trimmedFileUrl = fileUrl.trim();

    // At least one nonblank
    if (!trimmedContent && !trimmedFileUrl) {
      newErrors.general = 'Vui lòng nhập nội dung bài làm hoặc cung cấp đường dẫn tệp đính kèm';
    }

    // File URL validation
    if (trimmedFileUrl) {
      if (trimmedFileUrl.length > 500) {
        newErrors.fileUrl = 'Đường dẫn tệp không được vượt quá 500 ký tự';
      } else if (!isValidHttpUrl(trimmedFileUrl)) {
        newErrors.fileUrl = 'Đường dẫn tệp phải là URL hợp lệ bắt đầu bằng http:// hoặc https://';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    const strictPayload = {
      fileUrl: normalizeNullableString(fileUrl),
      content: normalizeNullableString(content)
    };

    try {
      await onSubmit(strictPayload);
      setSuccessMessage(
        isResubmit ? 'Cập nhật bài nộp thành công!' : 'Nộp bài tập thành công!'
      );
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { message?: string } } };
        setServerError(axErr.response?.data?.message || 'Có lỗi xảy ra khi nộp bài.');
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Có lỗi xảy ra khi nộp bài.');
      }
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        borderRadius: 'var(--radius-xl, 12px)',
        border: '1px solid var(--color-border, #e5e7eb)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        padding: '1.5rem',
        marginTop: '1.5rem'
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
        {isResubmit ? 'Cập nhật bài nộp' : 'Nộp bài tập'}
      </h3>

      {/* Late Submission Warning Banner */}
      {isLate && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: '#b45309',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md, 6px)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <span>
            Đã quá hạn nộp bài. Bài nộp sẽ được ghi nhận là <strong>nộp muộn</strong>.
          </span>
        </div>
      )}

      {/* Server Success & Error Banners */}
      {successMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: '#059669',
            borderRadius: 'var(--radius-md, 6px)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}
        >
          {successMessage}
        </div>
      )}

      {serverError && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#dc2626',
            borderRadius: 'var(--radius-md, 6px)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}
        >
          {serverError}
        </div>
      )}

      {errors.general && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#dc2626',
            borderRadius: 'var(--radius-md, 6px)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}
        >
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Content textarea */}
        <div>
          <label
            htmlFor="submission-content"
            style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text-primary, #374151)' }}
          >
            Nội dung bài làm (Văn bản)
          </label>
          <textarea
            id="submission-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung câu trả lời hoặc bài làm của bạn..."
            rows={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              border: '1px solid var(--color-border, #d1d5db)',
              borderRadius: 'var(--radius-md, 6px)',
              outline: 'none',
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* File URL input */}
        <div>
          <label
            htmlFor="submission-fileurl"
            style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text-primary, #374151)' }}
          >
            Đường dẫn tệp bài làm (Google Drive, OneDrive, GitHub, link tài liệu...)
          </label>
          <input
            id="submission-fileurl"
            type="url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://drive.google.com/... (tối đa 500 ký tự)"
            maxLength={500}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              fontSize: '0.875rem',
              border: `1px solid ${errors.fileUrl ? '#dc2626' : 'var(--color-border, #d1d5db)'}`,
              borderRadius: 'var(--radius-md, 6px)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {errors.fileUrl && (
            <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>
              {errors.fileUrl}
            </span>
          )}
        </div>

        {/* Submit button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
          <button
            id="submission-submit-btn"
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.6rem 1.5rem',
              minHeight: '40px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: 'var(--color-primary, #2563eb)',
              border: 'none',
              borderRadius: 'var(--radius-md, 6px)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'background-color 0.15s'
            }}
          >
            {isSubmitting
              ? 'Đang xử lý...'
              : isResubmit
              ? 'Cập nhật bài nộp'
              : 'Nộp bài'}
          </button>
        </div>
      </form>
    </div>
  );
};
