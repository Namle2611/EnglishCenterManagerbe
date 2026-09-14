import React, { useEffect, useRef, useState } from 'react';
import { paymentService } from '../../services/payment.service';
import type { PaymentDetail, PaymentListItem, PaymentStatus } from '../../types/payment.types';
import {
  formatAuditDateTime,
  formatVND,
  getPaymentApiErrorMessage,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS
} from '../../utils/paymentHelper';

interface PaymentStatusDialogProps {
  isOpen: boolean;
  payment: PaymentListItem | PaymentDetail | null;
  initialTargetStatus?: PaymentStatus | null;
  onClose: () => void;
  onSuccess: (updated: PaymentDetail) => void;
}

export const PaymentStatusDialog: React.FC<PaymentStatusDialogProps> = ({
  isOpen,
  payment,
  initialTargetStatus = null,
  onClose,
  onSuccess
}) => {
  const [targetStatus, setTargetStatus] = useState<PaymentStatus>('Completed');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Anti-double-submit synchronous ref guard
  const isTransitioningRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen && payment) {
      setErrorMessage(null);
      isTransitioningRef.current = false;
      if (
        initialTargetStatus &&
        ['Completed', 'Failed', 'Cancelled'].includes(initialTargetStatus)
      ) {
        setTargetStatus(initialTargetStatus);
      } else {
        setTargetStatus('Completed');
      }
    }
  }, [isOpen, payment, initialTargetStatus]);

  if (!isOpen || !payment) {
    return null;
  }

  // Strictly Pending-only actions
  if (payment.status !== 'Pending') {
    return (
      <div style={backdropStyle}>
        <div style={modalStyle} role="dialog" aria-modal="true">
          <div style={headerStyle}>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Thông báo trạng thái</h2>
            <button type="button" onClick={onClose} style={closeBtnStyle}>✕</button>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Giao dịch này đang ở trạng thái <strong>{PAYMENT_STATUS_LABELS[payment.status]}</strong> và không thể chuyển trạng thái được nữa.
            </p>
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button type="button" onClick={onClose} style={cancelBtnStyle}>Đóng</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Exact PATCH body: {"status": targetStatus}
      const response = await paymentService.updatePaymentStatus(payment.id, {
        status: targetStatus
      });

      if (response.success && response.data) {
        onSuccess(response.data);
        onClose();
      } else {
        setErrorMessage(response.message || 'Không thể cập nhật trạng thái giao dịch.');
      }
    } catch (err: unknown) {
      // On backend 400/409, keep dialog open, show backend accounting message, do NOT fake local status
      setErrorMessage(getPaymentApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      isTransitioningRef.current = false;
    }
  };

  return (
    <div style={backdropStyle}>
      <div style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="status-dialog-title">
        {/* Header */}
        <div style={headerStyle}>
          <h2 id="status-dialog-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Cập nhật trạng thái giao dịch #{payment.id}
          </h2>
          <button type="button" onClick={onClose} disabled={isSubmitting} style={closeBtnStyle}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                fontSize: '0.8125rem'
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Payment Details Preview */}
          <div
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8125rem',
              lineHeight: 1.5
            }}
          >
            <div>Học viên: <strong>{payment.studentName}</strong> ({payment.studentCode})</div>
            <div>Khóa học: <strong>{payment.courseName}</strong></div>
            <div>Số tiền: <strong>{formatVND(payment.amount)}</strong></div>
            <div>Phương thức: <strong>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</strong></div>
            <div>Ngày thanh toán: <strong>{formatAuditDateTime(payment.paymentDate)}</strong></div>
            <div>Trạng thái hiện tại: <span style={{ color: 'var(--status-warning-text)', fontWeight: 600 }}>Chờ xử lý (Pending)</span></div>
          </div>

          {/* Target Status Radios */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
              Chọn trạng thái chuyển đổi:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Option: Completed */}
              <label style={radioOptionStyle}>
                <input
                  type="radio"
                  name="targetStatus"
                  value="Completed"
                  checked={targetStatus === 'Completed'}
                  onChange={() => setTargetStatus('Completed')}
                  disabled={isSubmitting}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--status-active-text)' }}>
                    ✅ Hoàn tất thanh toán (Completed)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Ghi nhận vào sổ thu thực tế, giảm trừ công nợ của đơn ghi danh.
                  </div>
                </div>
              </label>

              {/* Option: Failed */}
              <label style={radioOptionStyle}>
                <input
                  type="radio"
                  name="targetStatus"
                  value="Failed"
                  checked={targetStatus === 'Failed'}
                  onChange={() => setTargetStatus('Failed')}
                  disabled={isSubmitting}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--status-danger-text)' }}>
                    ❌ Đánh dấu thất bại (Failed)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Giao dịch không thành công (lỗi ngân hàng, từ chối thẻ, v.v.). Không tính vào số tiền đã thu.
                  </div>
                </div>
              </label>

              {/* Option: Cancelled */}
              <label style={radioOptionStyle}>
                <input
                  type="radio"
                  name="targetStatus"
                  value="Cancelled"
                  checked={targetStatus === 'Cancelled'}
                  onChange={() => setTargetStatus('Cancelled')}
                  disabled={isSubmitting}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    🚫 Hủy giao dịch (Cancelled)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Hủy bỏ giao dịch nhưng vẫn lưu trữ trong lịch sử giao dịch. Khác với xóa vĩnh viễn (Hard Delete).
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '1rem',
              marginTop: '0.5rem'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={cancelBtnStyle}
            >
              Đóng
            </button>
            <button
              type="submit"
              id="confirm-status-update-btn"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor:
                  targetStatus === 'Completed'
                    ? 'var(--status-active-text)'
                    : targetStatus === 'Failed'
                    ? 'var(--status-danger-text)'
                    : 'var(--color-text-secondary)',
                color: '#ffffff',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
  width: '100%',
  maxWidth: '520px',
  overflow: 'hidden'
};

const headerStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.25rem',
  cursor: 'pointer',
  color: 'var(--color-text-muted)'
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer'
};

const radioOptionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  cursor: 'pointer'
};
