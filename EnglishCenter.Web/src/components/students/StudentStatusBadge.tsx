import React from 'react';
import type { StudentStatus } from '../../types/student.types';

interface StudentStatusBadgeProps {
  status: StudentStatus;
}

const statusConfig: Record<
  StudentStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  Active: {
    label: 'Đang hoạt động',
    bg: '#ecfdf5',
    color: '#065f46',
    border: '#a7f3d0'
  },
  Inactive: {
    label: 'Không hoạt động',
    bg: '#f1f5f9',
    color: '#475569',
    border: '#cbd5e1'
  },
  Graduated: {
    label: 'Đã tốt nghiệp',
    bg: '#eff6ff',
    color: '#1e40af',
    border: '#bfdbfe'
  },
  Suspended: {
    label: 'Tạm khóa',
    bg: '#fffbeb',
    color: '#92400e',
    border: '#fde68a'
  }
};

export const StudentStatusBadge: React.FC<StudentStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || {
    label: status,
    bg: '#f8fafc',
    color: '#334155',
    border: '#e2e8f0'
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
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
      {config.label}
    </span>
  );
};
