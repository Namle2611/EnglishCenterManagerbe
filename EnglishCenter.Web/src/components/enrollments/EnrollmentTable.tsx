import React from 'react';
import { Link } from 'react-router-dom';
import type { EnrollmentListItem } from '../../types/enrollment.types';
import {
  formatAuditDateTime,
  formatCalendarDate,
  formatVndCurrency
} from '../../utils/enrollmentHelper';
import { EnrollmentStatusBadge } from './EnrollmentStatusBadge';

interface EnrollmentTableProps {
  enrollments: EnrollmentListItem[];
  basePath: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onOpenStatusModal: (enrollment: EnrollmentListItem) => void;
  onDeleteClick: (enrollment: EnrollmentListItem) => void;
  disabled?: boolean;
}

export const EnrollmentTable: React.FC<EnrollmentTableProps> = ({
  enrollments,
  basePath,
  sortBy,
  sortDirection,
  onSortChange,
  onOpenStatusModal,
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
              style={{ ...headerCellStyle, width: '70px', cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('id')}
              title="Sắp xếp theo ID"
            >
              # {renderSortIndicator('id')}
            </th>

            {/* Học viên */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('studentname')}
              title="Sắp xếp theo Tên học viên"
            >
              Học viên {renderSortIndicator('studentname')}
            </th>

            {/* Khóa học */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('coursename')}
              title="Sắp xếp theo Khóa học"
            >
              Khóa học {renderSortIndicator('coursename')}
            </th>

            {/* Lớp học */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('classcode')}
              title="Sắp xếp theo Lớp học"
            >
              Lớp học {renderSortIndicator('classcode')}
            </th>

            {/* Học phí */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer', textAlign: 'right' }}
              onClick={() => !disabled && onSortChange('tuitionamount')}
              title="Sắp xếp theo Học phí"
            >
              Học phí {renderSortIndicator('tuitionamount')}
            </th>

            {/* Ngày ghi danh */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('enrollmentdate')}
              title="Sắp xếp theo Ngày ghi danh"
            >
              Ngày ghi danh {renderSortIndicator('enrollmentdate')}
            </th>

            {/* Trạng thái */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer', width: '130px' }}
              onClick={() => !disabled && onSortChange('status')}
              title="Sắp xếp theo Trạng thái"
            >
              Trạng thái {renderSortIndicator('status')}
            </th>

            {/* Người xác nhận */}
            <th style={{ ...headerCellStyle }}>Người xác nhận</th>

            {/* Thao tác */}
            <th style={{ ...headerCellStyle, textAlign: 'right', minWidth: '160px' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((item, index) => {
            const isEven = index % 2 === 0;
            const canEditTuition = item.status === 'Pending' || item.status === 'Confirmed';
            const canDelete = item.status === 'Pending';
            const canTransition = item.status !== 'Cancelled';

            return (
              <tr
                key={item.id}
                style={{
                  backgroundColor: isEven ? 'var(--color-surface)' : 'var(--color-surface-hover)',
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {/* ID */}
                <td style={{ ...bodyCellStyle, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                  #{item.id}
                </td>

                {/* Học viên */}
                <td style={bodyCellStyle}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {item.studentName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {item.studentCode}
                  </div>
                </td>

                {/* Khóa học */}
                <td style={bodyCellStyle}>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {item.courseName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {item.courseCode}
                  </div>
                </td>

                {/* Lớp học */}
                <td style={bodyCellStyle}>
                  {item.classCode ? (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.125rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-surface-subtle)',
                        border: '1px solid var(--color-border)',
                        fontWeight: 600,
                        fontSize: '0.8125rem'
                      }}
                    >
                      {item.classCode}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Chưa xếp lớp</span>
                  )}
                </td>

                {/* Học phí */}
                <td style={{ ...bodyCellStyle, textAlign: 'right', fontWeight: 600 }}>
                  {formatVndCurrency(item.tuitionAmount)}
                </td>

                {/* Ngày ghi danh */}
                <td style={bodyCellStyle}>
                  {formatCalendarDate(item.enrollmentDate)}
                </td>

                {/* Trạng thái */}
                <td style={bodyCellStyle}>
                  <EnrollmentStatusBadge status={item.status} />
                </td>

                {/* Người xác nhận */}
                <td style={bodyCellStyle}>
                  {item.confirmedByName ? (
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.confirmedByName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {formatAuditDateTime(item.confirmedAt)}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                  )}
                </td>

                {/* Thao tác */}
                <td style={{ ...bodyCellStyle, textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      justifyContent: 'flex-end'
                    }}
                  >
                    {/* Detail link */}
                    <Link
                      to={`${basePath}/${item.id}`}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-primary-border)',
                        backgroundColor: 'var(--color-primary-subtle)'
                      }}
                      title="Xem chi tiết ghi danh"
                    >
                      Chi tiết
                    </Link>

                    {/* Edit tuition link */}
                    {canEditTuition && (
                      <Link
                        to={`${basePath}/${item.id}/edit`}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--color-text-secondary)',
                          textDecoration: 'none',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)'
                        }}
                        title="Chỉnh sửa học phí"
                      >
                        Sửa học phí
                      </Link>
                    )}

                    {/* Lifecycle action trigger */}
                    {canTransition && (
                      <button
                        type="button"
                        onClick={() => onOpenStatusModal(item)}
                        disabled={disabled}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--role-staff-text)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--role-staff-border)',
                          backgroundColor: 'var(--role-staff-bg)',
                          cursor: disabled ? 'not-allowed' : 'pointer'
                        }}
                        title="Thực hiện chuyển đổi trạng thái"
                      >
                        Chuyển trạng thái
                      </button>
                    )}

                    {/* Hard Delete button */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteClick(item)}
                        disabled={disabled}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--status-danger-text)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--status-danger-border)',
                          backgroundColor: 'var(--status-danger-bg)',
                          cursor: disabled ? 'not-allowed' : 'pointer'
                        }}
                        title="Xóa vĩnh viễn ghi danh Chờ xác nhận"
                      >
                        Xóa
                      </button>
                    )}
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
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
  userSelect: 'none'
};

const bodyCellStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  verticalAlign: 'middle'
};
