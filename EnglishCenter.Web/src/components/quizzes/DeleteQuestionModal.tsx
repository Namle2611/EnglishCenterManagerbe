import React, { useState } from 'react';
import type { QuestionManagementResponse } from '../../types/quiz.types';

interface DeleteQuestionModalProps {
  isOpen: boolean;
  question: QuestionManagementResponse | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const DeleteQuestionModal: React.FC<DeleteQuestionModalProps> = ({
  isOpen,
  question,
  onConfirm,
  onClose
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !question) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Xóa câu hỏi thất bại.';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🗑️</div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
            Xác nhận xóa câu hỏi
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Bạn có chắc chắn muốn xóa câu hỏi: <em>"{question.content}"</em>?
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger-text)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              marginBottom: '1rem'
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={cancelBtnStyle}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            style={deleteBtnStyle}
          >
            {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
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
  maxWidth: '420px',
  padding: '1.75rem',
  boxShadow: 'var(--shadow-xl)',
  border: '1px solid var(--color-border)'
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '0.55rem 1.125rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface-subtle)',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer'
};

const deleteBtnStyle: React.CSSProperties = {
  padding: '0.55rem 1.125rem',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  backgroundColor: 'var(--color-danger, #ef4444)',
  color: 'var(--color-text-inverse, #ffffff)',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer'
};
