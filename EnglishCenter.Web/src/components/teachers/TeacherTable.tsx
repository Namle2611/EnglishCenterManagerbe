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
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
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
              <td style={{ ...bodyCellStyle, fontWeight: 600, color: '#0f172a' }}>
                <Link
                  to={`${basePath}/${teacher.id}`}
                  style={linkStyle}
                  title="Xem chi tiết giáo viên"
                >
                  {teacher.teacherCode}
                </Link>
              </td>
              <td style={{ ...bodyCellStyle, fontWeight: 500 }}>{teacher.fullName}</td>
              <td style={{ ...bodyCellStyle, color: '#475569' }}>{teacher.email}</td>
              <td style={{ ...bodyCellStyle, color: '#475569' }}>{teacher.phone || '-'}</td>
              <td style={{ ...bodyCellStyle, color: '#475569' }}>{teacher.specialization}</td>
              <td style={{ ...bodyCellStyle, color: '#475569' }}>{teacher.qualification || '-'}</td>
              <td style={{ ...bodyCellStyle, color: '#475569' }}>
                {teacher.experienceYears} năm
              </td>
              <td style={{ ...bodyCellStyle, color: '#475569' }}>
                {formatDateOnly(teacher.hireDate)}
              </td>
              <td style={bodyCellStyle}>
                <TeacherStatusBadge status={teacher.status} />
              </td>
              <td style={{ ...bodyCellStyle, textAlign: 'center' }}>
                <div style={actionsContainerStyle}>
                  <Link
                    to={`${basePath}/${teacher.id}`}
                    style={viewButtonStyle}
                    title="Xem chi tiết"
                  >
                    Xem
                  </Link>
                  <Link
                    to={`${basePath}/${teacher.id}/edit`}
                    style={editButtonStyle}
                    title="Chỉnh sửa thông tin"
                  >
                    Sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => onQuickStatusChange(teacher)}
                    disabled={disabled}
                    style={statusButtonStyle}
                    title="Đổi trạng thái"
                  >
                    Đổi TT
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
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '0.875rem'
};

const headerRowStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderBottom: '2px solid #e2e8f0'
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
  transition: 'background-color 0.15s ease'
};

const bodyCellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  color: '#1e293b',
  whiteSpace: 'nowrap'
};

const linkStyle: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none'
};

const actionsContainerStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  justifyContent: 'center'
};

const actionBtnBase: React.CSSProperties = {
  padding: '0.25rem 0.55rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: '4px',
  textDecoration: 'none',
  cursor: 'pointer',
  display: 'inline-block',
  border: 'none',
  transition: 'background-color 0.15s'
};

const viewButtonStyle: React.CSSProperties = {
  ...actionBtnBase,
  backgroundColor: '#eff6ff',
  color: '#1d4ed8'
};

const editButtonStyle: React.CSSProperties = {
  ...actionBtnBase,
  backgroundColor: '#f1f5f9',
  color: '#334155'
};

const statusButtonStyle: React.CSSProperties = {
  ...actionBtnBase,
  backgroundColor: '#fef3c7',
  color: '#92400e'
};
