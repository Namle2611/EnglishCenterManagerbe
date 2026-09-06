import React, { useState } from 'react';
import type { TeacherStatus } from '../../types/teacher.types';
import { TeacherStatusBadge } from './TeacherStatusBadge';

interface TeacherStatusControlProps {
  currentStatus: TeacherStatus;
  onStatusChange: (newStatus: TeacherStatus) => Promise<void>;
  disabled?: boolean;
}

const ALL_STATUSES: TeacherStatus[] = ['Active', 'Inactive'];

export const TeacherStatusControl: React.FC<TeacherStatusControlProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false
}) => {
  const [targetStatus, setTargetStatus] = useState<TeacherStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getConfirmationMessage = (status: TeacherStatus): string => {
    switch (status) {
      case 'Inactive':
        return 'Bạn có chắc chắn muốn chuyển giáo viên sang KHÔNG HOẠT ĐỘNG? Giáo viên sẽ không thể đăng nhập mới hoặc làm mới phiên cho đến khi được kích hoạt lại.';
      case 'Active':
        return 'Bạn có chắc chắn muốn KÍCH HOẠT LẠI tài khoản giáo viên này? Giáo viên sẽ có thể đăng nhập và truy cập các hoạt động trên hệ thống.';
      default:
        return `Bạn có chắc chắn muốn chuyển trạng thái giáo viên sang ${status}?`;
    }
  };

  const handleSelectStatus = (status: TeacherStatus) => {
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
        setErrorMessage('Không thể cập nhật trạng thái giáo viên.');
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
            Quản lý trạng thái giáo viên
          </h4>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Trạng thái sẽ đồng bộ quyền truy cập và tài khoản của giáo viên trên hệ thống.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#475569' }}>Hiện tại:</span>
          <TeacherStatusBadge status={currentStatus} />
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
                backgroundColor: isCurrent
                  ? '#e2e8f0'
                  : isSelected
                  ? '#dbeafe'
                  : '#ffffff',
                color: isCurrent
                  ? '#94a3b8'
                  : isSelected
                  ? '#1d4ed8'
                  : '#334155',
                borderColor: isSelected ? '#3b82f6' : '#cbd5e1',
                cursor: isCurrent || isBusy ? 'not-allowed' : 'pointer'
              }}
            >
              {status === 'Active' ? 'Đang hoạt động' : 'Không hoạt động'}
              {isCurrent && ' (Hiện tại)'}
            </button>
          );
        })}
      </div>

      {/* Confirmation Modal / Panel */}
      {targetStatus && (
        <div style={confirmPanelStyle}>
          <div style={confirmMessageStyle}>
            <strong>Xác nhận thay đổi trạng thái:</strong>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem' }}>
              {getConfirmationMessage(targetStatus)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isBusy}
              style={cancelButtonStyle}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isBusy}
              style={{
                ...confirmButtonStyle,
                backgroundColor: targetStatus === 'Inactive' ? '#b91c1c' : '#16a34a'
              }}
            >
              {isUpdating ? 'Đang cập nhật...' : 'Xác nhận'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.75rem'
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
  transition: 'all 0.15s ease'
};

const confirmPanelStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #fde68a',
  borderRadius: '6px',
  padding: '0.85rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const confirmMessageStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#78350f',
  lineHeight: 1.4
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  fontSize: '0.8rem',
  fontWeight: 500,
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  color: '#475569',
  cursor: 'pointer'
};

const confirmButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  border: 'none',
  borderRadius: '4px',
  color: '#ffffff',
  cursor: 'pointer'
};

const errorStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  color: '#b91c1c',
  fontSize: '0.8rem'
};
