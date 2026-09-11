import React from 'react';
import { Link } from 'react-router-dom';
import type { RoomListItem } from '../../types/room.types';
import { RoomStatusBadge } from './RoomStatusBadge';

interface RoomTableProps {
  rooms: RoomListItem[];
  basePath: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onQuickStatusChange: (item: RoomListItem) => void;
  disabled?: boolean;
}

export const RoomTable: React.FC<RoomTableProps> = ({
  rooms,
  basePath,
  sortBy,
  sortDirection,
  onSortChange,
  onQuickStatusChange,
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
          color: isCurrent ? 'var(--color-primary, #1e40af)' : 'var(--color-text-muted, #94a3b8)',
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
            {/* Mã phòng */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('roomCode')}
              title="Sắp xếp theo Mã phòng"
            >
              Mã phòng {renderSortIndicator('roomCode')}
            </th>

            {/* Tên phòng */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('roomName')}
              title="Sắp xếp theo Tên phòng"
            >
              Tên phòng {renderSortIndicator('roomName')}
            </th>

            {/* Sức chứa */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('capacity')}
              title="Sắp xếp theo Sức chứa"
            >
              Sức chứa {renderSortIndicator('capacity')}
            </th>

            {/* Trạng thái */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('status')}
              title="Sắp xếp theo Trạng thái"
            >
              Trạng thái {renderSortIndicator('status')}
            </th>

            {/* Thao tác */}
            <th style={{ ...headerCellStyle, textAlign: 'right' }}>
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room, idx) => {
            const isEven = idx % 2 === 0;

            return (
              <tr
                key={room.id}
                style={{
                  backgroundColor: isEven ? 'var(--color-surface, #ffffff)' : 'var(--color-canvas, #f8fafc)',
                  borderBottom: '1px solid var(--color-border, #f1f5f9)',
                  transition: 'background-color 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, #f1f5f9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isEven
                    ? 'var(--color-surface, #ffffff)'
                    : 'var(--color-canvas, #f8fafc)';
                }}
              >
                {/* Mã phòng */}
                <td style={bodyCellStyle}>
                  <Link
                    to={`${basePath}/${room.id}`}
                    style={{
                      fontWeight: 600,
                      color: 'var(--color-primary, #1e40af)',
                      textDecoration: 'none',
                      fontFamily: 'monospace',
                      fontSize: '0.9375rem'
                    }}
                  >
                    {room.roomCode}
                  </Link>
                </td>

                {/* Tên phòng */}
                <td style={bodyCellStyle}>
                  {room.roomName ? (
                    <span style={{ color: 'var(--color-text-primary, #0f172a)' }}>{room.roomName}</span>
                  ) : (
                    <span
                      style={{
                        color: 'var(--color-text-muted, #94a3b8)',
                        fontStyle: 'italic',
                        fontSize: '0.8125rem'
                      }}
                    >
                      Chưa đặt tên
                    </span>
                  )}
                </td>

                {/* Sức chứa */}
                <td style={bodyCellStyle}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-primary, #0f172a)' }}>
                    {room.capacity} chỗ
                  </span>
                </td>

                {/* Trạng thái */}
                <td style={bodyCellStyle}>
                  <RoomStatusBadge status={room.status} />
                </td>

                {/* Thao tác */}
                <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                    {/* Xem chi tiết */}
                    <Link
                      to={`${basePath}/${room.id}`}
                      style={actionLinkStyle}
                      title="Xem chi tiết phòng học"
                    >
                      Xem
                    </Link>

                    {/* Chỉnh sửa */}
                    <Link
                      to={`${basePath}/${room.id}/edit`}
                      style={actionLinkStyle}
                      title="Chỉnh sửa thông tin phòng học"
                    >
                      Sửa
                    </Link>

                    {/* Quick status change button */}
                    <button
                      type="button"
                      onClick={() => onQuickStatusChange(room)}
                      disabled={disabled}
                      style={actionButtonStyle}
                      title="Chuyển trạng thái phòng học"
                    >
                      Đổi trạng thái
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
  color: 'var(--color-text-muted, #64748b)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  userSelect: 'none',
  whiteSpace: 'nowrap'
};

const bodyCellStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  color: 'var(--color-text-secondary, #334155)',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap'
};

const actionLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.3rem 0.6rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--color-primary, #1e40af)',
  backgroundColor: 'var(--color-surface-subtle, #f1f5f9)',
  border: '1px solid var(--color-border, #cbd5e1)',
  borderRadius: 'var(--radius-sm, 6px)',
  textDecoration: 'none',
  transition: 'all 0.15s ease'
};

const actionButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.3rem 0.6rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--color-text-primary, #0f172a)',
  backgroundColor: 'var(--color-surface, #ffffff)',
  border: '1px solid var(--color-border, #cbd5e1)',
  borderRadius: 'var(--radius-sm, 6px)',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};
