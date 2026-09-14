import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { PaymentEnrollmentSelector } from '../../components/payments/PaymentEnrollmentSelector';
import { PaymentSummaryCard } from '../../components/payments/PaymentSummaryCard';
import { paymentService } from '../../services/payment.service';
import type { CreatePaymentPayload, PaymentMethod, PaymentSummary } from '../../types/payment.types';
import type { EnrollmentListItem } from '../../types/enrollment.types';
import {
  formatVND,
  getPaymentApiErrorMessage,
  getPaymentBasePath,
  PAYMENT_METHOD_LABELS,
  toUtcIsoString
} from '../../utils/paymentHelper';

export const PaymentCreatePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getPaymentBasePath(location.pathname);

  // Selected Enrollment
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentListItem | null>(null);

  // Authoritative Payment Summary
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Form states
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [transactionCode, setTransactionCode] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Submit & Error handling
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const summaryAbortControllerRef = useRef<AbortController | null>(null);

  // Fetch Payment Summary whenever selectedEnrollment changes
  useEffect(() => {
    if (!selectedEnrollment) {
      setSummary(null);
      setSummaryError(null);
      return;
    }

    if (summaryAbortControllerRef.current) {
      summaryAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    summaryAbortControllerRef.current = controller;

    setIsLoadingSummary(true);
    setSummaryError(null);

    paymentService
      .getPaymentSummary(selectedEnrollment.id, controller.signal)
      .then((res) => {
        if (res.success && res.data) {
          setSummary(res.data);
        } else {
          setSummaryError(res.message || 'Không thể tải sổ thanh toán của đơn ghi danh.');
        }
      })
      .catch((err) => {
        if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
          return; // Superseded request
        }
        setSummaryError(getPaymentApiErrorMessage(err));
      })
      .finally(() => {
        setIsLoadingSummary(false);
      });

    return () => {
      if (summaryAbortControllerRef.current) {
        summaryAbortControllerRef.current.abort();
      }
    };
  }, [selectedEnrollment]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current) return;

    setValidationError(null);
    setServerError(null);

    if (!selectedEnrollment) {
      setValidationError('Vui lòng chọn đơn ghi danh cần thanh toán.');
      return;
    }

    if (summary && summary.remainingAmount <= 0) {
      setValidationError('Đơn ghi danh này đã tất toán toàn bộ học phí. Không thể tạo thêm giao dịch.');
      return;
    }

    const trimmedAmount = amount.trim();
    if (!trimmedAmount) {
      setValidationError('Vui lòng nhập số tiền thanh toán.');
      return;
    }

    const parsedAmount = Number(trimmedAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Số tiền thanh toán phải lớn hơn 0.');
      return;
    }

    // Validate maximum 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
      setValidationError('Số tiền thanh toán chỉ được có tối đa 2 chữ số thập phân.');
      return;
    }

    if (summary && parsedAmount > summary.remainingAmount) {
      setValidationError(
        `Số tiền thanh toán (${formatVND(parsedAmount)}) không được vượt quá số tiền còn lại (${formatVND(
          summary.remainingAmount
        )}).`
      );
      return;
    }

    if (!paymentMethod) {
      setValidationError('Vui lòng chọn phương thức thanh toán.');
      return;
    }

    // Build strict payload:
    // Only enrollmentId, amount, paymentMethod, paymentDate?, transactionCode?, note?
    // NEVER send id, status, enrollmentStatus, createdBy, confirmedBy!
    const payload: CreatePaymentPayload = {
      enrollmentId: selectedEnrollment.id,
      amount: parsedAmount,
      paymentMethod
    };

    // Date: omit if blank; if provided, convert to UTC ISO string once
    if (paymentDate.trim()) {
      const utcDate = toUtcIsoString(paymentDate.trim());
      if (!utcDate) {
        setValidationError('Thời gian thanh toán không hợp lệ.');
        return;
      }
      payload.paymentDate = utcDate;
    }

    // Transaction Code: max 100 chars, trimmed, omit if blank
    if (transactionCode.trim()) {
      if (transactionCode.trim().length > 100) {
        setValidationError('Mã giao dịch không được vượt quá 100 ký tự.');
        return;
      }
      payload.transactionCode = transactionCode.trim();
    }

    // Note: max 500 chars, trimmed, omit if blank
    if (note.trim()) {
      if (note.trim().length > 500) {
        setValidationError('Ghi chú không được vượt quá 500 ký tự.');
        return;
      }
      payload.note = note.trim();
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await paymentService.createPayment(payload);
      if (response.success && response.data) {
        navigate(`${basePath}/${response.data.id}`, {
          state: { flashMessage: 'Tạo giao dịch thanh toán mới thành công (trạng thái: Chờ xử lý).' }
        });
      } else {
        setServerError(response.message || 'Không thể tạo giao dịch thanh toán.');
      }
    } catch (err: unknown) {
      // Form state preserved on error
      setServerError(getPaymentApiErrorMessage(err));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const isFullyPaid = summary ? summary.remainingAmount <= 0 : false;

  return (
    <AppShell>
      {/* Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to={basePath}
          id="back-to-payments-btn"
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

      <PageHeader
        title="Tạo giao dịch thanh toán mới"
        subtitle="Tiếp nhận thanh toán học phí cho học viên theo đơn ghi danh"
      />

      {/* Error Banners */}
      {validationError && (
        <div
          id="create-validation-error"
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
          id="create-server-error"
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '780px' }}>
        {/* Step 1: Select Enrollment */}
        <PaymentEnrollmentSelector
          selectedEnrollmentId={selectedEnrollment ? selectedEnrollment.id : ''}
          onSelectEnrollment={(e) => setSelectedEnrollment(e)}
          disabled={isSubmitting}
        />

        {/* Step 2: Authoritative Financial Summary Card */}
        {selectedEnrollment && (
          <PaymentSummaryCard
            summary={summary}
            isLoading={isLoadingSummary}
            errorMessage={summaryError}
            enrollmentDetailLink={
              basePath.startsWith('/admin')
                ? `/admin/enrollments/${selectedEnrollment.id}`
                : `/staff/enrollments/${selectedEnrollment.id}`
            }
          />
        )}

        {/* Fully Settled Notice */}
        {isFullyPaid && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--status-warning-bg)',
              color: 'var(--status-warning-text)',
              border: '1px solid var(--status-warning-border)',
              fontSize: '0.875rem',
              lineHeight: 1.4
            }}
          >
            🚫 <strong>Đơn ghi danh đã tất toán:</strong> Đơn ghi danh này không còn số dư học phí cần thanh toán (còn lại: 0 ₫). Nút tạo giao dịch đã được vô hiệu hóa.
          </div>
        )}

        {/* Step 3: Payment Form */}
        {selectedEnrollment && (
          <form
            id="payment-create-form"
            onSubmit={handleSubmit}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <h3
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                borderBottom: '1px solid var(--color-border-subtle)',
                paddingBottom: '0.5rem'
              }}
            >
              Thông tin giao dịch thanh toán
            </h3>

            {/* Amount Field */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <label
                  htmlFor="amount-input"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)'
                  }}
                >
                  Số tiền thanh toán (VND) <span style={{ color: 'var(--status-danger-text)' }}>*</span>
                </label>

                {summary && summary.remainingAmount > 0 && (
                  <button
                    type="button"
                    id="pay-full-remaining-btn"
                    onClick={() => setAmount(String(summary.remainingAmount))}
                    disabled={isSubmitting || isFullyPaid}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: isFullyPaid ? 'not-allowed' : 'pointer',
                      padding: 0
                    }}
                  >
                    ⚡ Thanh toán toàn bộ số còn lại ({formatVND(summary.remainingAmount)})
                  </button>
                )}
              </div>

              <input
                id="amount-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ví dụ: 2500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting || isFullyPaid}
                required
                style={formInputStyle}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                Hỗ trợ tối đa 2 chữ số thập phân. Số tiền phải lớn hơn 0 và không vượt quá số còn lại.
              </span>
            </div>

            {/* Payment Method Field */}
            <div>
              <label
                htmlFor="payment-method-select"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.375rem'
                }}
              >
                Phương thức thanh toán <span style={{ color: 'var(--status-danger-text)' }}>*</span>
              </label>
              <select
                id="payment-method-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                disabled={isSubmitting || isFullyPaid}
                required
                style={formInputStyle}
              >
                {(['Cash', 'BankTransfer', 'Online'] as PaymentMethod[]).map((pm) => (
                  <option key={pm} value={pm}>
                    {PAYMENT_METHOD_LABELS[pm]} ({pm})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Date Field */}
            <div>
              <label
                htmlFor="payment-date-input"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.375rem'
                }}
              >
                Thời gian thanh toán{' '}
                <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                  (Tùy chọn - để trống hệ thống sẽ lấy thời gian hiện tại)
                </span>
              </label>
              <input
                id="payment-date-input"
                type="datetime-local"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={isSubmitting || isFullyPaid}
                style={formInputStyle}
              />
            </div>

            {/* Transaction Code Field */}
            <div>
              <label
                htmlFor="transaction-code-input"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.375rem'
                }}
              >
                Mã giao dịch / Mã tham chiếu{' '}
                <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                  (Tùy chọn - tối đa 100 ký tự)
                </span>
              </label>
              <input
                id="transaction-code-input"
                type="text"
                maxLength={100}
                placeholder="Ví dụ: VCB-20260914-9981 hoặc mã biên lai"
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
                disabled={isSubmitting || isFullyPaid}
                style={formInputStyle}
              />
            </div>

            {/* Note Field */}
            <div>
              <label
                htmlFor="payment-note-input"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.375rem'
                }}
              >
                Ghi chú giao dịch{' '}
                <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                  (Tùy chọn - tối đa 500 ký tự)
                </span>
              </label>
              <textarea
                id="payment-note-input"
                rows={3}
                maxLength={500}
                placeholder="Nhập ghi chú thêm nếu có..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting || isFullyPaid}
                style={{ ...formInputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Submit Toolbar */}
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
                to={basePath}
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
                id="submit-payment-btn"
                disabled={isSubmitting || isFullyPaid}
                style={{
                  padding: '0.625rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isFullyPaid ? 'var(--color-border)' : 'var(--color-primary)',
                  color: 'var(--color-text-inverse)',
                  cursor: isSubmitting || isFullyPaid ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Đang tạo giao dịch...' : 'Xác nhận tạo giao dịch'}
              </button>
            </div>
          </form>
        )}
      </div>
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
