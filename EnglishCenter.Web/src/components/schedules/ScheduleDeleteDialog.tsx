import React, { useRef, useState } from 'react';
import type { ScheduleDetail, ScheduleListItem } from '../../types/schedule.types';
import { DAY_OF_WEEK_LABELS, formatTimeRange } from '../../utils/scheduleHelper';

interface ScheduleDeleteDialogProps {
  schedule: ScheduleListItem | ScheduleDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ScheduleDeleteDialog: React.FC<ScheduleDeleteDialogProps> = ({
  schedule,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const isDeletingRef = useRef<boolean>(false);

  if (!isOpen || !schedule) return null;

  const dayLabel = DAY_OF_WEEK_LABELS[schedule.dayOfWeek] || `Thứ ${schedule.dayOfWeek}`;
  const timeRange = formatTimeRange(schedule.startTime, schedule.endTime);
  const roomDisplay = schedule.roomName
    ? `${schedule.roomCode} (${schedule.roomName})`
    : `${schedule.roomCode} (Chưa đặt tên)`;

  const handleConfirm = async () => {
    // Synchronous guard to immediately drop rapid duplicate clicks
    if (isDeletingRef.current) return;

    isDeletingRef.current = true;
    setIsDeleting(true);

    try {
      await onConfirm();
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={() => !isDeleting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-schedule-title"
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-xl, 16px)',
          maxWidth: '500px',
          width: '100%',
          boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(15, 23, 42, 0.08))',
          border: '1px solid var(--color-border, #e2e8f0)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full, 9999px)',
                backgroundColor: 'var(--status-danger-bg, #fee2e2)',
                color: 'var(--status-danger-text, #b91c1c)',
                fontSize: '1.125rem'
              }}
              aria-hidden="true"
            >
              ⚠️
            </span>
            <h2
              id="delete-schedule-title"
              style={{
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #0f172a)'
              }}
            >
              Xác nhận xóa lịch học
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--color-text-muted, #94a3b8)',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              padding: '0.25rem',
              lineHeight: 1
            }}
            aria-label="Đóng hộp thoại"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem' }}>
          <p
            style={{
              margin: '0 0 1rem 0',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              color: 'var(--color-text-secondary, #475569)'
            }}
          >
            Bạn có chắc chắn muốn xóa khung giờ học sau khỏi hệ thống? Thao tác này sẽ xóa vĩnh viễn dữ liệu xếp lịch và không thể hoàn tác.
          </p>

          <div
            style={{
              backgroundColor: 'var(--color-canvas, #f8fafc)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '1rem',
              border: '1px solid var(--color-border, #e2e8f0)',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}
          >
            <div>
              <span style={{ color: 'var(--color-text-muted, #94a3b8)', marginRight: '0.5rem' }}>Lớp học:</span>
              <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                {schedule.classCode} ({schedule.courseName})
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted, #94a3b8)', marginRight: '0.5rem' }}>Phòng học:</span>
              <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                {roomDisplay}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-muted, #94a3b8)', marginRight: '0.5rem' }}>Khung giờ:</span>
              <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                {dayLabel}, {timeRange}
              </strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary, #475569)',
                backgroundColor: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border, #cbd5e1)',
                borderRadius: 'var(--radius-md, 8px)',
                cursor: isDeleting ? 'not-allowed' : 'pointer'
              }}
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: 'var(--status-danger-text, #b91c1c)',
                border: 'none',
                borderRadius: 'var(--radius-md, 8px)',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
