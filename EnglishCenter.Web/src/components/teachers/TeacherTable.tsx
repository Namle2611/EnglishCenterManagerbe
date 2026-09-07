import React from 'react';
import { Link } from 'react-router-dom';
import type { TeacherListItem } from '../../types/teacher.types';
import { formatDateOnly } from '../../utils/teacherHelper';
import { TeacherStatusBadge } from './TeacherStatusBadge';

interface TeacherTableProps {
  teachers: TeacherListItem[];
  basePath: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onQuickStatusChange: (teacher: TeacherListItem) => void;
  disabled?: boolean;
}

export const TeacherTable: React.FC<TeacherTableProps> = ({
  teachers,
  basePath,
  sortBy,
  sortDirection,
  onSortChange,
  onQuickStatusChange,
  disabled = false
}) => {
  const renderSortIndicator = (column: string) => {
    if (sortBy?.toLowerCase() !== column.toLowerCase()) {
      return <span style={{ opacity: 0.35, marginLeft: '4px', fontSize: '0.75rem' }}>⇅</span>;
    }
    return (
      <span style={{ color: 'var(--color-primary)', marginLeft: '4px', fontWeight: 'bold' }}>
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
              onClick={() => !disabled && onSortChange('teacherCode')}
              title="Sắp xếp theo Mã giáo viên"
            >
              Mã GV {renderSortIndicator('teacherCode')}
            </th>
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('fullName')}
              title="Sắp xếp theo Họ và tên"
            >
              Họ và tên {renderSortIndicator('fullName')}
            </th>
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('email')}
              title="Sắp xếp theo Email"
            >
              Email {renderSortIndicator('email')}
            </th>
            <th style={headerCellStyle}>Số điện thoại</th>
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('specialization')}
              title="Sắp xếp theo Chuyên môn"
            >
              Chuyên môn {renderSortIndicator('specialization')}
            </th>
            <th style={headerCellStyle}>Bằng cấp</th>
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer', textAlign: 'right' }}
              onClick={() => !disabled && onSortChange('experienceYears')}
              title="Sắp xếp theo Kinh nghiệm"
            >
              Kinh nghiệm {renderSortIndicator('experienceYears')}
            </th>
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('hireDate')}
              title="Sắp xếp theo Ngày vào làm"
            >
              Ngày vào làm {renderSortIndicator('hireDate')}
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
          {teachers.map((teacher) => (
            <tr key={teacher.id} style={bodyRowStyle}>
              <td style={bodyCellStyle}>
                <Link
                  to={`${basePath}/${teacher.id}`}
                  style={codeLinkStyle}
                  className="font-mono"
                  title="Xem chi tiết giáo viên"
                >
                  {teacher.teacherCode}
                </Link>
              </td>
              <td style={{ ...bodyCellStyle, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {teacher.fullName}
              </td>
              <td style={{ ...bodyCellStyle, color: 'var(--color-text-secondary)' }}>
                {teacher.email}
              </td>
              <td style={{ ...bodyCellStyle, color: 'var(--color-text-secondary)' }}>
                {teacher.phone || '—'}
              </td>
              <td style={{ ...bodyCellStyle, color: 'var(--color-text-secondary)' }}>
                {teacher.specialization ? (
                  <span style={specBadgeStyle}>{teacher.specialization}</span>
                ) : (
                  '—'
                )}
              </td>
              <td style={{ ...bodyCellStyle, color: 'var(--color-text-secondary)' }}>
                {teacher.qualification || '—'}
              </td>
              <td style={{ ...bodyCellStyle, textAlign: 'right' }} className="tabular-nums">
                {teacher.experienceYears !== undefined && teacher.experienceYears !== null
                  ? `${teacher.experienceYears} năm`
                  : '—'}
              </td>
              <td style={{ ...bodyCellStyle, color: 'var(--color-text-secondary)' }}>
                {formatDateOnly(teacher.hireDate)}
              </td>
              <td style={bodyCellStyle}>
                <TeacherStatusBadge status={teacher.status} />
              </td>
              <td style={{ ...bodyCellStyle, textAlign: 'center' }}>
                <div style={actionsContainerStyle}>
                  <Link
                    to={`${basePath}/${teacher.id}`}
                    style={viewBtnStyle}
                    title="Xem chi tiết"
                  >
                    Xem
                  </Link>
                  <Link
                    to={`${basePath}/${teacher.id}/edit`}
                    style={editBtnStyle}
                    title="Chỉnh sửa thông tin"
                  >
                    Sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => onQuickStatusChange(teacher)}
                    disabled={disabled}
                    style={statusBtnStyle}
                    title="Cập nhật trạng thái giáo viên"
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
  width: '100%',
  overflowX: 'auto',
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-xs)',
  border: '1px solid var(--color-border)'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '0.875rem'
};

const headerRowStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface-subtle)',
  borderBottom: '1px solid var(--color-border)'
};

const headerCellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontWeight: 600,
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  userSelect: 'none',
  whiteSpace: 'nowrap'
};

const bodyRowStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border-subtle)',
  transition: 'background-color 0.15s ease'
};

const bodyCellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap'
};

const codeLinkStyle: React.CSSProperties = {
  color: 'var(--color-primary)',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.8125rem',
  backgroundColor: 'var(--color-primary-subtle)',
  padding: '0.2rem 0.45rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-primary-border)'
};

const specBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '0.15rem 0.45rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--color-surface-subtle)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)'
};

const actionsContainerStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem'
};

const viewBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.55rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-primary)',
  backgroundColor: 'var(--color-primary-subtle)',
  border: '1px solid var(--color-primary-border)',
  borderRadius: 'var(--radius-sm)',
  textDecoration: 'none'
};

const editBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.55rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  backgroundColor: 'var(--color-surface-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  textDecoration: 'none'
};

const statusBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.55rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--status-warning-text)',
  backgroundColor: 'var(--status-warning-bg)',
  border: '1px solid var(--status-warning-border)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer'
};
