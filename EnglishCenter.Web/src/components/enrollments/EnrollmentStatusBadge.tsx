import React from 'react';
import type { EnrollmentStatus } from '../../types/enrollment.types';
import { ENROLLMENT_STATUS_LABELS } from '../../utils/enrollmentHelper';

interface EnrollmentStatusBadgeProps {
  status: EnrollmentStatus;
}

interface StatusVisualConfig {
  label: string;
  bg: string;
  color: string;
  border: string;
  dotColor: string;
}

const statusConfig: Record<EnrollmentStatus, StatusVisualConfig> = {
  Pending: {
    label: ENROLLMENT_STATUS_LABELS.Pending,
    bg: 'var(--status-warning-bg)',
    color: 'var(--status-warning-text)',
    border: 'var(--status-warning-border)',
    dotColor: 'var(--status-warning-text)'
  },
  Confirmed: {
    label: ENROLLMENT_STATUS_LABELS.Confirmed,
    bg: 'var(--color-primary-subtle)',
    color: 'var(--color-primary-active)',
    border: 'var(--color-primary-border)',
    dotColor: 'var(--color-primary)'
  },
  Paid: {
    label: ENROLLMENT_STATUS_LABELS.Paid,
    bg: 'var(--role-staff-bg)',
    color: 'var(--role-staff-text)',
    border: 'var(--role-staff-border)',
    dotColor: 'var(--role-staff-text)'
  },
  Enrolled: {
    label: ENROLLMENT_STATUS_LABELS.Enrolled,
    bg: 'var(--status-active-bg)',
    color: 'var(--status-active-text)',
    border: 'var(--status-active-border)',
    dotColor: 'var(--status-active-text)'
  },
  Cancelled: {
    label: ENROLLMENT_STATUS_LABELS.Cancelled,
    bg: 'var(--status-danger-bg)',
    color: 'var(--status-danger-text)',
    border: 'var(--status-danger-border)',
    dotColor: 'var(--status-danger-text)'
  }
};

export const EnrollmentStatusBadge: React.FC<EnrollmentStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || {
    label: status,
    bg: 'var(--color-surface-subtle)',
    color: 'var(--color-text-secondary)',
    border: 'var(--color-border)',
    dotColor: 'var(--color-text-muted)'
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.2rem 0.625rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.25
      }}
    >
      <span
        style={{
          width: '0.375rem',
          height: '0.375rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: config.dotColor,
          display: 'inline-block'
        }}
      />
      {config.label}
    </span>
  );
};
