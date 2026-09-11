import React, { useState } from 'react';
import type { RoomStatus } from '../../types/room.types';
import { ROOM_STATUS_LABELS, VALID_ROOM_STATUSES } from '../../utils/roomHelper';
import { RoomStatusBadge } from './RoomStatusBadge';

interface RoomStatusControlProps {
  currentStatus: RoomStatus;
  onStatusChange: (newStatus: RoomStatus) => Promise<void>;
  disabled?: boolean;
}

export const RoomStatusControl: React.FC<RoomStatusControlProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false
}) => {
  const [targetStatus, setTargetStatus] = useState<RoomStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isUpdatingRef = React.useRef(false);

  const getConfirmationMessage = (status: RoomStatus): string => {
    const label = ROOM_STATUS_LABELS[status] || status;
    return `Bạn có chắc chắn muốn chuyển trạng thái phòng sang "${label}"?`;
  };

  const handleSelectStatus = (status: RoomStatus) => {
    if (status === currentStatus || isUpdating || isUpdatingRef.current) return;
    setErrorMessage(null);
    setTargetStatus(status);
  };

  const handleConfirm = async () => {
    if (!targetStatus || targetStatus === currentStatus || isUpdating || isUpdatingRef.current) return;

    isUpdatingRef.current = true;
    setIsUpdating(true);
    setErrorMessage(null);

    try {
      await onStatusChange(targetStatus);
      setTargetStatus(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể cập nhật trạng thái phòng học.');
      }
    } finally {
      isUpdatingRef.current = false;
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (isUpdating) return;
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
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-muted, #64748b)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Trạng thái hiện tại
          </span>
          <div style={{ marginTop: '0.375rem' }}>
            <RoomStatusBadge status={currentStatus} />
          </div>
        </div>

        {/* Status Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {VALID_ROOM_STATUSES.map((status) => {
            const isCurrent = status === currentStatus;
            const isSelected = status === targetStatus;
            const label = ROOM_STATUS_LABELS[status];

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleSelectStatus(status)}
                disabled={isBusy || isCurrent}
                style={{
                  padding: '0.4rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-md, 8px)',
                  border: isSelected
                    ? '2px solid var(--color-primary, #1e40af)'
                    : '1px solid var(--color-border, #cbd5e1)',
                  backgroundColor: isCurrent
                    ? 'var(--color-surface-subtle, #f1f5f9)'
                    : isSelected
                    ? 'var(--color-primary-subtle, #eff6ff)'
                    : 'var(--color-surface, #ffffff)',
                  color: isCurrent
                    ? 'var(--color-text-muted, #94a3b8)'
                    : isSelected
                    ? 'var(--color-primary, #1e40af)'
                    : 'var(--color-text-primary, #0f172a)',
                  cursor: isBusy || isCurrent ? 'not-allowed' : 'pointer',
                  opacity: isCurrent ? 0.6 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Box */}
      {targetStatus && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#eff6ff',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid #bfdbfe',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ fontSize: '0.875rem', color: '#1e3a8a', fontWeight: 500, lineHeight: 1.5 }}>
            {getConfirmationMessage(targetStatus)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isBusy}
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--color-primary, #1e40af)',
                color: '#ffffff',
                border: 'none',
                cursor: isBusy ? 'not-allowed' : 'pointer',
                opacity: isBusy ? 0.7 : 1
              }}
            >
              {isUpdating ? 'Đang cập nhật...' : 'Xác nhận thay đổi'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isBusy}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary, #475569)',
                border: '1px solid var(--color-border, #cbd5e1)',
                cursor: isBusy ? 'not-allowed' : 'pointer'
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '0.8125rem'
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};
