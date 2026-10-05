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
        border: '1px solid var(--color-border, #e5e7eb)',
        borderRadius: 'var(--radius-md, 8px)',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
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
                backgroundColor: 'var(--color-surface-subtle, #f9fafb)',
                borderBottom: '1px solid var(--color-border, #e5e7eb)',
                color: 'var(--color-text-secondary, #4b5563)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <th style={{ padding: '0.75rem 1rem' }}>Mã học viên</th>
              <th style={{ padding: '0.75rem 1rem' }}>Tên học viên</th>
              <th style={{ padding: '0.75rem 1rem' }}>Trạng thái</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Đã có điểm</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Chờ xử lý</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Điểm đạt / Tối đa</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Tỷ lệ điểm hiện có</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  Đang tải danh sách học viên...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
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
                      borderBottom: '1px solid var(--color-border, #f3f4f6)',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                      {student.studentCode}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {student.studentName}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          fontWeight: 500,
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
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {student.summary.visibleGradedItemCount}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {student.summary.pendingItemCount > 0 ? (
                        <span style={{ color: '#d97706', fontWeight: 600 }}>
                          {student.summary.pendingItemCount}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <strong>{student.summary.visibleEarnedPoints}</strong> / {student.summary.visiblePossiblePoints}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: '#1d4ed8',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {formatPercentage(student.summary.visiblePercentage)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        id={`btn-view-student-${student.studentId}`}
                        onClick={() => onSelectStudent(student.studentId)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: '#2563eb',
                          backgroundColor: 'rgba(37, 99, 235, 0.08)',
                          border: '1px solid rgba(37, 99, 235, 0.2)',
                          borderRadius: 'var(--radius-sm, 4px)',
                          cursor: 'pointer',
                          minHeight: '36px'
                        }}
                      >
                        Xem chi tiết
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
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--color-border, #e5e7eb)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary, #6b7280)',
            backgroundColor: 'var(--color-surface-subtle, #f9fafb)'
          }}
        >
          <div>
            Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> ({totalItems} học viên)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              id="roster-prev-page-btn"
              disabled={!hasPreviousPage || isLoading}
              onClick={() => onPageChange(page - 1)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--color-border, #d1d5db)',
                backgroundColor: 'var(--color-surface, #ffffff)',
                cursor: !hasPreviousPage || isLoading ? 'not-allowed' : 'pointer',
                opacity: !hasPreviousPage || isLoading ? 0.5 : 1,
                minHeight: '36px'
              }}
            >
              ◀ Trang trước
            </button>
            <button
              type="button"
              id="roster-next-page-btn"
              disabled={!hasNextPage || isLoading}
              onClick={() => onPageChange(page + 1)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--color-border, #d1d5db)',
                backgroundColor: 'var(--color-surface, #ffffff)',
                cursor: !hasNextPage || isLoading ? 'not-allowed' : 'pointer',
                opacity: !hasNextPage || isLoading ? 0.5 : 1,
                minHeight: '36px'
              }}
            >
              Trang sau ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
