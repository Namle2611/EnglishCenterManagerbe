import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { EnrollmentStatusBadge } from '../../components/enrollments/EnrollmentStatusBadge';
import { EnrollmentStatusDialog } from '../../components/enrollments/EnrollmentStatusDialog';
import { EnrollmentDeleteDialog } from '../../components/enrollments/EnrollmentDeleteDialog';
import { enrollmentService } from '../../services/enrollment.service';
import type { EnrollmentDetail, EnrollmentListItem, EnrollmentStatus } from '../../types/enrollment.types';
import {
  formatCalendarDate,
  formatVND,
  getEnrollmentApiErrorMessage,
  getEnrollmentBasePath
} from '../../utils/enrollmentHelper';

export const EnrollmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getEnrollmentBasePath(location.pathname);

  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Flash message
  const [flashMessage, setFlashMessage] = useState<string | null>(
    (location.state as { flashMessage?: string } | null)?.flashMessage || null
  );

  // Lifecycle dialog states
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<EnrollmentStatus>('Confirmed');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

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

  const openStatusDialog = (status: EnrollmentStatus) => {
    setTargetStatus(status);
    setIsStatusDialogOpen(true);
  };

  const handleStatusTransitionSuccess = (updated: EnrollmentDetail) => {
    setEnrollment(updated);
    setIsStatusDialogOpen(false);
    setFlashMessage(`Đã cập nhật trạng thái đơn ghi danh sang "${updated.status}".`);
  };

  const handleDeleteSuccess = () => {
    navigate(basePath, {
      state: { flashMessage: 'Đã xóa đơn ghi danh thành công.' },
      replace: true
    });
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
          description={`Đơn ghi danh với mã #${id} không tồn tại hoặc đã bị xóa khỏi hệ thống.`}
          actionText="Về danh sách ghi danh"
          onAction={() => navigate(basePath)}
        />
      </AppShell>
    );
  }

  if (errorMessage || !enrollment) {
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
          ❌ {errorMessage || 'Đã xảy ra lỗi không xác định.'}
        </div>
        <button
          onClick={() => fetchDetail()}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            cursor: 'pointer'
          }}
        >
          Thử lại
        </button>
      </AppShell>
    );
  }

  // Cast detail to list item format for dialogs
  const enrollmentDialogTarget: EnrollmentListItem = {
    id: enrollment.id,
    studentId: enrollment.studentId,
    studentCode: enrollment.studentCode,
    studentName: enrollment.studentName,
    courseId: enrollment.courseId,
    courseCode: enrollment.courseCode,
    courseName: enrollment.courseName,
    classId: enrollment.classId,
    classCode: enrollment.classCode,
    tuitionAmount: enrollment.tuitionAmount,
    enrollmentDate: enrollment.enrollmentDate,
    status: enrollment.status,
    confirmedByName: enrollment.confirmedByName
  };

  const isEditable = enrollment.status === 'Pending' || enrollment.status === 'Confirmed';

  return (
    <AppShell>
      {/* Breadcrumb / Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to={basePath}
          id="back-to-list-link"
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

      {/* Flash Success Message */}
      {flashMessage && (
        <div
          id="detail-flash-message"
          role="status"
          style={{
            padding: '0.875rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-active-bg)',
            border: '1px solid var(--status-active-border)',
            color: 'var(--status-active-text)',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>✅ {flashMessage}</span>
          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              color: 'var(--status-active-text)'
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={`Đơn ghi danh #${enrollment.id} — ${enrollment.studentName}`}
        subtitle={`Khóa học: ${enrollment.courseName} | Ngày ghi danh: ${formatCalendarDate(enrollment.enrollmentDate)}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <EnrollmentStatusBadge status={enrollment.status} />

            {/* Edit Tuition Button (Pending / Confirmed only) */}
            {isEditable && (
              <Link
                to={`${basePath}/${enrollment.id}/edit`}
                id="edit-tuition-btn"
                style={{
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}
              >
                ✏️ Chỉnh sửa học phí
              </Link>
            )}

            {/* Contextual Lifecycle Buttons */}
            {enrollment.status === 'Pending' && (
              <>
                <button
                  type="button"
                  id="confirm-enrollment-btn"
                  onClick={() => openStatusDialog('Confirmed')}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Xác nhận ghi danh
                </button>
                <button
                  type="button"
                  id="cancel-enrollment-btn"
                  onClick={() => openStatusDialog('Cancelled')}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--status-danger-border)',
                    backgroundColor: 'var(--status-danger-bg)',
                    color: 'var(--status-danger-text)',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Hủy ghi danh
                </button>
                <button
                  type="button"
                  id="delete-enrollment-btn"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--status-danger-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--status-danger-text)',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Xóa đơn
                </button>
              </>
            )}

            {enrollment.status === 'Confirmed' && (
              <>
                <button
                  type="button"
                  id="mark-paid-enrollment-btn"
                  onClick={() => openStatusDialog('Paid')}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: 'var(--role-staff-text, #059669)',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  💳 Xác nhận đã thanh toán
                </button>
                <button
                  type="button"
                  id="cancel-enrollment-btn"
                  onClick={() => openStatusDialog('Cancelled')}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--status-danger-border)',
                    backgroundColor: 'var(--status-danger-bg)',
                    color: 'var(--status-danger-text)',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Hủy ghi danh
                </button>
              </>
            )}

            {enrollment.status === 'Paid' && (
              <>
                <button
                  type="button"
                  id="assign-class-enrollment-btn"
                  onClick={() => openStatusDialog('Enrolled')}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  🎓 Xếp vào lớp
                </button>
                <button
                  type="button"
                  id="cancel-enrollment-btn"
                  onClick={() => openStatusDialog('Cancelled')}
                  style={{
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--status-danger-border)',
                    backgroundColor: 'var(--status-danger-bg)',
                    color: 'var(--status-danger-text)',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Hủy ghi danh
                </button>
              </>
            )}

            {enrollment.status === 'Enrolled' && (
              <button
                type="button"
                id="cancel-enrollment-btn"
                onClick={() => openStatusDialog('Cancelled')}
                style={{
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--status-danger-border)',
                  backgroundColor: 'var(--status-danger-bg)',
                  color: 'var(--status-danger-text)',
                  cursor: 'pointer'
                }}
              >
                ✕ Hủy ghi danh
              </button>
            )}
          </div>
        }
      />

      {/* Terminal State Alert */}
      {enrollment.status === 'Cancelled' && (
        <div
          id="cancelled-state-banner"
          role="status"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-subtle)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem'
          }}
        >
          🔒 <strong>Trạng thái kết thúc:</strong> Đơn ghi danh này đã bị hủy (Cancelled). Không thể thực hiện thêm bất kỳ thao tác chuyển đổi trạng thái hay chỉnh sửa học phí nào.
        </div>
      )}

      {/* Info Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginTop: '1.25rem'
        }}
      >
        {/* Card 1: Student Information */}
        <div
          id="student-info-card"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            👤 Thông tin học viên
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Mã học viên:
              </span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{enrollment.studentCode}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Họ và tên:
              </span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{enrollment.studentName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Email:
              </span>
              <span style={{ color: 'var(--color-text-primary)' }}>{enrollment.studentEmail}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Số điện thoại:
              </span>
              <span style={{ color: 'var(--color-text-primary)' }}>{enrollment.studentPhone || '—'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Course Information */}
        <div
          id="course-info-card"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📚 Thông tin khóa học
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Mã khóa học:
              </span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{enrollment.courseCode}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Tên khóa học:
              </span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{enrollment.courseName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Học phí gốc khóa học:
              </span>
              <span style={{ color: 'var(--color-text-primary)' }}>{formatVND(enrollment.courseTuitionFee)}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Học phí áp dụng:
              </span>
              <strong style={{ color: 'var(--color-primary)', fontSize: '1rem' }}>
                {formatVND(enrollment.tuitionAmount)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Class Information */}
        <div
          id="class-info-card"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            🏫 Lớp học xếp lịch
          </h3>
          {enrollment.classId && enrollment.classCode ? (
            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                  Mã lớp:
                </span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{enrollment.classCode}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                  Trạng thái lớp:
                </span>
                <span style={{ color: 'var(--color-text-primary)' }}>{enrollment.classStatus || '—'}</span>
              </div>
              {enrollment.classStudentStatus && (
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                    Trạng thái phân lớp:
                  </span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{enrollment.classStudentStatus}</span>
                </div>
              )}
              {enrollment.classJoinedAt && (
                <div>
                  <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                    Thời điểm vào lớp:
                  </span>
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {new Date(enrollment.classJoinedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}
            >
              Chưa xếp vào lớp học.
              {enrollment.status === 'Paid' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => openStatusDialog('Enrolled')}
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.8125rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-primary)',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Xếp lớp ngay
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card 4: Status & Confirmation Metadata */}
        <div
          id="status-info-card"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📋 Thông tin xử lý & phê duyệt
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Trạng thái hiện tại:
              </span>
              <div style={{ marginTop: '0.25rem' }}>
                <EnrollmentStatusBadge status={enrollment.status} />
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Ngày tạo ghi danh:
              </span>
              <strong style={{ color: 'var(--color-text-primary)' }}>
                {formatCalendarDate(enrollment.enrollmentDate)}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Người xác nhận:
              </span>
              <span style={{ color: 'var(--color-text-primary)' }}>
                {enrollment.confirmedByName || 'Chưa xác nhận'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.75rem' }}>
                Thời điểm xác nhận:
              </span>
              <span style={{ color: 'var(--color-text-primary)' }}>
                {enrollment.confirmedAt ? new Date(enrollment.confirmedAt).toLocaleString('vi-VN') : 'Chưa xác nhận'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle Status Transition Dialog */}
      <EnrollmentStatusDialog
        isOpen={isStatusDialogOpen}
        enrollment={enrollmentDialogTarget}
        initialTargetStatus={targetStatus}
        onClose={() => setIsStatusDialogOpen(false)}
        onSuccess={handleStatusTransitionSuccess}
      />

      {/* Hard Delete Dialog (Pending only) */}
      <EnrollmentDeleteDialog
        isOpen={isDeleteDialogOpen}
        enrollment={enrollmentDialogTarget}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirmSuccess={handleDeleteSuccess}
        deleteAction={enrollmentService.deleteEnrollment}
      />
    </AppShell>
  );
};
