import React, { useEffect, useRef, useState } from 'react';
import { enrollmentService, fetchEligibleClassesForEnrollment } from '../../services/enrollment.service';
import type { ClassListItem } from '../../types/class.types';
import type {
  EnrollmentDetail,
  EnrollmentListItem,
  EnrollmentStatus,
  UpdateEnrollmentStatusPayload
} from '../../types/enrollment.types';
import {
  formatCalendarDate,
  getEnrollmentApiErrorMessage
} from '../../utils/enrollmentHelper';

interface EnrollmentStatusDialogProps {
  isOpen: boolean;
  enrollment: EnrollmentListItem | EnrollmentDetail | null;
  initialTargetStatus?: EnrollmentStatus | null;
  onClose: () => void;
  onSuccess: (updated: EnrollmentDetail) => void;
}

export const EnrollmentStatusDialog: React.FC<EnrollmentStatusDialogProps> = ({
  isOpen,
  enrollment,
  initialTargetStatus = null,
  onClose,
  onSuccess
}) => {
  const [selectedTargetStatus, setSelectedTargetStatus] = useState<EnrollmentStatus | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [availableClasses, setAvailableClasses] = useState<ClassListItem[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Anti-double-submit synchronous ref
  const isTransitioningRef = useRef<boolean>(false);

  // Determine allowed forward transitions from current status
  const currentStatus = enrollment?.status;
  const getAllowedTransitions = (): EnrollmentStatus[] => {
    switch (currentStatus) {
      case 'Pending':
        return ['Confirmed', 'Cancelled'];
      case 'Confirmed':
        return ['Paid', 'Cancelled'];
      case 'Paid':
        return ['Enrolled', 'Cancelled'];
      case 'Enrolled':
        return ['Cancelled'];
      default:
        return [];
    }
  };

  const allowedTransitions = getAllowedTransitions();

  // Initialize dialog state when opened
  useEffect(() => {
    if (isOpen && enrollment) {
      setErrorMessage(null);
      isTransitioningRef.current = false;
      setSelectedClassId('');

      if (initialTargetStatus && allowedTransitions.includes(initialTargetStatus)) {
        setSelectedTargetStatus(initialTargetStatus);
      } else if (allowedTransitions.length > 0) {
        setSelectedTargetStatus(allowedTransitions[0]);
      } else {
        setSelectedTargetStatus(null);
      }
    }
  }, [isOpen, enrollment, initialTargetStatus]);

  // If transitioning to Enrolled, fetch complete eligible classes for this course
  useEffect(() => {
    if (isOpen && enrollment && selectedTargetStatus === 'Enrolled') {
      let isCancelled = false;
      setIsLoadingClasses(true);
      setErrorMessage(null);

      fetchEligibleClassesForEnrollment(enrollment.courseId)
        .then((classes) => {
          if (!isCancelled) {
            setAvailableClasses(classes);
            if (classes.length > 0) {
              setSelectedClassId(classes[0].id);
            }
          }
        })
        .catch((err) => {
          if (!isCancelled) {
            setErrorMessage(getEnrollmentApiErrorMessage(err));
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsLoadingClasses(false);
          }
        });

      return () => {
        isCancelled = true;
      };
    }
  }, [isOpen, enrollment, selectedTargetStatus]);

  if (!isOpen || !enrollment) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTargetStatus) return;

    if (selectedTargetStatus === 'Enrolled' && (!selectedClassId || selectedClassId <= 0)) {
      setErrorMessage('Vui lòng chọn lớp học để xếp học viên vào lớp.');
      return;
    }

    // Synchronous anti-double-submit guard
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: UpdateEnrollmentStatusPayload = {
      status: selectedTargetStatus
    };

    if (selectedTargetStatus === 'Enrolled') {
      payload.classId = Number(selectedClassId);
    }

    try {
      const response = await enrollmentService.updateEnrollmentStatus(enrollment.id, payload);
      if (response.success && response.data) {
        onSuccess(response.data);
        onClose();
      } else {
        setErrorMessage(response.message || 'Chuyển đổi trạng thái không thành công.');
      }
    } catch (err: unknown) {
      // Keep dialog open, keep selected class, show backend error message
      setErrorMessage(getEnrollmentApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      isTransitioningRef.current = false;
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
        aria-labelledby="status-dialog-title"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: '540px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
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
          <h2 id="status-dialog-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
            Chuyển đổi trạng thái ghi danh #{enrollment.id}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-muted)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content & Form */}
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
                fontSize: '0.875rem'
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Context Info */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              fontSize: '0.875rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.5rem'
            }}
          >
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Học viên: </span>
              <strong>{enrollment.studentName}</strong> ({enrollment.studentCode})
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Khóa học: </span>
              <strong>{enrollment.courseName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Trạng thái hiện tại: </span>
              <strong>{enrollment.status}</strong>
            </div>
          </div>

          {/* Transition Action Selector */}
          <div>
            <label
              htmlFor="target-status-select"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '0.5rem'
              }}
            >
              Hành động chuyển đổi
            </label>
            <select
              id="target-status-select"
              value={selectedTargetStatus || ''}
              onChange={(e) => setSelectedTargetStatus(e.target.value as EnrollmentStatus)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                outline: 'none'
              }}
            >
              {allowedTransitions.map((t) => (
                <option key={t} value={t}>
                  {t === 'Confirmed' && 'Xác nhận ghi danh (Confirmed)'}
                  {t === 'Paid' && 'Xác nhận đã thanh toán học phí (Paid)'}
                  {t === 'Enrolled' && 'Xếp vào lớp học (Enrolled)'}
                  {t === 'Cancelled' && 'Hủy ghi danh (Cancelled)'}
                </option>
              ))}
            </select>
          </div>

          {/* Special Guidance: Paid */}
          {selectedTargetStatus === 'Paid' && (
            <div
              style={{
                backgroundColor: 'var(--role-staff-bg)',
                color: 'var(--role-staff-text)',
                border: '1px solid var(--role-staff-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.8125rem',
                lineHeight: 1.4
              }}
            >
              ℹ️ <strong>Xác nhận hành chính:</strong> Thao tác này ghi nhận học viên đã thanh toán đủ học phí cho khóa học.
              Hệ thống không xử lý cổng thanh toán trực tuyến trong giai đoạn này.
            </div>
          )}

          {/* Special Input & Guidance: Enrolled */}
          {selectedTargetStatus === 'Enrolled' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label
                htmlFor="enrolled-class-select"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)'
                }}
              >
                Chọn lớp học để xếp vào lớp <span style={{ color: 'var(--status-danger-text)' }}>*</span>
              </label>

              {isLoadingClasses ? (
                <div style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Đang tải danh sách lớp học phù hợp...
                </div>
              ) : availableClasses.length === 0 ? (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--status-warning-bg)',
                    color: 'var(--status-warning-text)',
                    border: '1px solid var(--status-warning-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem'
                  }}
                >
                  Không tìm thấy lớp học nào ở trạng thái Dự kiến (Planned) hoặc Đang mở (Ongoing) thuộc khóa học này.
                </div>
              ) : (
                <select
                  id="enrolled-class-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(Number(e.target.value))}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    fontSize: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    outline: 'none'
                  }}
                >
                  {availableClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.classCode} ({formatCalendarDate(cls.startDate)} – {formatCalendarDate(cls.endDate)}) — Tối đa: {cls.maxStudents} HV
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Special Guidance: Cancelled */}
          {selectedTargetStatus === 'Cancelled' && (
            <div
              style={{
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger-text)',
                border: '1px solid var(--status-danger-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.8125rem',
                lineHeight: 1.4
              }}
            >
              ⚠️ <strong>Cảnh báo hủy ghi danh:</strong> Trạng thái Đã hủy (Cancelled) là trạng thái kết thúc và không thể chuyển đổi tiếp.
              {currentStatus === 'Enrolled' && (
                <div>
                  Học viên sẽ được rút khỏi lớp học hiện tại (chuyển sang trạng thái Rút lui / Withdrawn).
                  Nếu lớp học đã hoàn thành, hệ thống sẽ từ chối hủy để bảo vệ lịch sử học tập.
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
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
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedTargetStatus ||
                (selectedTargetStatus === 'Enrolled' && (!selectedClassId || availableClasses.length === 0))
              }
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor:
                  selectedTargetStatus === 'Cancelled'
                    ? 'var(--status-danger-text)'
                    : 'var(--color-primary)',
                color: '#ffffff',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Đang thực hiện...' : 'Xác nhận chuyển đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
