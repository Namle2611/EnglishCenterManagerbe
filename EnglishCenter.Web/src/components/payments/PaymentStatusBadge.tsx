import React from 'react';
import type { PaymentStatus } from '../../types/payment.types';
import { PAYMENT_STATUS_LABELS } from '../../utils/paymentHelper';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

interface StatusVisualConfig {
  label: string;
  bg: string;
  color: string;
  border: string;
  dotColor: string;
}

const statusConfig: Record<PaymentStatus, StatusVisualConfig> = {
  Pending: {
    label: PAYMENT_STATUS_LABELS.Pending,
    bg: 'var(--status-warning-bg)',
    color: 'var(--status-warning-text)',
    border: 'var(--status-warning-border)',
    dotColor: 'var(--status-warning-text)'
  },
  Completed: {
    label: PAYMENT_STATUS_LABELS.Completed,
    bg: 'var(--status-active-bg)',
    color: 'var(--status-active-text)',
    border: 'var(--status-active-border)',
    dotColor: 'var(--status-active-text)'
  },
  Failed: {
    label: PAYMENT_STATUS_LABELS.Failed,
    bg: 'var(--status-danger-bg)',
    color: 'var(--status-danger-text)',
    border: 'var(--status-danger-border)',
    dotColor: 'var(--status-danger-text)'
  },
  Cancelled: {
    label: PAYMENT_STATUS_LABELS.Cancelled,
    bg: 'var(--status-inactive-bg)',
    color: 'var(--status-inactive-text)',
    border: 'var(--status-inactive-border)',
    dotColor: 'var(--status-inactive-text)'
  }
};

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
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
