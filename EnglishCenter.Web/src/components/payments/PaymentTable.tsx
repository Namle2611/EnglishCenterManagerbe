import React from 'react';
import { Link } from 'react-router-dom';
import type { PaymentListItem } from '../../types/payment.types';
import {
  formatAuditDateTime,
  formatVndCurrency,
  PAYMENT_METHOD_LABELS
} from '../../utils/paymentHelper';
import { PaymentStatusBadge } from './PaymentStatusBadge';

interface PaymentTableProps {
  payments: PaymentListItem[];
  basePath: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onOpenStatusModal: (payment: PaymentListItem) => void;
  onDeleteClick: (payment: PaymentListItem) => void;
  disabled?: boolean;
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
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
            <th style={{ ...headerCellStyle }}>Lớp học</th>

            {/* Số tiền */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer', textAlign: 'right' }}
              onClick={() => !disabled && onSortChange('amount')}
              title="Sắp xếp theo Số tiền"
            >
              Số tiền {renderSortIndicator('amount')}
            </th>

            {/* Ngày thanh toán */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('paymentdate')}
              title="Sắp xếp theo Ngày thanh toán"
            >
              Ngày thanh toán {renderSortIndicator('paymentdate')}
            </th>

            {/* Phương thức */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('paymentmethod')}
              title="Sắp xếp theo Phương thức"
            >
              Phương thức {renderSortIndicator('paymentmethod')}
            </th>

            {/* Mã giao dịch */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => !disabled && onSortChange('transactioncode')}
              title="Sắp xếp theo Mã giao dịch"
            >
              Mã giao dịch {renderSortIndicator('transactioncode')}
            </th>

            {/* Trạng thái */}
            <th
              style={{ ...headerCellStyle, cursor: disabled ? 'default' : 'pointer', width: '120px' }}
              onClick={() => !disabled && onSortChange('status')}
              title="Sắp xếp theo Trạng thái"
            >
              Trạng thái {renderSortIndicator('status')}
            </th>

            {/* Thao tác */}
            <th style={{ ...headerCellStyle, textAlign: 'right', minWidth: '180px' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((item, index) => {
            const isEven = index % 2 === 0;
            const isPending = item.status === 'Pending';

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
                <td style={{ ...cellStyle, width: '70px' }}>
                  <span className="font-mono" style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    #{item.id}
                  </span>
                </td>

                {/* Học viên */}
                <td style={cellStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {item.studentName}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {item.studentCode}
                    </span>
                  </div>
                </td>

                {/* Khóa học */}
                <td style={cellStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {item.courseName}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {item.courseCode}
                    </span>
                  </div>
                </td>

                {/* Lớp học */}
                <td style={cellStyle}>
                  {item.classCode ? (
                    <span className="font-mono" style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                      {item.classCode}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                  )}
                </td>

                {/* Số tiền */}
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {formatVndCurrency(item.amount)}
                  </span>
                </td>

                {/* Ngày thanh toán */}
                <td style={cellStyle}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {formatAuditDateTime(item.paymentDate)}
                  </span>
                </td>

                {/* Phương thức */}
                <td style={cellStyle}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  >
                    {PAYMENT_METHOD_LABELS[item.paymentMethod] || item.paymentMethod}
                  </span>
                </td>

                {/* Mã giao dịch */}
                <td style={cellStyle}>
                  {item.transactionCode ? (
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {item.transactionCode}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                  )}
                </td>

                {/* Trạng thái */}
                <td style={cellStyle}>
                  <PaymentStatusBadge status={item.status} />
                </td>

                {/* Thao tác */}
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    {/* View Detail Link */}
                    <Link
                      to={`${basePath}/${item.id}`}
                      title="Xem chi tiết thanh toán"
                      style={actionBtnStyle}
                    >
                      👁️ Xem
                    </Link>

                    {/* Edit Link */}
                    <Link
                      to={`${basePath}/${item.id}/edit`}
                      title={isPending ? 'Chỉnh sửa thông tin thanh toán' : 'Chỉnh sửa ghi chú giao dịch'}
                      style={actionBtnStyle}
                    >
                      ✏️ Sửa
                    </Link>

                    {/* Status Mutation Modal (Pending Only) */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => onOpenStatusModal(item)}
                        title="Cập nhật trạng thái giao dịch"
                        style={{
                          ...actionBtnStyle,
                          backgroundColor: 'var(--color-primary-subtle)',
                          borderColor: 'var(--color-primary-border)',
                          color: 'var(--color-primary)'
                        }}
                      >
                        ⚡ Trạng thái
                      </button>
                    )}

                    {/* Hard Delete (Pending Only) */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => onDeleteClick(item)}
                        title="Xóa vĩnh viễn giao dịch chờ"
                        style={{
                          ...actionBtnStyle,
                          backgroundColor: 'var(--status-danger-bg)',
                          borderColor: 'var(--status-danger-border)',
                          color: 'var(--status-danger-text)'
                        }}
                      >
                        🗑️ Xóa
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
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
  userSelect: 'none'
};

const cellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  verticalAlign: 'middle'
};

const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-secondary)',
  textDecoration: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};
