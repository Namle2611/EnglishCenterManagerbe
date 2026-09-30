import React, { useRef, useState } from 'react';
import type { AssignmentListItem } from '../../types/assignment.types';

interface DeleteAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentListItem | null;
  onConfirm: (id: number) => Promise<void>;
}

export const DeleteAssignmentModal: React.FC<DeleteAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteLockRef = useRef(false);

  if (!isOpen || !assignment) return null;

  const handleDelete = async () => {
    if (deleteLockRef.current) return;
    deleteLockRef.current = true;
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm(assignment.id);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axErr.response?.status === 409) {
          setError(
            axErr.response.data?.message ||
              'Không thể xóa bài tập vì đã phát sinh bài nộp từ học viên.'
          );
        } else {
          setError(axErr.response?.data?.message || 'Có lỗi xảy ra khi xóa bài tập.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra khi xóa bài tập.');
      }
    } finally {
      setIsDeleting(false);
      deleteLockRef.current = false;
    }
  };

  return (
    <div
      id="delete-assignment-modal"
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
        zIndex: 110,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-xl, 12px)',
          width: '100%',
          maxWidth: '28rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}
            >
              ⚠️
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
              Xác nhận xóa bài tập
            </h3>
          </div>

          <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--color-text-secondary, #4b5563)', lineHeight: 1.5 }}>
            Bạn có chắc chắn muốn xóa bài tập <strong>"{assignment.title}"</strong> của lớp <strong>{assignment.classCode}</strong> không?
          </p>

          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b7280)' }}>
            Lưu ý: Hành động này chỉ khả dụng khi bài tập chưa có bất kỳ bài nộp nào và không thể hoàn tác sau khi thực hiện.
          </p>

          {error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                borderRadius: 'var(--radius-md, 6px)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              id="delete-assignment-cancel-btn"
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary, #4b5563)',
                backgroundColor: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: 'var(--radius-md, 6px)',
                cursor: isDeleting ? 'not-allowed' : 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              id="delete-assignment-confirm-btn"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#dc2626',
                border: 'none',
                borderRadius: 'var(--radius-md, 6px)',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.7 : 1
              }}
            >
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
