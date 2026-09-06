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
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>
            Quản lý trạng thái học viên
          </h4>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Trạng thái sẽ đồng bộ quyền truy cập và tài khoản của học viên trên hệ thống.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#475569' }}>Hiện tại:</span>
          <StudentStatusBadge status={currentStatus} />
        </div>
      </div>

      {errorMessage && (
        <div style={errorStyle} role="alert">
          {errorMessage}
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
                opacity: isCurrent ? 0.5 : 1,
                borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                color: isSelected ? '#1d4ed8' : '#334155',
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '0.875rem', color: '#92400e' }}>
                Xác nhận thay đổi trạng thái sang: {targetStatus}
              </strong>
              <p style={{ margin: '0.35rem 0 0.75rem 0', fontSize: '0.85rem', color: '#451a03' }}>
                {getConfirmationMessage(targetStatus)}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
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
  gap: '0.75rem',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '0.75rem'
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem'
};

const statusOptionButtonStyle: React.CSSProperties = {
  padding: '0.45rem 0.85rem',
  fontSize: '0.85rem',
  fontWeight: 500,
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  transition: 'all 0.15s'
};

const confirmBoxStyle: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '6px',
  padding: '0.85rem 1rem'
};

const confirmButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  backgroundColor: '#d97706',
  color: '#ffffff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  fontSize: '0.8rem',
  fontWeight: 500,
  backgroundColor: '#ffffff',
  color: '#475569',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  cursor: 'pointer'
};

const errorStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontSize: '0.85rem',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  borderRadius: '4px',
  border: '1px solid #fecaca'
};
