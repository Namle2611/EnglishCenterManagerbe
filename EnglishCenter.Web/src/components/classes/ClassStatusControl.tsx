import React, { useState } from 'react';
import type { ClassStatus } from '../../types/class.types';
import { CLASS_STATUS_LABELS, VALID_CLASS_STATUSES } from '../../utils/classHelper';
import { ClassStatusBadge } from './ClassStatusBadge';

interface ClassStatusControlProps {
  currentStatus: ClassStatus;
  onStatusChange: (newStatus: ClassStatus) => Promise<void>;
  disabled?: boolean;
}

export const ClassStatusControl: React.FC<ClassStatusControlProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false
}) => {
  const [targetStatus, setTargetStatus] = useState<ClassStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getConfirmationMessage = (status: ClassStatus): string => {
    const label = CLASS_STATUS_LABELS[status] || status;
    return `Bạn có chắc chắn muốn chuyển trạng thái lớp sang "${label}"?`;
  };

  const handleSelectStatus = (status: ClassStatus) => {
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
        setErrorMessage('Không thể cập nhật trạng thái lớp học.');
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
            <ClassStatusBadge status={currentStatus} />
          </div>
        </div>

        {/* Quick Transition Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {VALID_CLASS_STATUSES.map((status) => {
            const isCurrent = status === currentStatus;
            const isSelected = status === targetStatus;
            const label = CLASS_STATUS_LABELS[status];

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

      {/* Confirmation Box (when a transition is pending) */}
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
