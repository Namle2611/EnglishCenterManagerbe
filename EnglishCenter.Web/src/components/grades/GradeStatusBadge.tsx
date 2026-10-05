import React from 'react';
import type { GradeItemStatus } from '../../types/grade.types';
import { getGradeItemStatusLabel } from '../../utils/gradeHelper';

interface GradeStatusBadgeProps {
  status: GradeItemStatus;
  className?: string;
}

const STATUS_STYLES: Record<
  GradeItemStatus,
  { bg: string; text: string; border: string; icon: string }
> = {
  Missing: {
    bg: '#fef2f2',
    text: '#991b1b',
    border: '#fecaca',
    icon: '✕'
  },
  InProgress: {
    bg: '#eff6ff',
    text: '#1e40af',
    border: '#bfdbfe',
    icon: '⏳'
  },
  Ungraded: {
    bg: '#fffbeb',
    text: '#92400e',
    border: '#fde68a',
    icon: '📝'
  },
  Graded: {
    bg: '#ecfdf5',
    text: '#065f46',
    border: '#a7f3d0',
    icon: '✓'
  },
  Locked: {
    bg: '#f5f3ff',
    text: '#5b21b6',
    border: '#ddd6fe',
    icon: '🔒'
  }
};

export const GradeStatusBadge: React.FC<GradeStatusBadgeProps> = ({ status, className = '' }) => {
  const style = STATUS_STYLES[status] || {
    bg: '#f3f4f6',
    text: '#374151',
    border: '#e5e7eb',
    icon: '•'
  };
  const label = getGradeItemStatusLabel(status);

  return (
    <span
      className={`grade-status-badge grade-status-${status.toLowerCase()} ${className}`}
      data-status={status}
      aria-label={`Trạng thái điểm: ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        lineHeight: 1.2,
        whiteSpace: 'nowrap'
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '0.7rem' }}>
        {style.icon}
      </span>
      <span>{label}</span>
    </span>
  );
};
