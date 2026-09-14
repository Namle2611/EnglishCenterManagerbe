import React from 'react';
import { Link } from 'react-router-dom';
import type { PaymentSummary } from '../../types/payment.types';
import { formatVND } from '../../utils/paymentHelper';
import { EnrollmentStatusBadge } from '../enrollments/EnrollmentStatusBadge';

interface PaymentSummaryCardProps {
  summary: PaymentSummary | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  enrollmentDetailLink?: string;
}

export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  summary,
  isLoading = false,
  errorMessage = null,
  onRetry,
  enrollmentDetailLink
}) => {
  if (isLoading) {
    return (
      <div
        style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: '0.875rem'
        }}
      >
        <span>⏳ Đang tải thông tin sổ thanh toán & công nợ...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--status-danger-bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--status-danger-border)',
          color: 'var(--status-danger-text)',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <span>❌ {errorMessage}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              backgroundColor: 'var(--color-surface)',
              color: 'var(--status-danger-text)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const isLegacyPaid =
    summary.enrollmentStatus === 'Paid' &&
    summary.effectivePaidAmount === 0 &&
    summary.remainingAmount > 0;

  const isFullyPaidConfirmed =
    summary.isFullyPaid && summary.enrollmentStatus === 'Confirmed';

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>📋</span>
          <h3
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)'
            }}
          >
            Sổ thanh toán ghi danh #{summary.enrollmentId}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.2rem 0.625rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: summary.isFullyPaid
                ? 'var(--status-active-bg)'
                : 'var(--status-warning-bg)',
              color: summary.isFullyPaid
                ? 'var(--status-active-text)'
                : 'var(--status-warning-text)',
              border: `1px solid ${
                summary.isFullyPaid
                  ? 'var(--status-active-border)'
                  : 'var(--status-warning-border)'
              }`
            }}
          >
            {summary.isFullyPaid ? 'Đã tất toán học phí' : 'Còn công nợ'}
          </span>

          {enrollmentDetailLink && (
            <Link
              to={enrollmentDetailLink}
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Xem chi tiết ghi danh &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.875rem'
        }}
      >
        {/* Tuition Amount */}
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div style={metricLabelStyle}>Học phí ghi danh</div>
          <div style={{ ...metricValueStyle, color: 'var(--color-text-primary)' }}>
            {formatVND(summary.tuitionAmount)}
          </div>
        </div>

        {/* Effective Paid */}
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--status-active-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--status-active-border)'
          }}
        >
          <div style={{ ...metricLabelStyle, color: 'var(--status-active-text)' }}>
            Đã thanh toán thực tế
          </div>
          <div style={{ ...metricValueStyle, color: 'var(--status-active-text)' }}>
            {formatVND(summary.effectivePaidAmount)}
          </div>
        </div>

        {/* Pending Paid */}
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--status-warning-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--status-warning-border)'
          }}
        >
          <div style={{ ...metricLabelStyle, color: 'var(--status-warning-text)' }}>
            Đang chờ xử lý
          </div>
          <div style={{ ...metricValueStyle, color: 'var(--status-warning-text)' }}>
            {formatVND(summary.pendingPaidAmount)}
          </div>
        </div>

        {/* Remaining Amount */}
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: summary.remainingAmount > 0 ? 'var(--status-danger-bg)' : 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${summary.remainingAmount > 0 ? 'var(--status-danger-border)' : 'var(--color-border)'}`
          }}
        >
          <div style={{ ...metricLabelStyle, color: summary.remainingAmount > 0 ? 'var(--status-danger-text)' : 'var(--color-text-secondary)' }}>
            Học phí còn lại
          </div>
          <div style={{ ...metricValueStyle, color: summary.remainingAmount > 0 ? 'var(--status-danger-text)' : 'var(--color-text-primary)' }}>
            {formatVND(summary.remainingAmount)}
          </div>
        </div>
      </div>

      {/* Secondary Meta Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingTop: '0.5rem',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Trạng thái ghi danh:</span>
          <EnrollmentStatusBadge status={summary.enrollmentStatus} />
        </div>

        <div>
          Số giao dịch thanh toán: <strong>{summary.completedPaymentCount}</strong> hoàn tất / <strong>{summary.totalPaymentCount}</strong> tổng số
        </div>
      </div>

      {/* Special Notice: Legacy Paid Record */}
      {isLegacyPaid && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--status-warning-bg)',
            color: 'var(--status-warning-text)',
            border: '1px solid var(--status-warning-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            lineHeight: 1.4
          }}
        >
          ℹ️ <strong>Lưu ý dữ liệu lịch sử:</strong> Đơn ghi danh này có trạng thái <em>"Đã đóng tiền" (Paid)</em> theo dữ liệu hành chính nhưng chưa phát sinh bản ghi nào trong sổ thanh toán (còn lại: {formatVND(summary.remainingAmount)}). Đơn ghi danh vẫn hợp lệ để tiếp nhận thanh toán bổ sung.
        </div>
      )}

      {/* Special Notice: Fully-Paid Confirmed Record */}
      {isFullyPaidConfirmed && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary-active)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            lineHeight: 1.4
          }}
        >
          ✓ <strong>Đã tất toán:</strong> Đơn ghi danh đã hoàn tất 100% nghĩa vụ tài chính nhưng trạng thái hành chính vẫn là <em>"Đã xác nhận" (Confirmed)</em>. Bạn có thể chuyển sang chi tiết ghi danh để phân lớp hoặc cập nhật trạng thái nếu cần.
        </div>
      )}
    </div>
  );
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  marginBottom: '0.25rem'
};

const metricValueStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums'
};
