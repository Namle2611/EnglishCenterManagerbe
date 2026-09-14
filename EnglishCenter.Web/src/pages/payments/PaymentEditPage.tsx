import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { PaymentStatusBadge } from '../../components/payments/PaymentStatusBadge';
import { paymentService } from '../../services/payment.service';
import type {
  PaymentDetail,
  PaymentMethod,
  PaymentSummary,
  UpdatePaymentPayload
} from '../../types/payment.types';
import {
  formatVND,
  getPaymentApiErrorMessage,
  getPaymentBasePath,
  PAYMENT_METHOD_LABELS,
  toLocalDatetimeLocalValue,
  toUtcIsoString
} from '../../utils/paymentHelper';

export const PaymentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getPaymentBasePath(location.pathname);

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Form states
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [transactionCode, setTransactionCode] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Initial values for dirty-state comparison
  const [initialAmount, setInitialAmount] = useState<string>('');
  const [initialPaymentDate, setInitialPaymentDate] = useState<string>('');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<PaymentMethod>('Cash');
  const [initialTransactionCode, setInitialTransactionCode] = useState<string>('');
  const [initialNote, setInitialNote] = useState<string>('');

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const paymentId = parseInt(id || '', 10);

  const fetchDetail = useCallback(
    async (signal?: AbortSignal) => {
      if (isNaN(paymentId) || paymentId <= 0) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setIsNotFound(false);

      try {
        const response = await paymentService.getPaymentById(paymentId, signal);
        if (response.success && response.data) {
          const p = response.data;
          setPayment(p);

          const initAmt = String(p.amount);
          const initDate = toLocalDatetimeLocalValue(p.paymentDate);
          const initMethod = p.paymentMethod;
          const initTxn = p.transactionCode || '';
          const initNt = p.note || '';

          setAmount(initAmt);
          setInitialAmount(initAmt);

          setPaymentDate(initDate);
          setInitialPaymentDate(initDate);

          setPaymentMethod(initMethod);
          setInitialPaymentMethod(initMethod);

          setTransactionCode(initTxn);
          setInitialTransactionCode(initTxn);

          setNote(initNt);
          setInitialNote(initNt);

          // Fetch authoritative summary
          try {
            const sumRes = await paymentService.getPaymentSummary(p.enrollmentId, signal);
            if (sumRes.success && sumRes.data) {
              setSummary(sumRes.data);
            }
          } catch {
            // Non-blocking
          }
        } else {
          setErrorMessage(response.message || 'Không thể tải thông tin giao dịch.');
        }
      } catch (err: unknown) {
        if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
          return;
        }
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setIsNotFound(true);
        } else {
          setErrorMessage(getPaymentApiErrorMessage(err));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [paymentId]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchDetail(controller.signal);
    return () => controller.abort();
  }, [fetchDetail]);

  const isPending = payment?.status === 'Pending';

  // Dirty checking
  const hasChanges = isPending
    ? amount.trim() !== initialAmount ||
      paymentDate !== initialPaymentDate ||
      paymentMethod !== initialPaymentMethod ||
      transactionCode.trim() !== initialTransactionCode ||
      note.trim() !== initialNote
    : note.trim() !== initialNote;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSavingRef.current) return;

    setValidationError(null);
    setServerError(null);

    if (!payment) return;

    if (!hasChanges) {
      setValidationError('Không có thay đổi nào để lưu.');
      return;
    }

    const payload: UpdatePaymentPayload = {};

    if (isPending) {
      // Validate amount if changed
      if (amount.trim() !== initialAmount) {
        const parsedAmount = Number(amount.trim());
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          setValidationError('Số tiền thanh toán phải lớn hơn 0.');
          return;
        }
        if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
          setValidationError('Số tiền thanh toán chỉ được có tối đa 2 chữ số thập phân.');
          return;
        }

        // Available balance: RemainingAmount in summary plus current payment amount
        if (summary) {
          const maxAllowed = summary.remainingAmount + payment.amount;
          if (parsedAmount > maxAllowed) {
            setValidationError(
              `Số tiền thanh toán (${formatVND(parsedAmount)}) không được vượt quá số dư học phí còn lại tối đa (${formatVND(
                maxAllowed
              )}).`
            );
            return;
          }
        }

        payload.amount = parsedAmount;
      }

      // PaymentDate if changed
      if (paymentDate !== initialPaymentDate) {
        if (paymentDate.trim()) {
          const utcIso = toUtcIsoString(paymentDate.trim());
          if (!utcIso) {
            setValidationError('Thời gian thanh toán không hợp lệ.');
            return;
          }
          payload.paymentDate = utcIso;
        }
      }

      // PaymentMethod if changed
      if (paymentMethod !== initialPaymentMethod) {
        payload.paymentMethod = paymentMethod;
      }

      // TransactionCode if changed
      if (transactionCode.trim() !== initialTransactionCode) {
        if (transactionCode.trim().length > 100) {
          setValidationError('Mã giao dịch không được vượt quá 100 ký tự.');
          return;
        }
        payload.transactionCode = transactionCode.trim() || undefined;
      }

      // Note if changed
      if (note.trim() !== initialNote) {
        if (note.trim().length > 500) {
          setValidationError('Ghi chú không được vượt quá 500 ký tự.');
          return;
        }
        payload.note = note.trim() || undefined;
      }
    } else {
      // Terminal: Only Note is editable
      if (note.trim() !== initialNote) {
        if (note.trim().length > 500) {
          setValidationError('Ghi chú không được vượt quá 500 ký tự.');
          return;
        }
        payload.note = note.trim() || undefined;
      }
    }

    // Ensure we are not sending an empty payload
    if (Object.keys(payload).length === 0) {
      setValidationError('Không có thay đổi nào để lưu.');
      return;
    }

    isSavingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await paymentService.updatePayment(payment.id, payload);
      if (response.success && response.data) {
        navigate(`${basePath}/${payment.id}`, {
          state: { flashMessage: 'Cập nhật thông tin giao dịch thanh toán thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể cập nhật giao dịch thanh toán.');
      }
    } catch (err: unknown) {
      setServerError(getPaymentApiErrorMessage(err));
    } finally {
      isSavingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState message="Đang tải dữ liệu chỉnh sửa giao dịch..." />
      </AppShell>
    );
  }

  if (isNotFound) {
    return (
      <AppShell>
        <div style={{ marginBottom: '1rem' }}>
          <Link
            to={basePath}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-primary)',
              textDecoration: 'none'
            }}
          >
            &larr; Quay lại danh sách thanh toán
          </Link>
        </div>
        <EmptyState
          title="Không tìm thấy giao dịch thanh toán"
          description={`Giao dịch thanh toán với mã #${id} không tồn tại hoặc đã bị xóa.`}
          actionText="Về danh sách thanh toán"
          onAction={() => navigate(basePath)}
        />
      </AppShell>
    );
  }

  if (errorMessage || !payment) {
    return (
      <AppShell>
        <div style={{ marginBottom: '1rem' }}>
          <Link
            to={basePath}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-primary)',
              textDecoration: 'none'
            }}
          >
            &larr; Quay lại danh sách thanh toán
          </Link>
        </div>
        <div
          role="alert"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            border: '1px solid var(--status-danger-border)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Lỗi tải dữ liệu</div>
          <div>{errorMessage}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to={`${basePath}/${payment.id}`}
          id="back-to-payment-detail-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--color-primary)',
            textDecoration: 'none'
          }}
        >
          &larr; Quay lại chi tiết giao dịch #{payment.id}
        </Link>
      </div>

      <PageHeader
        title={`Chỉnh sửa giao dịch #${payment.id}`}
        subtitle={
          isPending
            ? 'Cập nhật thông tin tài chính hoặc ghi chú cho giao dịch chờ xử lý'
            : 'Giao dịch ở trạng thái kết thúc - chỉ cho phép cập nhật ghi chú'
        }
        actions={<PaymentStatusBadge status={payment.status} />}
      />

      {/* Terminal Notice */}
      {!isPending && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
            lineHeight: 1.5
          }}
        >
          🔒 <strong>Thông tin tài chính đã khóa:</strong> Giao dịch ở trạng thái{' '}
          <strong>{payment.status}</strong> không thể chỉnh sửa số tiền, phương thức, thời gian hoặc mã giao dịch. Bạn chỉ có thể cập nhật ghi chú nghiệp vụ.
        </div>
      )}

      {/* Error Banners */}
      {validationError && (
        <div
          id="edit-validation-error"
          role="alert"
          style={{
            padding: '0.875rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            color: 'var(--status-danger-text)',
            fontSize: '0.875rem'
          }}
        >
          ⚠️ {validationError}
        </div>
      )}

      {serverError && (
        <div
          id="edit-server-error"
          role="alert"
          style={{
            padding: '0.875rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            color: 'var(--status-danger-text)',
            fontSize: '0.875rem'
          }}
        >
          ❌ {serverError}
        </div>
      )}

      <form
        id="payment-edit-form"
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.5rem',
          maxWidth: '720px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {/* Read-only Context */}
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
          <div>Đơn ghi danh: <strong>#{payment.enrollmentId}</strong> (Học phí: {formatVND(payment.tuitionAmount)})</div>
        </div>

        {/* Amount */}
        <div>
          <label
            htmlFor="edit-amount-input"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.375rem'
            }}
          >
            Số tiền thanh toán (VND) {!isPending && '(Đã khóa)'}
          </label>
          <input
            id="edit-amount-input"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!isPending || isSubmitting}
            required
            style={{
              ...formInputStyle,
              backgroundColor: !isPending ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
              cursor: !isPending ? 'not-allowed' : 'text'
            }}
          />
        </div>

        {/* Payment Method */}
        <div>
          <label
            htmlFor="edit-payment-method-select"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.375rem'
            }}
          >
            Phương thức thanh toán {!isPending && '(Đã khóa)'}
          </label>
          <select
            id="edit-payment-method-select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            disabled={!isPending || isSubmitting}
            required
            style={{
              ...formInputStyle,
              backgroundColor: !isPending ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
              cursor: !isPending ? 'not-allowed' : 'pointer'
            }}
          >
            {(['Cash', 'BankTransfer', 'Online'] as PaymentMethod[]).map((pm) => (
              <option key={pm} value={pm}>
                {PAYMENT_METHOD_LABELS[pm]} ({pm})
              </option>
            ))}
          </select>
        </div>

        {/* Payment Date */}
        <div>
          <label
            htmlFor="edit-payment-date-input"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.375rem'
            }}
          >
            Thời gian thanh toán {!isPending && '(Đã khóa)'}
          </label>
          <input
            id="edit-payment-date-input"
            type="datetime-local"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            disabled={!isPending || isSubmitting}
            style={{
              ...formInputStyle,
              backgroundColor: !isPending ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
              cursor: !isPending ? 'not-allowed' : 'text'
            }}
          />
        </div>

        {/* Transaction Code */}
        <div>
          <label
            htmlFor="edit-transaction-code-input"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.375rem'
            }}
          >
            Mã giao dịch / Mã tham chiếu {!isPending && '(Đã khóa)'}
          </label>
          <input
            id="edit-transaction-code-input"
            type="text"
            maxLength={100}
            value={transactionCode}
            onChange={(e) => setTransactionCode(e.target.value)}
            disabled={!isPending || isSubmitting}
            style={{
              ...formInputStyle,
              backgroundColor: !isPending ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
              cursor: !isPending ? 'not-allowed' : 'text'
            }}
          />
        </div>

        {/* Note Field (Always editable) */}
        <div>
          <label
            htmlFor="edit-note-input"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.375rem'
            }}
          >
            Ghi chú giao dịch
          </label>
          <textarea
            id="edit-note-input"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isSubmitting}
            style={{ ...formInputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Action Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            borderTop: '1px solid var(--color-border-subtle)',
            paddingTop: '1rem',
            marginTop: '0.5rem'
          }}
        >
          <Link
            to={`${basePath}/${payment.id}`}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none'
            }}
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            id="save-payment-edit-btn"
            disabled={isSubmitting || !hasChanges}
            title={!hasChanges ? 'Không có thay đổi nào để lưu' : 'Lưu thông tin giao dịch'}
            style={{
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: !hasChanges ? 'var(--color-border)' : 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              cursor: isSubmitting || !hasChanges ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </AppShell>
  );
};

const formInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  fontSize: '0.875rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  outline: 'none'
};
