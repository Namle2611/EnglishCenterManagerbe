import React, { useEffect, useRef, useState } from 'react';
import type { EnrollmentDetail, EnrollmentListItem } from '../../types/enrollment.types';
import { getEnrollmentApiErrorMessage } from '../../utils/enrollmentHelper';

interface EnrollmentDeleteDialogProps {
  isOpen: boolean;
  enrollment: EnrollmentListItem | EnrollmentDetail | null;
  onClose: () => void;
  onConfirmSuccess: () => void;
  deleteAction: (id: number) => Promise<void>;
}

export const EnrollmentDeleteDialog: React.FC<EnrollmentDeleteDialogProps> = ({
  isOpen,
  enrollment,
  onClose,
  onConfirmSuccess,
  deleteAction
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronous anti-double-submit guard
  const isDeletingRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      isDeletingRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen || !enrollment) {
    return null;
  }

  const handleDelete = async () => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteAction(enrollment.id);
      onConfirmSuccess();
      onClose();
    } catch (err: unknown) {
      // Preserve dialog state, show backend error message, do NOT optimistically remove
      setErrorMessage(getEnrollmentApiErrorMessage(err));
    } finally {
      setIsDeleting(false);
      isDeletingRef.current = false;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: '480px',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2
            id="delete-dialog-title"
            style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--status-danger-text)'
            }}
          >
            Xác nhận xóa vĩnh viễn ghi danh #{enrollment.id}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-muted)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              style={{
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger-text)',
                border: '1px solid var(--status-danger-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem'
              }}
            >
              {errorMessage}
            </div>
          )}

          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
            Bạn có chắc chắn muốn <strong>xóa hoàn toàn ghi danh này (Hard Delete)</strong> khỏi hệ thống?
          </p>

          <div
            style={{
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              fontSize: '0.8125rem',
              lineHeight: 1.4
            }}
          >
            <div>Học viên: <strong>{enrollment.studentName}</strong> ({enrollment.studentCode})</div>
            <div>Khóa học: <strong>{enrollment.courseName}</strong></div>
            <div>Trạng thái: <strong>{enrollment.status}</strong></div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--status-warning-bg)',
              color: 'var(--status-warning-text)',
              border: '1px solid var(--status-warning-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem'
            }}
          >
            ⚠️ <strong>Lưu ý quan trọng:</strong> Hành động này khác với <em>Hủy ghi danh</em>. Xóa sẽ xóa sạch bản ghi khỏi cơ sở dữ liệu và chỉ thành công khi ghi danh ở trạng thái <strong>Chờ xác nhận (Pending)</strong> và chưa từng phát sinh dữ liệu thanh toán hay lớp học.
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--color-border)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                cursor: isDeleting ? 'not-allowed' : 'pointer'
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--status-danger-text)',
                color: '#ffffff',
                cursor: isDeleting ? 'not-allowed' : 'pointer'
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
