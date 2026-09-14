import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { PaymentStatusBadge } from '../../components/payments/PaymentStatusBadge';
import { PaymentSummaryCard } from '../../components/payments/PaymentSummaryCard';
import { PaymentStatusDialog } from '../../components/payments/PaymentStatusDialog';
import { PaymentDeleteDialog } from '../../components/payments/PaymentDeleteDialog';
import { paymentService } from '../../services/payment.service';
import type { PaymentDetail, PaymentStatus, PaymentSummary } from '../../types/payment.types';
import {
  formatAuditDateTime,
  formatVND,
  getPaymentApiErrorMessage,
  getPaymentBasePath,
  PAYMENT_METHOD_LABELS
} from '../../utils/paymentHelper';

export const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getPaymentBasePath(location.pathname);

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Flash message
  const [flashMessage, setFlashMessage] = useState<string | null>(
    (location.state as { flashMessage?: string } | null)?.flashMessage || null
  );

  // Dialog states
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState<boolean>(false);
  const [statusDialogInitialTarget, setStatusDialogInitialTarget] = useState<PaymentStatus | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const paymentId = parseInt(id || '', 10);

  // Clear flash message when location changes
  useEffect(() => {
    if (location.state && (location.state as { flashMessage?: string }).flashMessage) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch Payment Detail & Summary
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
          setPayment(response.data);

          // Fetch authoritative summary
          setIsLoadingSummary(true);
          try {
            const sumRes = await paymentService.getPaymentSummary(response.data.enrollmentId, signal);
            if (sumRes.success && sumRes.data) {
              setSummary(sumRes.data);
            }
          } catch {
            // Non-blocking for detail display
          } finally {
            setIsLoadingSummary(false);
          }
        } else {
          setErrorMessage(response.message || 'Không thể tải thông tin thanh toán.');
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

  const openStatusDialogWithTarget = (target: PaymentStatus) => {
    setStatusDialogInitialTarget(target);
    setIsStatusDialogOpen(true);
  };

  const handleStatusTransitionSuccess = (updated: PaymentDetail) => {
    setPayment(updated);
    setIsStatusDialogOpen(false);
    setFlashMessage(`Đã cập nhật trạng thái giao dịch sang "${updated.status}".`);
    // Refresh authoritative summary
    paymentService.getPaymentSummary(updated.enrollmentId).then((res) => {
      if (res.success && res.data) setSummary(res.data);
    });
  };

  const handleDeleteSuccess = () => {
    navigate(basePath, {
      state: { flashMessage: 'Đã xóa vĩnh viễn giao dịch thanh toán thành công.' },
      replace: true
    });
  };

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState message="Đang tải thông tin chi tiết giao dịch thanh toán..." />
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
          description={`Giao dịch thanh toán với mã #${id} không tồn tại hoặc đã bị xóa khỏi hệ thống.`}
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
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Lỗi khi tải thông tin thanh toán</div>
          <div>{errorMessage}</div>
          <button
            type="button"
            onClick={() => fetchDetail()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-surface)',
              color: 'var(--status-danger-text)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      </AppShell>
    );
  }

  const isPending = payment.status === 'Pending';
  const rolePrefix = basePath.startsWith('/admin') ? '/admin' : '/staff';

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
        title={`Chi tiết giao dịch thanh toán #${payment.id}`}
        subtitle={`Thông tin giao dịch của học viên ${payment.studentName}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <PaymentStatusBadge status={payment.status} />

            {/* Edit Action */}
            <Link
              to={`${basePath}/${payment.id}/edit`}
              id="edit-payment-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-subtle)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                textDecoration: 'none'
              }}
            >
              ✏️ {isPending ? 'Chỉnh sửa' : 'Chỉnh sửa ghi chú'}
            </Link>

            {/* Status Transition Actions (Pending Only) */}
            {isPending && (
              <>
                <button
                  type="button"
                  id="complete-payment-btn"
                  onClick={() => openStatusDialogWithTarget('Completed')}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: 'var(--status-active-text)',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Hoàn tất
                </button>

                <button
                  type="button"
                  id="fail-payment-btn"
                  onClick={() => openStatusDialogWithTarget('Failed')}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: 'var(--status-danger-text)',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Thất bại
                </button>

                <button
                  type="button"
                  id="cancel-payment-btn"
                  onClick={() => openStatusDialogWithTarget('Cancelled')}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  🚫 Hủy giao dịch
                </button>

                <button
                  type="button"
                  id="delete-payment-btn"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--status-danger-border)',
                    backgroundColor: 'var(--status-danger-bg)',
                    color: 'var(--status-danger-text)',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Xóa giao dịch
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Flash Banner */}
      {flashMessage && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-active-bg)',
            color: 'var(--status-active-text)',
            border: '1px solid var(--status-active-border)',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <span>✓ {flashMessage}</span>
          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--status-active-text)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Card 1: Payment Details */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Chi tiết giao dịch thanh toán</h3>
          <div style={infoGridStyle}>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Mã giao dịch (ID):</span>
              <span className="font-mono" style={{ fontWeight: 600 }}>#{payment.id}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Số tiền thanh toán:</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {formatVND(payment.amount)}
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Phương thức thanh toán:</span>
              <span style={{ fontWeight: 600 }}>
                {PAYMENT_METHOD_LABELS[payment.paymentMethod]} ({payment.paymentMethod})
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Thời gian thanh toán:</span>
              <span>{formatAuditDateTime(payment.paymentDate)}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Mã tham chiếu / TransactionCode:</span>
              <span className="font-mono">{payment.transactionCode || 'Không có'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Trạng thái:</span>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <div style={{ ...infoRowStyle, flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
              <span style={labelStyle}>Ghi chú:</span>
              <div
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  color: payment.note ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {payment.note || 'Không có ghi chú.'}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Student & Course Information */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Thông tin học viên & ghi danh</h3>
          <div style={infoGridStyle}>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Học viên:</span>
              <Link
                to={`${rolePrefix}/students/${payment.studentId}`}
                style={{ fontWeight: 600, color: 'var(--color-primary)' }}
              >
                {payment.studentName} ({payment.studentCode})
              </Link>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Email học viên:</span>
              <span>{payment.studentEmail}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Khóa học:</span>
              <Link
                to={`${rolePrefix}/courses/${payment.courseId}`}
                style={{ fontWeight: 500, color: 'var(--color-primary)' }}
              >
                {payment.courseName} ({payment.courseCode})
              </Link>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Lớp học:</span>
              {payment.classId && payment.classCode ? (
                <Link
                  to={`${rolePrefix}/classes/${payment.classId}`}
                  className="font-mono"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {payment.classCode}
                </Link>
              ) : (
                <span style={{ color: 'var(--color-text-muted)' }}>Chưa xếp lớp</span>
              )}
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Đơn ghi danh:</span>
              <Link
                to={`${rolePrefix}/enrollments/${payment.enrollmentId}`}
                style={{ fontWeight: 600, color: 'var(--color-primary)' }}
              >
                #{payment.enrollmentId} (Xem hồ sơ ghi danh &rarr;)
              </Link>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Học phí thỏa thuận:</span>
              <span style={{ fontWeight: 600 }}>{formatVND(payment.tuitionAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Authoritative Financial Ledger Card */}
      <div style={{ marginTop: '1.5rem' }}>
        <PaymentSummaryCard
          summary={summary}
          isLoading={isLoadingSummary}
          enrollmentDetailLink={`${rolePrefix}/enrollments/${payment.enrollmentId}`}
        />
      </div>

      {/* Status Modal */}
      <PaymentStatusDialog
        isOpen={isStatusDialogOpen}
        payment={payment}
        initialTargetStatus={statusDialogInitialTarget}
        onClose={() => {
          setIsStatusDialogOpen(false);
          setStatusDialogInitialTarget(null);
        }}
        onSuccess={handleStatusTransitionSuccess}
      />

      {/* Delete Modal */}
      <PaymentDeleteDialog
        isOpen={isDeleteDialogOpen}
        payment={payment}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirmSuccess={handleDeleteSuccess}
        deleteAction={paymentService.deletePayment}
      />
    </AppShell>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-sm)'
};

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 1rem 0',
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  borderBottom: '1px solid var(--color-border-subtle)',
  paddingBottom: '0.5rem'
};

const infoGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.875rem'
};

const labelStyle: React.CSSProperties = {
  color: 'var(--color-text-secondary)',
  fontWeight: 500
};
