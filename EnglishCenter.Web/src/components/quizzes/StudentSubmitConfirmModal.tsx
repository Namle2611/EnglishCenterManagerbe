import React from 'react';

interface StudentSubmitConfirmModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredQuestions: number;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const StudentSubmitConfirmModal: React.FC<StudentSubmitConfirmModalProps> = ({
  isOpen,
  totalQuestions,
  answeredQuestions,
  isSubmitting,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredQuestions;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📤</div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
            Xác nhận nộp bài kiểm tra
          </h2>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Bạn đã hoàn thành <strong>{answeredQuestions} / {totalQuestions}</strong> câu hỏi.
          </p>

          {unansweredCount > 0 && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--status-warning-bg, rgba(245, 158, 11, 0.15))',
                color: 'var(--status-warning-text, #b45309)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                border: '1px solid var(--status-warning-border, rgba(245, 158, 11, 0.3))',
                marginBottom: '1rem',
                textAlign: 'left'
              }}
            >
              ⚠️ Bạn vẫn còn <strong>{unansweredCount}</strong> câu hỏi chưa trả lời. Những câu này sẽ được tính 0 điểm khi nộp bài.
            </div>
          )}

          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Sau khi nộp bài, bạn sẽ không thể thay đổi các câu trả lời đã lưu.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={cancelBtnStyle}
          >
            Tiếp tục làm bài
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            style={submitBtnStyle}
          >
            {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài ngay'}
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
  maxWidth: '440px',
  padding: '1.75rem',
  boxShadow: 'var(--shadow-xl)',
  border: '1px solid var(--color-border)'
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '0.625rem 1.125rem',
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
