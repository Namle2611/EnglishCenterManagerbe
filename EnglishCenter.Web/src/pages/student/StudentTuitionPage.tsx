import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { paymentService } from '../../services/payment.service';
import type { StudentTuitionEnrollment } from '../../types/payment.types';
import { formatVND, getPaymentApiErrorMessage } from '../../utils/paymentHelper';

export const StudentTuitionPage: React.FC = () => {
  const [tuitions, setTuitions] = useState<StudentTuitionEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTuitions = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await paymentService.getStudentTuitions(signal);
      if (response.success && response.data) {
        setTuitions(response.data);
      } else {
        setErrorMessage(response.message || 'Không thể tải thông tin học phí.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      setErrorMessage(getPaymentApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTuitions(controller.signal);
    return () => controller.abort();
  }, [fetchTuitions]);

  const totalTuition = tuitions.reduce((acc, t) => acc + t.tuitionAmount, 0);
  const totalPaid = tuitions.reduce((acc, t) => acc + t.paidAmount, 0);
  const totalRemaining = tuitions.reduce((acc, t) => acc + t.remainingAmount, 0);

  return (
    <AppShell>
      <PageHeader
        title="Học phí & Thanh toán"
        subtitle="Theo dõi nghĩa vụ học phí và thanh toán nhanh chóng, an toàn qua VietQR SePay."
      />

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Tổng học phí đăng ký</span>
          <span style={{ ...kpiValueStyle, color: 'var(--color-text-primary)' }}>{formatVND(totalTuition)}</span>
        </div>
        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Đã thanh toán</span>
          <span style={{ ...kpiValueStyle, color: 'var(--status-active-text)' }}>{formatVND(totalPaid)}</span>
        </div>
        <div style={kpiCardStyle}>
          <span style={kpiLabelStyle}>Còn lại cần nộp</span>
          <span style={{ ...kpiValueStyle, color: totalRemaining > 0 ? 'var(--color-primary)' : 'var(--status-active-text)' }}>
            {formatVND(totalRemaining)}
          </span>
        </div>
      </div>

      {isLoading && <LoadingState message="Đang tải thông tin học phí của bạn..." />}

      {errorMessage && !isLoading && (
        <div
          role="alert"
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            border: '1px solid var(--status-danger-border)',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => fetchTuitions()}
            style={{
              padding: '0.4rem 0.8rem',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && tuitions.length === 0 && (
        <EmptyState
          icon="🎓"
          title="Chưa có khóa học nào"
          description="Bạn chưa đăng ký khóa học nào trên hệ thống trung tâm."
        />
      )}

      {!isLoading && !errorMessage && tuitions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {tuitions.map((item) => (
            <div
              key={item.enrollmentId}
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {item.courseName}
                    </h3>
                    <span className="font-mono" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                      {item.courseCode}
                    </span>
                  </div>
                  {item.classCode && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      Lớp học: <span className="font-mono" style={{ fontWeight: 600 }}>{item.classCode}</span>
                    </div>
                  )}
                </div>

                <div>
                  {item.isFullyPaid ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--status-active-bg)',
                        color: 'var(--status-active-text)',
                        border: '1px solid var(--status-active-border)',
                        fontSize: '0.8125rem',
                        fontWeight: 600
                      }}
                    >
                      ✓ Đã hoàn tất học phí
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--status-warning-bg)',
                        color: 'var(--status-warning-text)',
                        border: '1px solid var(--status-warning-border)',
                        fontSize: '0.8125rem',
                        fontWeight: 600
                      }}
                    >
                      ● Chưa nộp đủ học phí
                    </span>
                  )}
                </div>
              </div>

              {/* Financial detail row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div>
                  <div style={subLabelStyle}>Học phí khóa học</div>
                  <div style={subValueStyle}>{formatVND(item.tuitionAmount)}</div>
                </div>
                <div>
                  <div style={subLabelStyle}>Đã nộp</div>
                  <div style={{ ...subValueStyle, color: 'var(--status-active-text)' }}>{formatVND(item.paidAmount)}</div>
                </div>
                <div>
                  <div style={subLabelStyle}>Số tiền còn lại</div>
                  <div style={{ ...subValueStyle, fontWeight: 700, color: item.remainingAmount > 0 ? 'var(--color-primary)' : 'var(--status-active-text)' }}>
                    {formatVND(item.remainingAmount)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                {!item.isFullyPaid ? (
                  <Link
                    to={`/student/payments/${item.enrollmentId}`}
                    id={`pay-btn-${item.enrollmentId}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-primary)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <span>📱</span>
                    <span>Thanh toán qua QR</span>
                  </Link>
                ) : (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    Không có khoản phí chờ nộp
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
};

const kpiCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  padding: '1.25rem',
  boxShadow: 'var(--shadow-sm)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem'
};

const kpiLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700
};

const subLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--color-text-muted)',
  marginBottom: '0.2rem'
};

const subValueStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)'
};
