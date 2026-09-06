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
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>
            Quản lý trạng thái khóa học
          </h4>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Trạng thái xác định khóa học có đang mở cho các hoạt động và nghiệp vụ mới hay không.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#475569' }}>Hiện tại:</span>
          <CourseStatusBadge status={currentStatus} />
        </div>
      </div>

      {errorMessage && (
        <div style={errorStyle} role="alert">
          {errorMessage}
        </div>
      )}

      {/* Button Group to Select Status */}
      <div style={actionRowStyle}>
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>
          Chuyển sang:
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map((status) => {
            const isCurrent = status === currentStatus;
            const isSelected = status === targetStatus;

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleSelectStatus(status)}
                disabled={isCurrent || isBusy}
                style={{
                  ...statusButtonStyle,
                  backgroundColor: isCurrent
                    ? '#f1f5f9'
                    : isSelected
                    ? '#2563eb'
                    : '#ffffff',
                  color: isCurrent
                    ? '#94a3b8'
                    : isSelected
                    ? '#ffffff'
                    : '#334155',
                  borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                  cursor: isCurrent || isBusy ? 'not-allowed' : 'pointer'
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
        <div style={confirmationBoxStyle}>
          <div style={warningIconStyle}>⚠️</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#92400e', fontSize: '0.9rem' }}>
              Xác nhận thay đổi trạng thái
            </p>
            <p style={{ margin: '0.35rem 0 0.75rem 0', color: '#78350f', fontSize: '0.85rem', lineHeight: 1.4 }}>
              {getConfirmationMessage(targetStatus)}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isBusy}
                style={confirmButtonStyle}
              >
                {isUpdating ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isBusy}
                style={cancelButtonStyle}
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

const containerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  padding: '1.25rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.5rem',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '0.75rem'
};

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap'
};

const statusButtonStyle: React.CSSProperties = {
  padding: '0.45rem 0.85rem',
  fontSize: '0.85rem',
  fontWeight: 500,
  borderRadius: '6px',
  border: '1px solid',
  transition: 'all 0.15s ease'
};

const confirmationBoxStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '6px',
  padding: '1rem',
  alignItems: 'flex-start'
};

const warningIconStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  lineHeight: 1
};

const confirmButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  backgroundColor: '#d97706',
  color: '#ffffff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  fontSize: '0.85rem',
  fontWeight: 500,
  backgroundColor: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  cursor: 'pointer'
};

const errorStyle: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  padding: '0.65rem 0.85rem',
  fontSize: '0.85rem'
};
