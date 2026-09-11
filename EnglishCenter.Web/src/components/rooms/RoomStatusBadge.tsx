import React from 'react';
import type { RoomStatus } from '../../types/room.types';
import { ROOM_STATUS_LABELS } from '../../utils/roomHelper';

interface RoomStatusBadgeProps {
  status: RoomStatus;
}

interface StatusVisualConfig {
  label: string;
  bg: string;
  color: string;
  border: string;
  dotColor: string;
}

const statusConfig: Record<RoomStatus, StatusVisualConfig> = {
  Active: {
    label: ROOM_STATUS_LABELS.Active,
    bg: '#ecfdf5',
    color: '#065f46',
    border: '#a7f3d0',
    dotColor: '#10b981'
  },
  Inactive: {
    label: ROOM_STATUS_LABELS.Inactive,
    bg: '#fef2f2',
    color: '#991b1b',
    border: '#fecaca',
    dotColor: '#ef4444'
  },
  Maintenance: {
    label: ROOM_STATUS_LABELS.Maintenance,
    bg: '#fffbeb',
    color: '#92400e',
    border: '#fde68a',
    dotColor: '#f59e0b'
  }
};

export const RoomStatusBadge: React.FC<RoomStatusBadgeProps> = ({ status }) => {
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
