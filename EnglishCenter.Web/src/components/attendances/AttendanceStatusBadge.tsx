import React from 'react';
import type { AttendanceStatus } from '../../types/attendance.types';
import {
  getAttendanceStatusBadgeClass,
  getAttendanceStatusLabel
} from '../../utils/attendanceHelper';

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus | null | undefined;
  className?: string;
}

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status,
  className = ''
}) => {
  const label = getAttendanceStatusLabel(status);
  const badgeClass = getAttendanceStatusBadgeClass(status);

  return (
    <span
      className={`badge ${badgeClass} ${className}`.trim()}
      data-testid={`attendance-status-${status || 'unmarked'}`}
    >
      {label}
    </span>
  );
};
