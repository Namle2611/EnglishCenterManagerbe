import React from 'react';
import { Link } from 'react-router-dom';
import type { ScheduleListItem } from '../../types/schedule.types';
import { DAY_OF_WEEK_LABELS, formatTimeRange } from '../../utils/scheduleHelper';

interface ScheduleTableProps {
  schedules: ScheduleListItem[];
  basePath: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onDeleteClick: (schedule: ScheduleListItem) => void;
  disabled?: boolean;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedules,
  basePath,
  sortBy,
  sortDirection,
  onSortChange,
  onDeleteClick,
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
          color: isCurrent ? 'var(--color-primary, #2563eb)' : 'var(--color-text-muted, #94a3b8)',
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
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 12px)',
        backgroundColor: 'var(--color-surface, #ffffff)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
      }}
    >
      <table
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
              backgroundColor: 'var(--color-surface-hover, #f8fafc)',
              borderBottom: '1px solid var(--color-border, #e2e8f0)'
            }}
          >
            {/* Thứ */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer', width: '130px' }}
              onClick={() => !disabled && onSortChange('dayofweek')}
              title="Sắp xếp theo Thứ trong tuần"
            >
              Thứ {renderSortIndicator('dayofweek')}
            </th>

            {/* Khung giờ */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer', width: '150px' }}
              onClick={() => !disabled && onSortChange('starttime')}
              title="Sắp xếp theo Giờ bắt đầu"
            >
              Khung giờ {renderSortIndicator('starttime')}
            </th>

            {/* Lớp học */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('classcode')}
              title="Sắp xếp theo Mã lớp"
            >
              Lớp học {renderSortIndicator('classcode')}
            </th>

            {/* Phòng học */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('roomcode')}
              title="Sắp xếp theo Mã phòng"
            >
              Phòng học {renderSortIndicator('roomcode')}
            </th>

            {/* Giảng viên */}
            <th style={headerCellStyle}>
              Giảng viên
            </th>

            {/* Thao tác */}
            <th style={{ ...headerCellStyle, textAlign: 'right', width: '180px' }}>
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => {
            const dayLabel = DAY_OF_WEEK_LABELS[schedule.dayOfWeek] || `Thứ ${schedule.dayOfWeek}`;
            const timeRange = formatTimeRange(schedule.startTime, schedule.endTime);
            const roomDisplay = schedule.roomName
              ? `${schedule.roomCode} (${schedule.roomName})`
              : `${schedule.roomCode} (Chưa đặt tên)`;
            const teacherDisplay = schedule.teacherName || 'Chưa phân công';

            return (
              <tr
                key={schedule.id}
                style={{
                  borderBottom: '1px solid var(--color-border, #e2e8f0)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, #f8fafc)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Thứ */}
                <td style={bodyCellStyle}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full, 9999px)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--color-primary-subtle, #eff6ff)',
                      color: 'var(--color-primary, #2563eb)',
                      border: '1px solid var(--color-primary-border, #bfdbfe)'
                    }}
                  >
                    {dayLabel}
                  </span>
                </td>

                {/* Khung giờ */}
                <td style={{ ...bodyCellStyle, fontWeight: 500, color: 'var(--color-text-primary, #0f172a)' }}>
                  {timeRange}
                </td>

                {/* Lớp học */}
                <td style={bodyCellStyle}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
                    {schedule.classCode}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #475569)' }}>
                    {schedule.courseName}
                  </div>
                </td>

                {/* Phòng học */}
                <td style={bodyCellStyle}>
                  <div style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                    {roomDisplay}
                  </div>
                </td>

                {/* Giảng viên */}
                <td style={bodyCellStyle}>
                  <span
                    style={{
                      color: schedule.teacherName
                        ? 'var(--color-text-primary, #0f172a)'
                        : 'var(--color-text-muted, #94a3b8)',
                      fontStyle: schedule.teacherName ? 'normal' : 'italic'
                    }}
                  >
                    {teacherDisplay}
                  </span>
                </td>

                {/* Thao tác */}
                <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* View Detail Link */}
                    <Link
                      to={`${basePath}/${schedule.id}`}
                      style={actionLinkStyle}
                      title="Xem chi tiết lịch học"
                    >
                      Chi tiết
                    </Link>

                    {/* Edit Link */}
                    <Link
                      to={`${basePath}/${schedule.id}/edit`}
                      style={actionLinkStyle}
                      title="Chỉnh sửa lịch học"
                    >
                      Sửa
                    </Link>

                    {/* Delete Action */}
                    <button
                      type="button"
                      onClick={() => onDeleteClick(schedule)}
                      disabled={disabled}
                      style={{
                        ...actionLinkStyle,
                        color: 'var(--status-danger-text, #b91c1c)',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: disabled ? 'not-allowed' : 'pointer'
                      }}
                      title="Xóa lịch học"
                    >
                      Xóa
                    </button>
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
  padding: '0.875rem 1rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary, #475569)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
  userSelect: 'none'
};

const bodyCellStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap'
};

const actionLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-primary, #2563eb)',
  textDecoration: 'none',
  padding: '0.25rem 0.375rem',
  borderRadius: 'var(--radius-sm, 4px)',
  transition: 'opacity 0.15s ease'
};
