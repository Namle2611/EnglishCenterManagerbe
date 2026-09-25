import React from 'react';
import { Link } from 'react-router-dom';
import type { AttendanceListItem } from '../../types/attendance.types';
import {
  formatAttendanceDate,
  toDisplayTime
} from '../../utils/attendanceHelper';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

interface AttendanceTableProps {
  attendances: AttendanceListItem[];
  basePath: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  disabled?: boolean;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  attendances,
  basePath,
  sortBy,
  sortDirection,
  onSortChange,
  disabled = false
}) => {
  const renderSortIndicator = (column: string) => {
    const isCurrent = sortBy?.toLowerCase() === column.toLowerCase();
    return (
      <span
        style={{
          display: 'inline-flex',
          marginLeft: '4px',
          verticalAlign: 'middle',
          color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-muted)',
          opacity: isCurrent ? 1 : 0.4
        }}
        aria-hidden="true"
      >
        {isCurrent ? (sortDirection === 'desc' ? '▼' : '▲') : '⇅'}
      </span>
    );
  };

  return (
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <table
        id="attendance-history-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.875rem'
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: 'var(--color-surface-hover)',
              borderBottom: '1px solid var(--color-border)'
            }}
          >
            {/* ID */}
            <th
              id="attendance-sort-id"
              style={{ ...headerCellStyle, width: '60px', cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('id')}
              title="Sắp xếp theo ID"
            >
              ID {renderSortIndicator('id')}
            </th>

            {/* Session Date */}
            <th
              id="attendance-sort-sessiondate"
              style={{ ...headerCellStyle, width: '110px', cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('sessiondate')}
              title="Sắp xếp theo Ngày học"
            >
              Ngày học {renderSortIndicator('sessiondate')}
            </th>

            {/* Start Time */}
            <th
              id="attendance-sort-starttime"
              style={{ ...headerCellStyle, width: '90px', cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('starttime')}
              title="Sắp xếp theo Giờ bắt đầu"
            >
              Giờ học {renderSortIndicator('starttime')}
            </th>

            {/* Class Code */}
            <th
              id="attendance-sort-classcode"
              style={{ ...headerCellStyle, width: '130px', cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('classcode')}
              title="Sắp xếp theo Mã lớp"
            >
              Lớp học {renderSortIndicator('classcode')}
            </th>

            {/* Student Code */}
            <th
              id="attendance-sort-studentcode"
              style={{ ...headerCellStyle, width: '120px', cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('studentcode')}
              title="Sắp xếp theo Mã học viên"
            >
              Mã HV {renderSortIndicator('studentcode')}
            </th>

            {/* Student Name */}
            <th
              id="attendance-sort-studentname"
              style={{ ...headerCellStyle, minWidth: '160px', cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('studentname')}
              title="Sắp xếp theo Tên học viên"
            >
              Học viên {renderSortIndicator('studentname')}
            </th>

            {/* Status */}
            <th
              id="attendance-sort-status"
              style={{ ...headerCellStyle, width: '120px', cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('status')}
              title="Sắp xếp theo Trạng thái"
            >
              Trạng thái {renderSortIndicator('status')}
            </th>

            {/* Note */}
            <th style={{ ...headerCellStyle, minWidth: '150px' }}>
              Ghi chú
            </th>

            {/* Actions */}
            <th style={{ ...headerCellStyle, width: '180px', textAlign: 'center' }}>
              Hành động
            </th>
          </tr>
        </thead>
        <tbody>
          {attendances.map((item) => {
            const sessionUrl = `${basePath}/session?classId=${item.classId}&sessionDate=${item.sessionDate}&startTime=${item.startTime}`;
            const detailUrl = `${basePath}/${item.id}`;

            return (
              <tr
                key={item.id}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* ID */}
                <td style={{ ...cellStyle, color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                  #{item.id}
                </td>

                {/* Session Date */}
                <td style={{ ...cellStyle, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {formatAttendanceDate(item.sessionDate)}
                </td>

                {/* Start Time */}
                <td style={{ ...cellStyle, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                  {toDisplayTime(item.startTime)}
                </td>

                {/* Class Code */}
                <td style={{ ...cellStyle, fontWeight: 600 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      color: 'var(--color-primary)'
                    }}
                  >
                    {item.classCode}
                  </span>
                </td>

                {/* Student Code */}
                <td style={{ ...cellStyle, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}>
                  {item.studentCode}
                </td>

                {/* Student Name */}
                <td style={{ ...cellStyle, fontWeight: 500 }}>
                  {item.studentName}
                </td>

                {/* Status */}
                <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                  <AttendanceStatusBadge status={item.status} />
                </td>

                {/* Note */}
                <td
                  style={{
                    ...cellStyle,
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.8125rem',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={item.note || ''}
                >
                  {item.note || '-'}
                </td>

                {/* Actions */}
                <td style={{ ...cellStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}>
                    <Link
                      to={detailUrl}
                      style={actionLinkStyle}
                      title="Xem chi tiết & Điều chỉnh"
                      data-testid={`attendance-detail-link-${item.id}`}
                    >
                      👁️ Chi tiết
                    </Link>
                    <Link
                      to={sessionUrl}
                      style={{
                        ...actionLinkStyle,
                        backgroundColor: 'var(--color-surface-subtle)',
                        color: 'var(--color-primary)'
                      }}
                      title="Mở bảng điểm danh buổi học"
                      data-testid={`attendance-session-link-${item.id}`}
                    >
                      📋 Buổi học
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const headerCellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontWeight: 600,
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  userSelect: 'none',
  whiteSpace: 'nowrap'
};

const cellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  verticalAlign: 'middle'
};

const actionLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.25rem 0.625rem',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.75rem',
  fontWeight: 500,
  textDecoration: 'none',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)'
};
