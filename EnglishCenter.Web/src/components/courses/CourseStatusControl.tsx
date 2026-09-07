import React, { useState } from 'react';
import type { CourseStatus } from '../../types/course.types';
import { CourseStatusBadge } from './CourseStatusBadge';

interface CourseStatusControlProps {
  currentStatus: CourseStatus;
  onStatusChange: (newStatus: CourseStatus) => Promise<void>;
  disabled?: boolean;
}

const ALL_STATUSES: CourseStatus[] = ['Active', 'Inactive'];

export const CourseStatusControl: React.FC<CourseStatusControlProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false
}) => {
  const [targetStatus, setTargetStatus] = useState<CourseStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getConfirmationMessage = (status: CourseStatus): string => {
    switch (status) {
      case 'Inactive':
        return 'Bạn có chắc chắn muốn chuyển khóa học sang trạng thái KHÔNG HOẠT ĐỘNG? Khóa học sẽ không được xem là đang hoạt động cho các nghiệp vụ mới.';
      case 'Active':
        return 'Bạn có chắc chắn muốn KÍCH HOẠT LẠI khóa học này? Khóa học sẽ chuyển sang trạng thái hoạt động trên hệ thống.';
      default:
        return `Bạn có chắc chắn muốn chuyển trạng thái khóa học sang ${status}?`;
    }
  };

  const handleSelectStatus = (status: CourseStatus) => {
    if (status === currentStatus) return;
    setErrorMessage(null);
    setTargetStatus(status);
  };

  const handleConfirm = async () => {
    if (!targetStatus || targetStatus === currentStatus) return;

    setIsUpdating(true);
    setErrorMessage(null);

    try {
      await onStatusChange(targetStatus);
      setTargetStatus(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể cập nhật trạng thái khóa học.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setTargetStatus(null);
    setErrorMessage(null);
  };

  const isBusy = disabled || isUpdating;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--color-border, #e2e8f0)',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid var(--color-border, #e2e8f0)',
          paddingBottom: '0.875rem'
        }}
      >
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: 'var(--color-text, #0f172a)'
            }}
          >
            Quản lý trạng thái khóa học
          </h4>
          <p
            style={{
              margin: '0.25rem 0 0 0',
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted, #64748b)'
            }}
          >
            Trạng thái xác định khóa học có đang mở cho các hoạt động và nghiệp vụ mới hay không.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #64748b)' }}>
            Hiện tại:
          </span>
          <CourseStatusBadge status={currentStatus} />
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '0.75rem 1rem',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
            style={{ flexShrink: 0 }}
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {errorMessage}
        </div>
      )}

      {/* Button Group to Select Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--color-text-secondary, #334155)'
          }}
        >
          Chuyển sang:
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map((status) => {
            const isCurrent = status === currentStatus;
            const isSelected = status === targetStatus;

            let btnBg = 'var(--color-surface, #ffffff)';
            let btnColor = 'var(--color-text, #0f172a)';
            let btnBorder = 'var(--color-border, #cbd5e1)';

            if (isCurrent) {
              btnBg = 'var(--color-surface-hover, #f8fafc)';
              btnColor = 'var(--color-text-muted, #94a3b8)';
              btnBorder = 'var(--color-border, #e2e8f0)';
            } else if (isSelected) {
              btnBg = 'var(--color-primary, #1e40af)';
              btnColor = '#ffffff';
              btnBorder = 'var(--color-primary, #1e40af)';
            }

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleSelectStatus(status)}
                disabled={isCurrent || isBusy}
                style={{
                  padding: '0.4375rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-md, 8px)',
                  border: `1px solid ${btnBorder}`,
                  backgroundColor: btnBg,
                  color: btnColor,
                  cursor: isCurrent || isBusy ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {status === 'Active' ? 'Kích hoạt (Active)' : 'Dừng hoạt động (Inactive)'}
                {isCurrent && ' (Hiện tại)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline Confirmation Dialog */}
      {targetStatus && (
        <div
          style={{
            display: 'flex',
            gap: '0.875rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1rem 1.25rem',
            alignItems: 'flex-start'
          }}
        >
          <div
            style={{
              color: '#d97706',
              flexShrink: 0,
              marginTop: '0.125rem'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                color: '#92400e',
                fontSize: '0.875rem'
              }}
            >
              Xác nhận thay đổi trạng thái
            </p>
            <p
              style={{
                margin: '0.375rem 0 0.875rem 0',
                color: '#78350f',
                fontSize: '0.8125rem',
                lineHeight: 1.5
              }}
            >
              {getConfirmationMessage(targetStatus)}
            </p>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isBusy}
                style={{
                  padding: '0.4375rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md, 8px)',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  opacity: isBusy ? 0.7 : 1
                }}
              >
                {isUpdating ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isBusy}
                style={{
                  padding: '0.4375rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  backgroundColor: '#ffffff',
                  color: 'var(--color-text-secondary, #475569)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  borderRadius: 'var(--radius-md, 8px)',
                  cursor: isBusy ? 'not-allowed' : 'pointer'
                }}
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

