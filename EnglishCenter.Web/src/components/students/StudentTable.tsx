import React from 'react';
import { Link } from 'react-router-dom';
import type { StudentListItem } from '../../types/student.types';
import { formatDateOnly } from '../../utils/studentHelper';
import { StudentStatusBadge } from './StudentStatusBadge';

interface StudentTableProps {
  students: StudentListItem[];
  basePath: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onQuickStatusChange: (student: StudentListItem) => void;
  disabled?: boolean;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
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
              onClick={() => !disabled && onSortChange('studentCode')}
              title="Sắp xếp theo Mã học viên"
            >
              Mã HV {renderSortIndicator('studentCode')}
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
            <th style={headerCellStyle}>Trình độ</th>
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('enrollmentDate')}
              title="Sắp xếp theo Ngày nhập học"
            >
              Ngày nhập học {renderSortIndicator('enrollmentDate')}
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
          {students.map((student) => (
            <tr key={student.id} style={bodyRowStyle}>
              <td style={bodyCellStyle}>
                <Link
                  to={`${basePath}/${student.id}`}
                  style={codeLinkStyle}
                  className="font-mono"
                  title="Xem chi tiết học viên"
                >
                  {student.studentCode}
                </Link>
              </td>
              <td style={{ ...bodyCellStyle, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {student.fullName}
              </td>
              <td style={{ ...bodyCellStyle, color: 'var(--color-text-secondary)' }}>
                {student.email}
              </td>
              <td style={{ ...bodyCellStyle, color: 'var(--color-text-secondary)' }}>
                {student.phone || '—'}
              </td>
              <td style={{ ...bodyCellStyle, color: 'var(--color-text-secondary)' }}>
                {student.currentLevel ? (
                  <span style={levelBadgeStyle}>{student.currentLevel}</span>
                ) : (
                  '—'
                )}
              </td>
              <td style={{ ...bodyCellStyle, color: 'var(--color-text-secondary)' }}>
                {formatDateOnly(student.enrollmentDate)}
              </td>
              <td style={bodyCellStyle}>
                <StudentStatusBadge status={student.status} />
              </td>
              <td style={{ ...bodyCellStyle, textAlign: 'center' }}>
                <div style={actionsContainerStyle}>
                  <Link
                    to={`${basePath}/${student.id}`}
                    style={viewBtnStyle}
                    title="Xem hồ sơ chi tiết"
                  >
                    Xem
                  </Link>
                  <Link
                    to={`${basePath}/${student.id}/edit`}
                    style={editBtnStyle}
                    title="Chỉnh sửa thông tin"
                  >
                    Sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => onQuickStatusChange(student)}
                    disabled={disabled}
                    style={statusBtnStyle}
                    title="Đổi trạng thái học viên"
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

const levelBadgeStyle: React.CSSProperties = {
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
