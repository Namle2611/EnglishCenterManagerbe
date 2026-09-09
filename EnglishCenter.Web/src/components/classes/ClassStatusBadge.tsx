import React from 'react';
import type { ClassStatus } from '../../types/class.types';
import { CLASS_STATUS_LABELS } from '../../utils/classHelper';

interface ClassStatusBadgeProps {
  status: ClassStatus;
}

interface StatusVisualConfig {
  label: string;
  bg: string;
  color: string;
  border: string;
  dotColor: string;
}

const statusConfig: Record<ClassStatus, StatusVisualConfig> = {
  Planned: {
    label: CLASS_STATUS_LABELS.Planned,
    bg: '#eff6ff',
    color: '#1e40af',
    border: '#bfdbfe',
    dotColor: '#3b82f6'
  },
  Ongoing: {
    label: CLASS_STATUS_LABELS.Ongoing,
    bg: '#ecfdf5',
    color: '#065f46',
    border: '#a7f3d0',
    dotColor: '#10b981'
  },
  Completed: {
    label: CLASS_STATUS_LABELS.Completed,
    bg: '#f0fdfa',
    color: '#115e59',
    border: '#99f6e4',
    dotColor: '#14b8a6'
  },
  Cancelled: {
    label: CLASS_STATUS_LABELS.Cancelled,
    bg: '#fef2f2',
    color: '#991b1b',
    border: '#fecaca',
    dotColor: '#ef4444'
  }
};

export const ClassStatusBadge: React.FC<ClassStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || {
    label: status,
    bg: '#f8fafc',
    color: '#334155',
    border: '#e2e8f0',
    dotColor: '#94a3b8'
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.625rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: '9999px',
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
          borderRadius: '50%',
          backgroundColor: config.dotColor,
          flexShrink: 0
        }}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
};
