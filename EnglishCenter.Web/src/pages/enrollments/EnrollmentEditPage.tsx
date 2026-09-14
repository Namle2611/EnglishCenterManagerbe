import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { EnrollmentStatusBadge } from '../../components/enrollments/EnrollmentStatusBadge';
import { enrollmentService } from '../../services/enrollment.service';
import type { EnrollmentDetail, UpdateEnrollmentPayload } from '../../types/enrollment.types';
import {
  formatCalendarDate,
  formatVND,
  getEnrollmentApiErrorMessage,
  getEnrollmentBasePath
} from '../../utils/enrollmentHelper';

export const EnrollmentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getEnrollmentBasePath(location.pathname);

  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Form field
  const [tuitionAmount, setTuitionAmount] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);

  const enrollmentId = parseInt(id || '', 10);

  const fetchDetail = useCallback(async (signal?: AbortSignal) => {
    if (isNaN(enrollmentId) || enrollmentId <= 0) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);

    try {
      const response = await enrollmentService.getEnrollmentById(enrollmentId, signal);
      if (response.success && response.data) {
        setEnrollment(response.data);
        setTuitionAmount(String(response.data.tuitionAmount));
      } else {
        setErrorMessage(response.message || 'Không thể tải thông tin đơn ghi danh.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setIsNotFound(true);
      } else {
        setErrorMessage(getEnrollmentApiErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetail(controller.signal);
    return () => controller.abort();
  }, [fetchDetail]);

  const isEditable = enrollment?.status === 'Pending' || enrollment?.status === 'Confirmed';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditable) {
      setValidationError('Đơn ghi danh ở trạng thái hiện tại không cho phép chỉnh sửa học phí.');
      return;
    }

    if (isSubmittingRef.current) return;

    setValidationError(null);
    setErrorMessage(null);

    const parsedAmount = Number(tuitionAmount);
    if (tuitionAmount.trim() === '' || isNaN(parsedAmount) || parsedAmount < 0) {
      setValidationError('Vui lòng nhập số tiền học phí hợp lệ (lớn hơn hoặc bằng 0).');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload: UpdateEnrollmentPayload = {
        tuitionAmount: parsedAmount
      };
      const response = await enrollmentService.updateEnrollment(enrollmentId, payload);
      if (response.success) {
        navigate(`${basePath}/${enrollmentId}`, {
          state: { flashMessage: 'Cập nhật học phí đơn ghi danh thành công.' }
        });
      } else {
        setErrorMessage(response.message || 'Không thể cập nhật học phí.');
      }
    } catch (err: unknown) {
      setErrorMessage(getEnrollmentApiErrorMessage(err));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState message="Đang tải thông tin đơn ghi danh..." />
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
            &larr; Quay lại danh sách ghi danh
          </Link>
        </div>
        <EmptyState
          title="Không tìm thấy đơn ghi danh"
          description={`Đơn ghi danh với mã #${id} không tồn tại hoặc đã bị xóa.`}
          actionText="Về danh sách ghi danh"
          onAction={() => navigate(basePath)}
        />
      </AppShell>
    );
  }

  if (errorMessage && !enrollment) {
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
            &larr; Quay lại danh sách ghi danh
          </Link>
        </div>
        <div
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            color: 'var(--status-danger-text)',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}
        >
          ❌ {errorMessage}
        </div>
      </AppShell>
    );
  }

  if (!enrollment) return null;

  return (
    <AppShell>
      {/* Breadcrumb / Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to={`${basePath}/${enrollment.id}`}
          id="back-to-detail-link"
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
          &larr; Quay lại chi tiết đơn ghi danh #{enrollment.id}
        </Link>
      </div>

      <PageHeader
        title={`Chỉnh sửa học phí — Đơn #${enrollment.id}`}
        subtitle={`Học viên: ${enrollment.studentName} (${enrollment.studentCode}) | Khóa học: ${enrollment.courseName}`}
        actions={<EnrollmentStatusBadge status={enrollment.status} />}
      />

      {/* Read-Only Warning Banner if not editable */}
      {!isEditable && (
        <div
          id="read-only-warning-banner"
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-border)',
            color: 'var(--status-warning-text)',
            fontSize: '0.875rem',
            maxWidth: '720px'
          }}
        >
          ⚠️ <strong>Học phí không thể chỉnh sửa:</strong> Đơn ghi danh đang ở trạng thái{' '}
          <strong>{enrollment.status}</strong>. Theo quy tắc nghiệp vụ, học phí chỉ có thể chỉnh sửa khi đơn ở trạng thái{' '}
          <em>Pending</em> hoặc <em>Confirmed</em>. Từ trạng thái <em>Paid</em> trở đi, học phí là bất biến.
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
            fontSize: '0.875rem',
            maxWidth: '720px'
          }}
        >
          ⚠️ {validationError}
        </div>
      )}

      {errorMessage && (
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
            fontSize: '0.875rem',
            maxWidth: '720px'
          }}
        >
          ❌ {errorMessage}
        </div>
      )}

      <form
        id="enrollment-edit-form"
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.5rem',
          maxWidth: '720px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Read-only Context Summary */}
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            fontSize: '0.8125rem'
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Học viên:</span>
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {enrollment.studentCode} — {enrollment.studentName}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Khóa học:</span>
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {enrollment.courseCode} — {enrollment.courseName}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Ngày ghi danh:</span>
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {formatCalendarDate(enrollment.enrollmentDate)}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Trạng thái:</span>
            <div style={{ marginTop: '0.25rem' }}>
              <EnrollmentStatusBadge status={enrollment.status} />
            </div>
          </div>
        </div>

        {/* Editable Tuition Field */}
        <div style={{ marginBottom: '2rem' }}>
          <label
            htmlFor="tuition-amount-edit-input"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.5rem'
            }}
          >
            Học phí áp dụng (VNĐ) <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <input
            id="tuition-amount-edit-input"
            type="number"
            min="0"
            step="10000"
            value={tuitionAmount}
            onChange={(e) => setTuitionAmount(e.target.value)}
            disabled={!isEditable || isSubmitting}
            required
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: !isEditable ? 'var(--color-surface-subtle)' : 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              cursor: !isEditable ? 'not-allowed' : 'text'
            }}
          />
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.375rem'
            }}
          >
            Hiện tại: {formatVND(enrollment.tuitionAmount)}. Chỉ cho phép cập nhật số tiền khi đơn ở trạng thái Pending hoặc Confirmed.
          </p>
        </div>

        {/* Form Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border)'
          }}
        >
          <button
            type="button"
            id="cancel-edit-btn"
            onClick={() => navigate(`${basePath}/${enrollment.id}`)}
            disabled={isSubmitting}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
          >
            {isEditable ? 'Hủy bỏ' : 'Quay lại'}
          </button>
          {isEditable && (
            <button
              type="submit"
              id="submit-edit-btn"
              disabled={!isEditable || isSubmitting}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi học phí'}
            </button>
          )}
        </div>
      </form>
    </AppShell>
  );
};
