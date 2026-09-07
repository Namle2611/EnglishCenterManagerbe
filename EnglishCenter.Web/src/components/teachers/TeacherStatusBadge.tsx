import React from 'react';
import type { TeacherStatus } from '../../types/teacher.types';

interface TeacherStatusBadgeProps {
  status: TeacherStatus;
}

const statusConfig: Record<
  TeacherStatus,
  { label: string; bg: string; color: string; border: string; dot: string }
> = {
  Active: {
    label: 'Đang hoạt động',
    bg: 'var(--status-active-bg)',
    color: 'var(--status-active-text)',
    border: 'var(--status-active-border)',
    dot: 'var(--status-active-text)'
  },
  Inactive: {
    label: 'Không hoạt động',
    bg: 'var(--status-inactive-bg)',
    color: 'var(--status-inactive-text)',
    border: 'var(--status-inactive-border)',
    dot: 'var(--status-inactive-text)'
  }
};

export const TeacherStatusBadge: React.FC<TeacherStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || {
    label: status,
    bg: 'var(--color-surface-subtle)',
    color: 'var(--color-text-secondary)',
    border: 'var(--color-border)',
    dot: 'var(--color-text-secondary)'
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.2rem 0.55rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.2
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: config.dot
        }}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
};
