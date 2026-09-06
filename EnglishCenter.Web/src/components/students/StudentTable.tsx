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
              <td style={{ ...bodyCellStyle, fontWeight: 600, color: '#0f172a' }}>
                <Link
                  to={`${basePath}/${student.id}`}
                  style={linkStyle}
                  title="Xem chi tiết học viên"
                >
                  {student.studentCode}
                </Link>
              </td>
              <td style={{ ...bodyCellStyle, fontWeight: 500 }}>{student.fullName}</td>
              <td style={{ ...bodyCellStyle, color: '#475569' }}>{student.email}</td>
              <td style={{ ...bodyCellStyle, color: '#475569' }}>{student.phone || '-'}</td>
              <td style={{ ...bodyCellStyle, color: '#475569' }}>{student.currentLevel || '-'}</td>
              <td style={{ ...bodyCellStyle, color: '#475569' }}>
                {formatDateOnly(student.enrollmentDate)}
              </td>
              <td style={bodyCellStyle}>
                <StudentStatusBadge status={student.status} />
              </td>
              <td style={{ ...bodyCellStyle, textAlign: 'center' }}>
                <div style={actionsContainerStyle}>
                  <Link
                    to={`${basePath}/${student.id}`}
                    style={actionButtonStyle}
                    title="Xem chi tiết"
                  >
                    Xem
                  </Link>
                  <Link
                    to={`${basePath}/${student.id}/edit`}
                    style={{ ...actionButtonStyle, color: '#0284c7' }}
                    title="Chỉnh sửa thông tin"
                  >
                    Sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => onQuickStatusChange(student)}
                    disabled={disabled}
                    style={statusActionButtonStyle}
                    title="Cập nhật trạng thái học viên"
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
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  border: '1px solid #e2e8f0'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '0.875rem'
};

const headerRowStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0'
};

const headerCellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontWeight: 600,
  color: '#334155',
  userSelect: 'none',
  whiteSpace: 'nowrap'
};

const bodyRowStyle: React.CSSProperties = {
  borderBottom: '1px solid #f1f5f9',
  transition: 'background-color 0.15s'
};

const bodyCellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap'
};

const linkStyle: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none',
  fontFamily: 'monospace, monospace',
  fontSize: '0.9rem'
};

const actionsContainerStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem'
};

const actionButtonStyle: React.CSSProperties = {
  padding: '0.3rem 0.6rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#2563eb',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '4px',
  textDecoration: 'none',
  cursor: 'pointer'
};

const statusActionButtonStyle: React.CSSProperties = {
  padding: '0.3rem 0.6rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#d97706',
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '4px',
  cursor: 'pointer'
};
