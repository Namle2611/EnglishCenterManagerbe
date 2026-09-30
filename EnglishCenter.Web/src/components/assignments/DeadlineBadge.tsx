import React from 'react';
import { formatDateTime, getDeadlineBadgeInfo } from '../../utils/assignmentHelper';

interface DeadlineBadgeProps {
  deadline: string;
  showDate?: boolean;
}

export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({ deadline, showDate = true }) => {
  const info = getDeadlineBadgeInfo(deadline);
  const formatted = formatDateTime(deadline);

  const getStyle = (): React.CSSProperties => {
    switch (info.variant) {
      case 'danger':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
          border: '1px solid rgba(239, 68, 68, 0.25)'
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#d97706',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        };
      case 'info':
      default:
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#2563eb',
          border: '1px solid rgba(59, 130, 246, 0.25)'
        };
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.15rem' }}>
      {showDate && (
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>
          {formatted}
        </span>
      )}
      <span
        style={{
          ...getStyle(),
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.15rem 0.45rem',
          borderRadius: '9999px',
          fontSize: '0.7rem',
          fontWeight: 600,
          width: 'fit-content',
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}
        aria-label={`Hạn nộp: ${formatted} (${info.label})`}
      >
        <span>●</span>
        <span>{info.label}</span>
      </span>
    </div>
  );
};
