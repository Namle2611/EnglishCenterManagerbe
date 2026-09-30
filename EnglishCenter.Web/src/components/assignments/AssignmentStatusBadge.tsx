import React from 'react';
import type { AssignmentStatus } from '../../types/assignment.types';
import { ASSIGNMENT_STATUS_LABELS } from '../../utils/assignmentHelper';

interface AssignmentStatusBadgeProps {
  status: AssignmentStatus;
}

export const AssignmentStatusBadge: React.FC<AssignmentStatusBadgeProps> = ({ status }) => {
  const label = ASSIGNMENT_STATUS_LABELS[status] || status;

  const getStyle = (): React.CSSProperties => {
    switch (status) {
      case 'Published':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        };
      case 'Closed':
        return {
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          color: '#4b5563',
          border: '1px solid rgba(107, 114, 128, 0.25)'
        };
      case 'Draft':
      default:
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#d97706',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        };
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'Published':
        return '✓';
      case 'Closed':
        return '🔒';
      case 'Draft':
      default:
        return '✎';
    }
  };

  return (
    <span
      style={{
        ...getStyle(),
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        userSelect: 'none',
        whiteSpace: 'nowrap'
      }}
      aria-label={`Trạng thái bài tập: ${label}`}
    >
      <span aria-hidden="true" style={{ fontSize: '0.75rem' }}>
        {getIcon()}
      </span>
      <span>{label}</span>
    </span>
  );
};
