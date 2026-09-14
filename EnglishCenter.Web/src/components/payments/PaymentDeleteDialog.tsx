import React, { useEffect, useRef, useState } from 'react';
import type { PaymentDetail, PaymentListItem } from '../../types/payment.types';
import {
  formatAuditDateTime,
  formatVND,
  getPaymentApiErrorMessage,
  PAYMENT_METHOD_LABELS
} from '../../utils/paymentHelper';

interface PaymentDeleteDialogProps {
  isOpen: boolean;
  payment: PaymentListItem | PaymentDetail | null;
  onClose: () => void;
  onConfirmSuccess: () => void;
  deleteAction: (id: number) => Promise<void>;
}

export const PaymentDeleteDialog: React.FC<PaymentDeleteDialogProps> = ({
  isOpen,
  payment,
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

  if (!isOpen || !payment) {
    return null;
  }

  // Strictly Pending-only delete
  if (payment.status !== 'Pending') {
    return null;
  }

  const handleDelete = async () => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteAction(payment.id);
      onConfirmSuccess();
      onClose();
    } catch (err: unknown) {
      // Preserve dialog state, show backend error message, do NOT optimistically remove
      setErrorMessage(getPaymentApiErrorMessage(err));
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
            Xác nhận xóa vĩnh viễn giao dịch #{payment.id}
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
              ⚠️ {errorMessage}
            </div>
          )}

          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
            Bạn có chắc chắn muốn <strong>xóa hoàn toàn giao dịch thanh toán này (Hard Delete)</strong> khỏi hệ thống?
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
            <div>Học viên: <strong>{payment.studentName}</strong> ({payment.studentCode})</div>
            <div>Khóa học: <strong>{payment.courseName}</strong></div>
            <div>Số tiền: <strong>{formatVND(payment.amount)}</strong></div>
            <div>Phương thức: <strong>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</strong></div>
            <div>Thời gian: <strong>{formatAuditDateTime(payment.paymentDate)}</strong></div>
            <div>Trạng thái: <strong>Chờ xử lý (Pending)</strong></div>
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
            ⚠️ <strong>Lưu ý:</strong> Hành động này khác với <em>Hủy giao dịch (Cancelled)</em>. Xóa sẽ xóa hoàn toàn bản ghi khỏi sổ thanh toán và chỉ được thực hiện khi giao dịch ở trạng thái <strong>Chờ xử lý (Pending)</strong>.
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
              Đóng
            </button>
            <button
              type="button"
              id="confirm-delete-payment-btn"
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
