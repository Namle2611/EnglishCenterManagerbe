import React from 'react';
import type { GradeStudentRosterItemResponse } from '../../types/grade.types';
import type { PagedResult } from '../../types/common.types';
import { formatPercentage, getMembershipStatusLabel } from '../../utils/gradeHelper';

interface GradeRosterTableProps {
  roster: PagedResult<GradeStudentRosterItemResponse>;
  onSelectStudent: (studentId: number) => void;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export const GradeRosterTable: React.FC<GradeRosterTableProps> = ({
  roster,
  onSelectStudent,
  onPageChange,
  isLoading = false
}) => {
  const items = roster.items || [];
  const { page, totalPages, totalItems } = roster;
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <div
      className="grade-roster-container"
      style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 12px)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))'
      }}
    >
      {/* Scrollable table container */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table
          className="grade-roster-table"
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
                borderBottom: '1px solid var(--color-border, #e2e8f0)',
                color: 'var(--color-text-secondary, #475569)',
                fontSize: '0.8125rem',
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}
            >
              <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Mã học viên</th>
              <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Tên học viên</th>
              <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Trạng thái</th>
              <th style={{ padding: '0.875rem 1rem', fontWeight: 600, textAlign: 'center' }}>Đã có điểm</th>
              <th style={{ padding: '0.875rem 1rem', fontWeight: 600, textAlign: 'center' }}>Chờ xử lý</th>
              <th style={{ padding: '0.875rem 1rem', fontWeight: 600, textAlign: 'right' }}>Điểm đạt / Tối đa</th>
              <th style={{ padding: '0.875rem 1rem', fontWeight: 600, textAlign: 'right' }}>Tỷ lệ điểm hiện có</th>
              <th style={{ padding: '0.875rem 1rem', fontWeight: 600, textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary, #64748b)' }}>
                  Đang tải danh sách học viên...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary, #64748b)' }}>
                  Không tìm thấy học viên nào phù hợp.
                </td>
              </tr>
            ) : (
              items.map((student) => {
                const membershipLabel = getMembershipStatusLabel(student.membershipStatus);
                return (
                  <tr
                    key={student.studentId}
                    data-testid={`roster-row-${student.studentId}`}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle, #f1f5f9)',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, #f8fafc)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--color-primary, #2563eb)',
                          fontSize: '0.9rem'
                        }}
                      >
                        {student.studentCode}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
                      {student.studentName}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.625rem',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          backgroundColor:
                            student.membershipStatus === 'Active'
                              ? '#ecfdf5'
                              : student.membershipStatus === 'Completed'
                              ? '#eff6ff'
                              : '#fef2f2',
                          color:
                            student.membershipStatus === 'Active'
                              ? '#065f46'
                              : student.membershipStatus === 'Completed'
                              ? '#1e40af'
                              : '#991b1b',
                          border: `1px solid ${
                            student.membershipStatus === 'Active'
                              ? '#a7f3d0'
                              : student.membershipStatus === 'Completed'
                              ? '#bfdbfe'
                              : '#fecaca'
                          }`
                        }}
                      >
                        {membershipLabel}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
                        {student.summary.visibleGradedItemCount}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      {student.summary.pendingItemCount > 0 ? (
                        <span style={{ color: '#d97706', fontWeight: 600 }}>
                          {student.summary.pendingItemCount}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                        {student.summary.visibleEarnedPoints}
                      </strong>{' '}
                      / {student.summary.visiblePossiblePoints}
                    </td>
                    <td
                      style={{
                        padding: '0.875rem 1rem',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: 'var(--color-primary, #2563eb)',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {formatPercentage(student.summary.visiblePercentage)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        id={`btn-view-student-${student.studentId}`}
                        data-testid={`btn-view-grade-detail-${student.studentId}`}
                        onClick={() => onSelectStudent(student.studentId)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.875rem',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: 'var(--color-primary, #2563eb)',
                          backgroundColor: 'var(--color-primary-subtle, #eff6ff)',
                          border: '1px solid var(--color-primary-border, #bfdbfe)',
                          borderRadius: 'var(--radius-md, 6px)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-primary, #2563eb)';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-primary-subtle, #eff6ff)';
                          e.currentTarget.style.color = 'var(--color-primary, #2563eb)';
                        }}
                      >
                        Xem chi tiết →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          className="grade-roster-pagination"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid var(--color-border, #e2e8f0)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary, #475569)',
            backgroundColor: 'var(--color-surface-hover, #f8fafc)'
          }}
        >
          <div>
            Hiển thị trang <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{page}</strong> /{' '}
            <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{totalPages}</strong> ({totalItems} học viên)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              id="roster-prev-page-btn"
              disabled={!hasPreviousPage || isLoading}
              onClick={() => onPageChange(page - 1)}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid var(--color-border, #cbd5e1)',
                backgroundColor: 'var(--color-surface, #ffffff)',
                color: 'var(--color-text-secondary, #475569)',
                cursor: !hasPreviousPage || isLoading ? 'not-allowed' : 'pointer',
                opacity: !hasPreviousPage || isLoading ? 0.5 : 1,
                transition: 'background-color 0.15s ease'
              }}
            >
              ← Trang trước
            </button>
            <button
              type="button"
              id="roster-next-page-btn"
              disabled={!hasNextPage || isLoading}
              onClick={() => onPageChange(page + 1)}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid var(--color-border, #cbd5e1)',
                backgroundColor: 'var(--color-surface, #ffffff)',
                color: 'var(--color-text-secondary, #475569)',
                cursor: !hasNextPage || isLoading ? 'not-allowed' : 'pointer',
                opacity: !hasNextPage || isLoading ? 0.5 : 1,
                transition: 'background-color 0.15s ease'
              }}
            >
              Trang sau →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
