import React, { useState } from 'react';
import type { StudentStatus } from '../../types/student.types';
import { StudentStatusBadge } from './StudentStatusBadge';

interface StudentStatusControlProps {
  currentStatus: StudentStatus;
  onStatusChange: (newStatus: StudentStatus) => Promise<void>;
  disabled?: boolean;
}

const ALL_STATUSES: StudentStatus[] = ['Active', 'Inactive', 'Graduated', 'Suspended'];

export const StudentStatusControl: React.FC<StudentStatusControlProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false
}) => {
  const [targetStatus, setTargetStatus] = useState<StudentStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getConfirmationMessage = (status: StudentStatus): string => {
    switch (status) {
      case 'Suspended':
        return 'Bạn có chắc chắn muốn TẠM KHÓA học viên này? Trạng thái này sẽ vô hiệu hóa khả năng đăng nhập mới của học viên.';
      case 'Inactive':
        return 'Bạn có chắc chắn muốn chuyển học viên sang KHÔNG HOẠT ĐỘNG? Trạng thái này sẽ vô hiệu hóa khả năng đăng nhập mới của học viên.';
      case 'Graduated':
        return 'Bạn có chắc chắn muốn đánh dấu học viên đã TỐT NGHIỆP? Học viên vẫn có thể đăng nhập để xem dữ liệu học tập cũ.';
      case 'Active':
        return 'Bạn có chắc chắn muốn KÍCH HOẠT LẠI học viên này? Tài khoản học viên sẽ được mở lại để đăng nhập và tham gia các hoạt động.';
      default:
        return `Bạn có chắc chắn muốn chuyển trạng thái học viên sang ${status}?`;
    }
  };

  const handleSelectStatus = (status: StudentStatus) => {
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
        setErrorMessage('Không thể cập nhật trạng thái học viên.');
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
          <h4 style={titleStyle}>
            Quản lý trạng thái học viên
          </h4>
          <p style={subtitleStyle}>
            Trạng thái sẽ đồng bộ quyền truy cập và tài khoản của học viên trên hệ thống.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Hiện tại:</span>
          <StudentStatusBadge status={currentStatus} />
        </div>
      </div>

      {errorMessage && (
        <div style={errorStyle} role="alert">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Target status selection buttons */}
      <div style={buttonGroupStyle}>
        {ALL_STATUSES.map((status) => {
          const isCurrent = status === currentStatus;
          const isSelected = status === targetStatus;

          return (
            <button
              key={status}
              type="button"
              onClick={() => handleSelectStatus(status)}
              disabled={isBusy || isCurrent}
              style={{
                ...statusOptionButtonStyle,
                opacity: isCurrent ? 0.45 : 1,
                borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border-strong)',
                backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                cursor: isCurrent ? 'not-allowed' : 'pointer'
              }}
            >
              {isCurrent ? `✓ ${status}` : status}
            </button>
          );
        })}
      </div>

      {/* Inline Confirmation Box */}
      {targetStatus && (
        <div style={confirmBoxStyle}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '0.875rem', color: 'var(--status-warning-text)' }}>
                Xác nhận chuyển trạng thái sang: {targetStatus}
              </strong>
              <p style={{ margin: '0.35rem 0 0.75rem 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                {getConfirmationMessage(targetStatus)}
              </p>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isBusy}
                  style={confirmButtonStyle}
                >
                  {isUpdating ? 'Đang cập nhật...' : 'Xác nhận thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isBusy}
                  style={cancelButtonStyle}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  padding: '1.25rem',
  boxShadow: 'var(--shadow-xs)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.75rem',
  borderBottom: '1px solid var(--color-border-subtle)',
  paddingBottom: '0.75rem'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)'
};

const subtitleStyle: React.CSSProperties = {
  margin: '0.25rem 0 0 0',
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)'
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem'
};

const statusOptionButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  transition: 'border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease'
};

const confirmBoxStyle: React.CSSProperties = {
  backgroundColor: 'var(--status-warning-bg)',
  border: '1px solid var(--status-warning-border)',
  borderRadius: 'var(--radius-md)',
  padding: '0.875rem 1rem'
};

const confirmButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  backgroundColor: 'var(--status-warning-text)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
};

const errorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.625rem 0.875rem',
  fontSize: '0.8125rem',
  backgroundColor: 'var(--status-danger-bg)',
  color: 'var(--status-danger-text)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--status-danger-border)'
};
