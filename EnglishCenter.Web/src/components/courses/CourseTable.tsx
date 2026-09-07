import React from 'react';
import { Link } from 'react-router-dom';
import type { CourseListItem } from '../../types/course.types';
import { formatCurrency, formatDurationMonths } from '../../utils/courseHelper';
import { CourseStatusBadge } from './CourseStatusBadge';

interface CourseTableProps {
  courses: CourseListItem[];
  basePath: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onQuickStatusChange: (course: CourseListItem) => void;
  disabled?: boolean;
}

export const CourseTable: React.FC<CourseTableProps> = ({
  courses,
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
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('courseCode')}
              title="Sắp xếp theo Mã khóa học"
            >
              Mã khóa học {renderSortIndicator('courseCode')}
            </th>
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('courseName')}
              title="Sắp xếp theo Tên khóa học"
            >
              Tên khóa học {renderSortIndicator('courseName')}
            </th>
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('level')}
              title="Sắp xếp theo Trình độ"
            >
              Trình độ {renderSortIndicator('level')}
            </th>
            <th
              style={{
                ...headerCellStyle,
                textAlign: 'right',
                cursor: disabled ? 'default' : 'pointer'
              }}
              onClick={() => !disabled && onSortChange('durationMonths')}
              title="Sắp xếp theo Thời lượng"
            >
              Thời lượng {renderSortIndicator('durationMonths')}
            </th>
            <th
              style={{
                ...headerCellStyle,
                textAlign: 'right',
                cursor: disabled ? 'default' : 'pointer'
              }}
              onClick={() => !disabled && onSortChange('tuitionFee')}
              title="Sắp xếp theo Học phí"
            >
              Học phí {renderSortIndicator('tuitionFee')}
            </th>
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('status')}
              title="Sắp xếp theo Trạng thái"
            >
              Trạng thái {renderSortIndicator('status')}
            </th>
            <th style={{ ...headerCellStyle, textAlign: 'center' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course, idx) => (
            <tr
              key={course.id}
              style={{
                borderBottom: '1px solid var(--color-border, #e2e8f0)',
                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                transition: 'background-color 0.15s ease'
              }}
            >
              {/* Course Code (Monospace) */}
              <td style={cellStyle}>
                <Link
                  to={`${basePath}/${course.id}`}
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                  title="Xem chi tiết khóa học"
                >
                  <span
                    className="font-mono"
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--color-surface-hover, #f1f5f9)',
                      color: 'var(--color-primary, #1e40af)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm, 4px)',
                      border: '1px solid var(--color-border, #e2e8f0)',
                      letterSpacing: '0.025em'
                    }}
                  >
                    {course.courseCode}
                  </span>
                </Link>
              </td>

              {/* Course Name */}
              <td
                style={{
                  ...cellStyle,
                  color: 'var(--color-text, #0f172a)',
                  fontWeight: 500,
                  maxWidth: '280px'
                }}
              >
                {course.courseName}
              </td>

              {/* Level */}
              <td style={{ ...cellStyle, color: 'var(--color-text-secondary, #475569)' }}>
                {course.level || (
                  <span style={{ color: 'var(--color-text-muted, #94a3b8)', fontStyle: 'italic' }}>
                    Chưa xác định
                  </span>
                )}
              </td>

              {/* Duration (Tabular nums, right aligned) */}
              <td
                className="tabular-nums"
                style={{
                  ...cellStyle,
                  textAlign: 'right',
                  color: 'var(--color-text-secondary, #475569)',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {formatDurationMonths(course.durationMonths)}
              </td>

              {/* Tuition Fee (Tabular nums, NOT monospace, right aligned) */}
              <td
                className="tabular-nums"
                style={{
                  ...cellStyle,
                  textAlign: 'right',
                  color: 'var(--color-text, #0f172a)',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {formatCurrency(course.tuitionFee)}
              </td>

              {/* Status */}
              <td style={cellStyle}>
                <CourseStatusBadge status={course.status} />
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
                    to={`${basePath}/${course.id}`}
                    style={actionLinkStyle}
                    title="Xem chi tiết khóa học"
                  >
                    Xem
                  </Link>
                  <span style={{ color: 'var(--color-border, #cbd5e1)' }}>|</span>
                  <Link
                    to={`${basePath}/${course.id}/edit`}
                    style={actionLinkStyle}
                    title="Chỉnh sửa thông tin khóa học"
                  >
                    Sửa
                  </Link>
                  <span style={{ color: 'var(--color-border, #cbd5e1)' }}>|</span>
                  <button
                    type="button"
                    onClick={() => onQuickStatusChange(course)}
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
                    title="Đổi trạng thái khóa học"
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

