import React, { useEffect, useRef, useState } from 'react';
import type { GradeItemResponse } from '../../types/grade.types';
import { assignmentService } from '../../services/assignment.service';
import { buildGradeSubmissionPayload, validateScore } from '../../utils/gradeHelper';

interface AssignmentGradeModalProps {
  isOpen: boolean;
  item: GradeItemResponse | null;
  studentName?: string;
  onClose: () => void;
  onGradedSuccess: () => void;
}

export const AssignmentGradeModal: React.FC<AssignmentGradeModalProps> = ({
  isOpen,
  item,
  studentName,
  onClose,
  onGradedSuccess
}) => {
  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // In-flight guard ref to prevent rapid double-clicks from firing multiple PUT requests
  const inFlightRef = useRef<boolean>(false);
  const scoreInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form state when modal opens
  useEffect(() => {
    if (isOpen && item) {
      void Promise.resolve().then(() => {
        setScoreInput(item.rawScore !== null && item.rawScore !== undefined ? String(item.rawScore) : '');
        setFeedbackInput(item.feedback || '');
        setValidationError(null);
        setServerError(null);
        setIsSubmitting(false);
      });
      inFlightRef.current = false;

      // Focus the score input on open
      setTimeout(() => {
        scoreInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, item]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !inFlightRef.current) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // In-flight guard: prevent duplicate submission if request is already active
    if (inFlightRef.current) {
      return;
    }

    if (!item.submissionId) {
      setServerError('Không tìm thấy bài nộp hợp lệ để chấm điểm.');
      return;
    }

    // Validate score
    const validation = validateScore(scoreInput, item.maxScore);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Điểm số không hợp lệ.');
      return;
    }

    setValidationError(null);
    setServerError(null);

    // Set both ref and state immediately
    inFlightRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = buildGradeSubmissionPayload(scoreInput, feedbackInput);
      const res = await assignmentService.gradeSubmission(
        item.sourceId,
        item.submissionId,
        payload
      );

      if (res.success) {
        onGradedSuccess();
        onClose();
      } else {
        setServerError(res.message || 'Chấm điểm không thành công.');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
          response?: { status?: number; data?: { message?: string } };
        };
        const status = axiosErr.response?.status;
        const msg = axiosErr.response?.data?.message;

        if (status === 400) {
          setServerError(msg || 'Dữ liệu chấm điểm không hợp lệ.');
        } else if (status === 403) {
          setServerError('Bạn không có quyền chấm điểm bài tập này.');
        } else if (status === 404) {
          setServerError('Bài nộp không tồn tại hoặc đã bị thay đổi.');
        } else {
          setServerError(msg || 'Lỗi hệ thống khi lưu điểm bài tập.');
        }
      } else {
        setServerError('Không thể kết nối tới máy chủ.');
      }
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="grade-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '500px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3
              id="grade-modal-title"
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #111827)'
              }}
            >
              Chấm điểm bài tập
            </h3>
            {studentName && (
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary, #6b7280)', marginTop: '0.2rem' }}>
                Học viên: <strong>{studentName}</strong>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: '#9ca3af',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: '0.25rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
              {item.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b7280)', marginTop: '0.15rem' }}>
              Điểm tối đa: <strong>{item.maxScore}</strong>
            </div>
          </div>

          {/* Error alerts */}
          {validationError && (
            <div
              role="alert"
              style={{
                padding: '0.6rem 0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-sm, 4px)',
                color: '#b91c1c',
                fontSize: '0.85rem'
              }}
            >
              {validationError}
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              style={{
                padding: '0.6rem 0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-sm, 4px)',
                color: '#b91c1c',
                fontSize: '0.85rem'
              }}
            >
              {serverError}
            </div>
          )}

          {/* Score Input */}
          <div>
            <label
              htmlFor="grade-score-input"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #111827)',
                marginBottom: '0.35rem'
              }}
            >
              Điểm số <span style={{ color: '#dc2626' }}>*</span> (0 - {item.maxScore})
            </label>
            <input
              ref={scoreInputRef}
              type="number"
              id="grade-score-input"
              name="score"
              min="0"
              max={item.maxScore}
              step="any"
              required
              disabled={isSubmitting}
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              placeholder={`Nhập điểm (tối đa ${item.maxScore})`}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                fontSize: '0.9rem',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: 'var(--radius-md, 6px)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Feedback Input */}
          <div>
            <label
              htmlFor="grade-feedback-input"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #111827)',
                marginBottom: '0.35rem'
              }}
            >
              Nhận xét giáo viên (không bắt buộc)
            </label>
            <textarea
              id="grade-feedback-input"
              name="feedback"
              rows={4}
              disabled={isSubmitting}
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="Nhập nhận xét hoặc phản hồi cho học viên..."
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                fontSize: '0.875rem',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: 'var(--radius-md, 6px)',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--color-border, #f3f4f6)'
            }}
          >
            <button
              type="button"
              id="grade-modal-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.55rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-text-primary, #374151)',
                backgroundColor: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: 'var(--radius-md, 6px)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              id="grade-modal-submit-btn"
              disabled={isSubmitting}
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: isSubmitting ? '#93c5fd' : '#2563eb',
                border: 'none',
                borderRadius: 'var(--radius-md, 6px)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Đang lưu điểm...' : 'Lưu điểm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
