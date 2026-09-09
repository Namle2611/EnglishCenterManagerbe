import React from 'react';
import { Link } from 'react-router-dom';
import type { ClassListItem } from '../../types/class.types';
import { formatClassDateTime } from '../../utils/classHelper';
import { ClassStatusBadge } from './ClassStatusBadge';

interface ClassTableProps {
  classes: ClassListItem[];
  basePath: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onQuickStatusChange: (item: ClassListItem) => void;
  disabled?: boolean;
}

export const ClassTable: React.FC<ClassTableProps> = ({
  classes,
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
            {/* Mã lớp */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('classCode')}
              title="Sắp xếp theo Mã lớp học"
            >
              Mã lớp {renderSortIndicator('classCode')}
            </th>

            {/* Khóa học */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('courseName')}
              title="Sắp xếp theo Tên khóa học"
            >
              Khóa học {renderSortIndicator('courseName')}
            </th>

            {/* Giáo viên - Not sortable per backend whitelist */}
            <th style={{ ...headerCellStyle, cursor: 'default' }}>
              Giáo viên
            </th>

            {/* Bắt đầu */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('startDate')}
              title="Sắp xếp theo Thời gian bắt đầu"
            >
              Bắt đầu {renderSortIndicator('startDate')}
            </th>

            {/* Kết thúc */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('endDate')}
              title="Sắp xếp theo Thời gian kết thúc"
            >
              Kết thúc {renderSortIndicator('endDate')}
            </th>

            {/* Sĩ số tối đa */}
            <th
              style={{
                ...headerCellStyle,
                textAlign: 'right',
                cursor: disabled ? 'default' : 'pointer'
              }}
              onClick={() => !disabled && onSortChange('maxStudents')}
              title="Sắp xếp theo Sĩ số tối đa"
            >
              Sĩ số tối đa {renderSortIndicator('maxStudents')}
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
            <th style={{ ...headerCellStyle, textAlign: 'center' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls, idx) => (
            <tr
              key={cls.id}
              style={{
                borderBottom:
                  idx === classes.length - 1 ? 'none' : '1px solid var(--color-border, #f1f5f9)',
                transition: 'background-color 0.1s ease',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, #f8fafc)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* ClassCode */}
              <td style={{ ...cellStyle, fontWeight: 600 }}>
                <Link
                  to={`${basePath}/${cls.id}`}
                  style={{
                    color: 'var(--color-primary, #1e40af)',
                    textDecoration: 'none',
                    fontFamily: 'monospace'
                  }}
                  title="Xem chi tiết lớp học"
                >
                  {cls.classCode}
                </Link>
              </td>

              {/* Course */}
              <td style={{ ...cellStyle, color: 'var(--color-text-primary, #0f172a)' }}>
                <span style={{ fontWeight: 500 }}>{cls.courseName}</span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted, #64748b)',
                    fontFamily: 'monospace'
                  }}
                >
                  {cls.courseCode}
                </span>
              </td>

              {/* Teacher */}
              <td style={cellStyle}>
                {cls.teacherName ? (
                  <div>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-primary, #0f172a)' }}>
                      {cls.teacherName}
                    </span>
                    {cls.teacherCode && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted, #64748b)',
                          fontFamily: 'monospace'
                        }}
                      >
                        {cls.teacherCode}
                      </span>
                    )}
                  </div>
                ) : (
                  <span
                    style={{
                      fontStyle: 'italic',
                      color: 'var(--color-text-muted, #94a3b8)',
                      fontSize: '0.8125rem'
                    }}
                  >
                    Chưa phân công
                  </span>
                )}
              </td>

              {/* Start Date */}
              <td style={{ ...cellStyle, color: 'var(--color-text-secondary, #334155)' }}>
                {formatClassDateTime(cls.startDate)}
              </td>

              {/* End Date */}
              <td style={{ ...cellStyle, color: 'var(--color-text-secondary, #334155)' }}>
                {formatClassDateTime(cls.endDate)}
              </td>

              {/* Max Students */}
              <td
                style={{
                  ...cellStyle,
                  textAlign: 'right',
                  color: 'var(--color-text-primary, #0f172a)',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {cls.maxStudents}
              </td>

              {/* Status */}
              <td style={cellStyle}>
                <ClassStatusBadge status={cls.status} />
              </td>

              {/* Actions */}
              <td style={{ ...cellStyle, textAlign: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'center'
                  }}
                >
                  <Link
                    to={`${basePath}/${cls.id}`}
                    style={actionLinkStyle}
                    title="Xem chi tiết lớp học"
                  >
                    Xem
                  </Link>
                  <span style={{ color: 'var(--color-border, #cbd5e1)' }}>|</span>
                  <Link
                    to={`${basePath}/${cls.id}/edit`}
                    style={actionLinkStyle}
                    title="Chỉnh sửa thông tin lớp học"
                  >
                    Sửa
                  </Link>
                  <span style={{ color: 'var(--color-border, #cbd5e1)' }}>|</span>
                  <button
                    type="button"
                    onClick={() => onQuickStatusChange(cls)}
                    disabled={disabled}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#d97706',
                      fontWeight: 500,
                      fontSize: '0.8125rem',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      padding: 0
                    }}
                    title="Đổi trạng thái lớp học"
                  >
                    Đổi trạng thái
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const headerCellStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  fontWeight: 600,
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary, #334155)',
  userSelect: 'none',
  whiteSpace: 'nowrap'
};

const cellStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap'
};

const actionLinkStyle: React.CSSProperties = {
  color: 'var(--color-primary, #1e40af)',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: '0.8125rem'
};
