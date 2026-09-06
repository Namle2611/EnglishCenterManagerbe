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
    if (sortBy?.toLowerCase() !== column.toLowerCase()) {
      return <span style={{ opacity: 0.3, marginLeft: '4px' }}>⇅</span>;
    }
    return (
      <span style={{ color: '#2563eb', marginLeft: '4px', fontWeight: 'bold' }}>
        {sortDirection === 'desc' ? '▼' : '▲'}
      </span>
    );
  };

  return (
    <div style={tableContainerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr style={headerRowStyle}>
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
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('durationMonths')}
              title="Sắp xếp theo Thời lượng"
            >
              Thời lượng {renderSortIndicator('durationMonths')}
            </th>
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
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
                ...rowStyle,
                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
              }}
            >
              <td style={{ ...cellStyle, fontWeight: 600, color: '#1e293b' }}>
                <Link
                  to={`${basePath}/${course.id}`}
                  style={{ color: '#2563eb', textDecoration: 'none' }}
                  title="Xem chi tiết khóa học"
                >
                  {course.courseCode}
                </Link>
              </td>
              <td style={{ ...cellStyle, color: '#1e293b', fontWeight: 500 }}>
                {course.courseName}
              </td>
              <td style={{ ...cellStyle, color: '#475569' }}>
                {course.level || <span style={{ color: '#94a3b8' }}>Chưa xác định</span>}
              </td>
              <td style={{ ...cellStyle, color: '#475569' }}>
                {formatDurationMonths(course.durationMonths)}
              </td>
              <td style={{ ...cellStyle, color: '#0f172a', fontWeight: 600 }}>
                {formatCurrency(course.tuitionFee)}
              </td>
              <td style={cellStyle}>
                <CourseStatusBadge status={course.status} />
              </td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>
                <div style={actionButtonGroupStyle}>
                  <Link
                    to={`${basePath}/${course.id}`}
                    style={actionLinkStyle}
                    title="Xem chi tiết khóa học"
                  >
                    Xem
                  </Link>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <Link
                    to={`${basePath}/${course.id}/edit`}
                    style={actionLinkStyle}
                    title="Chỉnh sửa thông tin khóa học"
                  >
                    Sửa
                  </Link>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <button
                    type="button"
                    onClick={() => onQuickStatusChange(course)}
                    disabled={disabled}
                    style={quickStatusButtonStyle}
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

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '0.875rem'
};

const headerRowStyle: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  borderBottom: '1px solid #e2e8f0'
};

const headerCellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontWeight: 600,
  color: '#334155',
  userSelect: 'none',
  whiteSpace: 'nowrap'
};

const rowStyle: React.CSSProperties = {
  borderBottom: '1px solid #e2e8f0',
  transition: 'background-color 0.15s ease'
};

const cellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  verticalAlign: 'middle'
};

const actionButtonGroupStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  justifyContent: 'center'
};

const actionLinkStyle: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: '0.8rem'
};

const quickStatusButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#d97706',
  fontWeight: 500,
  fontSize: '0.8rem',
  cursor: 'pointer',
  padding: 0
};
