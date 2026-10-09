import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { paymentService } from '../../services/payment.service';
import type { SePayPaymentDetail } from '../../types/payment.types';
import { formatAuditDateTime, formatVND, getPaymentApiErrorMessage } from '../../utils/paymentHelper';

export const StudentPaymentQrPage: React.FC = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const parsedEnrollmentId = parseInt(enrollmentId || '', 10);

  const [payment, setPayment] = useState<SePayPaymentDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopiedCode, setIsCopiedCode] = useState<boolean>(false);
  const [isCopiedAcc, setIsCopiedAcc] = useState<boolean>(false);
  const [isCopiedAmount, setIsCopiedAmount] = useState<boolean>(false);

  // Polling state
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [paidAt, setPaidAt] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Initialize or fetch payment
  const initPayment = useCallback(async (signal?: AbortSignal) => {
    if (isNaN(parsedEnrollmentId) || parsedEnrollmentId <= 0) {
      setErrorMessage('Mã ghi danh không hợp lệ.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await paymentService.createOrGetSePayPayment(parsedEnrollmentId, signal);
      if (response.success && response.data) {
        setPayment(response.data);
        if (response.data.status === 'Paid' || response.data.status === 'Completed') {
          setIsPaid(true);
          setPaidAt(response.data.paidAt || null);
        }
      } else {
        setErrorMessage(response.message || 'Không thể tạo mã thanh toán.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      setErrorMessage(getPaymentApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [parsedEnrollmentId]);

  useEffect(() => {
    const controller = new AbortController();
    initPayment(controller.signal);
    return () => controller.abort();
  }, [initPayment]);

  // 2. Poll payment status every 3 seconds while pending (Section 37)
  useEffect(() => {
    if (!payment || isPaid) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await paymentService.getPaymentStatus(payment.paymentId);
        if (res.success && res.data) {
          if (res.data.status === 'Paid' || res.data.status === 'Completed') {
            setIsPaid(true);
            setPaidAt(res.data.paidAt || new Date().toISOString());
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
          }
        }
      } catch {
        // Non-blocking poll failure
      }
    };

    pollTimerRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [payment, isPaid]);

  const copyToClipboard = async (text: string, type: 'code' | 'acc' | 'amount') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setIsCopiedCode(true);
        setTimeout(() => setIsCopiedCode(false), 2000);
      } else if (type === 'acc') {
        setIsCopiedAcc(true);
        setTimeout(() => setIsCopiedAcc(false), 2000);
      } else if (type === 'amount') {
        setIsCopiedAmount(true);
        setTimeout(() => setIsCopiedAmount(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <AppShell>
      {/* Back button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/student/payments"
          id="back-to-tuition-btn"
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
          &larr; Quay lại danh sách học phí
        </Link>
      </div>

      <PageHeader
        title="Thanh toán học phí qua VietQR"
        subtitle="Quét mã QR bằng ứng dụng ngân hàng để hoàn tất nộp học phí tự động."
      />

      {isLoading && <LoadingState message="Đang tạo mã thanh toán VietQR cho khóa học..." />}

      {errorMessage && !isLoading && (
        <div
          role="alert"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            border: '1px solid var(--status-danger-border)',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Không thể khởi tạo thanh toán</h3>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem' }}>{errorMessage}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => initPayment()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--status-danger-border)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
            <Link
              to="/student/payments"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: 'var(--status-danger-text)',
                textDecoration: 'underline',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              Quay lại
            </Link>
          </div>
        </div>
      )}

      {!isLoading && payment && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
            maxWidth: '960px',
            margin: '0 auto'
          }}
        >
          {/* Left Column: QR Code Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid var(--color-border)',
              padding: '2rem 1.5rem',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            {/* Status indicator header */}
            {isPaid ? (
              <div
                id="payment-success-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--status-active-bg)',
                  color: 'var(--status-active-text)',
                  border: '1px solid var(--status-active-border)',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  marginBottom: '1.5rem'
                }}
              >
                <span>✓</span>
                <span>Đã thanh toán thành công</span>
              </div>
            ) : (
              <div
                id="payment-pending-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--status-warning-bg)',
                  color: 'var(--status-warning-text)',
                  border: '1px solid var(--status-warning-border)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem'
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '50%',
                    backgroundColor: 'var(--status-warning-text)',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
                <span>Chờ thanh toán qua mã QR</span>
              </div>
            )}

            {/* QR Image Box */}
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                border: isPaid ? '2px solid var(--status-active-border)' : '2px dashed var(--color-primary)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '1.25rem',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}
            >
              <img
                id="vietqr-image"
                src={payment.qrUrl}
                alt="VietQR MBBank Payment"
                style={{
                  width: '260px',
                  height: '260px',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
              {isPaid && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.88)',
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ fontSize: '3.5rem', color: 'var(--status-active-text)' }}>✓</div>
                  <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--status-active-text)' }}>
                    GIAO DỊCH HOÀN TẤT
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {paidAt ? formatAuditDateTime(paidAt) : 'Vừa xong'}
                  </div>
                </div>
              )}
            </div>

            {/* Instruction */}
            <p
              id="qr-primary-instruction"
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)'
              }}
            >
              Quét mã QR bằng ứng dụng ngân hàng để thanh toán.
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)'
              }}
            >
              Mở app MB Bank hoặc bất kỳ app ngân hàng nào hỗ trợ VietQR để quét mã.
            </p>
          </div>

          {/* Right Column: Transaction Information Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid var(--color-border)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Thông tin chuyển khoản
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                {payment.courseName} {payment.classCode ? `(${payment.classCode})` : ''}
              </p>
            </div>

            {/* Warning Box */}
            <div
              style={{
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--status-warning-bg)',
                border: '1px solid var(--status-warning-border)',
                color: 'var(--status-warning-text)',
                fontSize: '0.8125rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}
            >
              <span>⚠️</span>
              <span>
                <strong>Lưu ý:</strong> Vui lòng không chỉnh sửa số tiền hoặc nội dung chuyển khoản để hệ thống tự động ghi nhận tức thì.
              </span>
            </div>

            {/* Bank details grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {/* Ngân hàng */}
              <div style={infoRowContainerStyle}>
                <div>
                  <div style={fieldLabelStyle}>Ngân hàng thụ hưởng</div>
                  <div style={fieldValueStyle} id="bank-name-display">
                    {payment.bankName} (MB Bank - Ngân hàng Quân Đội)
                  </div>
                </div>
              </div>

              {/* Chủ tài khoản */}
              <div style={infoRowContainerStyle}>
                <div>
                  <div style={fieldLabelStyle}>Chủ tài khoản</div>
                  <div style={{ ...fieldValueStyle, textTransform: 'uppercase' }} id="account-holder-display">
                    {payment.accountHolder}
                  </div>
                </div>
              </div>

              {/* Số tài khoản */}
              <div style={infoRowContainerStyle}>
                <div>
                  <div style={fieldLabelStyle}>Số tài khoản thụ hưởng</div>
                  <div className="font-mono" style={{ ...fieldValueStyle, fontSize: '1.125rem', letterSpacing: '0.05em' }} id="account-number-display">
                    {payment.accountNumber}
                  </div>
                </div>
                <button
                  type="button"
                  id="copy-account-btn"
                  onClick={() => copyToClipboard(payment.accountNumber, 'acc')}
                  style={copyBtnStyle}
                >
                  {isCopiedAcc ? 'Đã chép ✓' : 'Sao chép'}
                </button>
              </div>

              {/* Số tiền */}
              <div style={infoRowContainerStyle}>
                <div>
                  <div style={fieldLabelStyle}>Số tiền thanh toán</div>
                  <div style={{ ...fieldValueStyle, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }} id="exact-amount-display">
                    {formatVND(payment.amount)}
                  </div>
                </div>
                <button
                  type="button"
                  id="copy-amount-btn"
                  onClick={() => copyToClipboard(String(Math.round(payment.amount)), 'amount')}
                  style={copyBtnStyle}
                >
                  {isCopiedAmount ? 'Đã chép ✓' : 'Sao chép'}
                </button>
              </div>

              {/* Nội dung / PaymentCode */}
              <div style={{ ...infoRowContainerStyle, backgroundColor: 'var(--color-surface-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                <div>
                  <div style={fieldLabelStyle}>Nội dung chuyển khoản (bắt buộc)</div>
                  <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.05em' }} id="payment-code-display">
                    {payment.paymentCode}
                  </div>
                </div>
                <button
                  type="button"
                  id="copy-code-btn"
                  onClick={() => copyToClipboard(payment.paymentCode, 'code')}
                  style={{ ...copyBtnStyle, backgroundColor: 'var(--color-primary)', color: '#ffffff', borderColor: 'var(--color-primary)' }}
                >
                  {isCopiedCode ? 'Đã chép ✓' : 'Sao chép mã'}
                </button>
              </div>
            </div>

            {/* Live polling progress note */}
            {!isPaid ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  marginTop: '0.5rem',
                  padding: '0.625rem',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                <span>Hệ thống đang tự động lắng nghe giao dịch chuyển khoản từ MB Bank...</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem',
                  padding: '1rem',
                  backgroundColor: 'var(--status-active-bg)',
                  border: '1px solid var(--status-active-border)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--status-active-text)',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ fontWeight: 700 }}>✓ Đã xác nhận thanh toán thành công!</div>
                <div>Học phí của bạn đã được cập nhật trên hệ thống trung tâm Anh ngữ.</div>
                <Link
                  to="/student/payments"
                  style={{
                    marginTop: '0.5rem',
                    fontWeight: 600,
                    color: 'var(--status-active-text)',
                    textDecoration: 'underline'
                  }}
                >
                  &rarr; Trở về trang Học phí & Thanh toán
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
};

const infoRowContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid var(--color-border)'
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '0.15rem'
};

const fieldValueStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)'
};

const copyBtnStyle: React.CSSProperties = {
  padding: '0.3rem 0.625rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};
