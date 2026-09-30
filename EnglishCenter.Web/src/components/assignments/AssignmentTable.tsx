import React from 'react';
import { Link } from 'react-router-dom';
import type { AssignmentListItem } from '../../types/assignment.types';
import {
  TEACHER_SNAPSHOT_COMPACT_LABEL,
  TEACHER_SNAPSHOT_TOOLTIP
} from '../../utils/assignmentHelper';
import { AssignmentStatusBadge } from './AssignmentStatusBadge';
import { DeadlineBadge } from './DeadlineBadge';

interface AssignmentTableProps {
  assignments: AssignmentListItem[];
  isLoading: boolean;
  roleBaseUrl: string; // e.g. '/admin' or '/staff' or '/teacher'
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onEdit?: (assignment: AssignmentListItem) => void;
  onDelete?: (assignment: AssignmentListItem) => void;
  isClassReadOnly?: boolean;
}

export const AssignmentTable: React.FC<AssignmentTableProps> = ({
  assignments,
  isLoading,
  roleBaseUrl,
  sortBy,
  sortDirection,
  onSortChange,
  onEdit,
  onDelete,
  isClassReadOnly = false
}) => {
  const renderSortIndicator = (column: string) => {
    if (sortBy?.toLowerCase() !== column.toLowerCase()) {
      return <span style={{ opacity: 0.3, marginLeft: '0.25rem' }}>⇅</span>;
    }
    return <span style={{ marginLeft: '0.25rem' }}>{sortDirection === 'asc' ? '▲' : '▼'}</span>;
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border, #e5e7eb)',
          color: 'var(--color-text-secondary, #6b7280)'
        }}
      >
        Đang tải danh sách bài tập...
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div
        style={{
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border, #e5e7eb)',
          color: 'var(--color-text-secondary, #6b7280)'
        }}
      >
        Không tìm thấy bài tập nào phù hợp.
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: 'auto',
        backgroundColor: 'var(--color-surface, #ffffff)',
        borderRadius: 'var(--radius-lg, 8px)',
        border: '1px solid var(--color-border, #e5e7eb)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-surface-subtle, #f9fafb)', borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
            <th
              onClick={() => onSortChange('title')}
              style={{ padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Tiêu đề {renderSortIndicator('title')}
            </th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Lớp học
            </th>
            <th
              style={{ padding: '0.75rem 1rem', fontWeight: 600, whiteSpace: 'nowrap' }}
              title={TEACHER_SNAPSHOT_TOOLTIP}
            >
              <span style={{ borderBottom: '1px dotted var(--color-text-secondary, #6b7280)', cursor: 'help' }}>
                {TEACHER_SNAPSHOT_COMPACT_LABEL}
              </span>
            </th>
            <th
              onClick={() => onSortChange('deadline')}
              style={{ padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Hạn nộp {renderSortIndicator('deadline')}
            </th>
            <th
              onClick={() => onSortChange('maxscore')}
              style={{ padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Điểm tối đa {renderSortIndicator('maxscore')}
            </th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Bài nộp
            </th>
            <th
              onClick={() => onSortChange('status')}
              style={{ padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Trạng thái {renderSortIndicator('status')}
            </th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => {
            const detailUrl = `${roleBaseUrl}/assignments/${assignment.id}`;
            const submissionsUrl = `${roleBaseUrl}/assignments/${assignment.id}/submissions`;

            return (
              <tr
                key={assignment.id}
                style={{
                  borderBottom: '1px solid var(--color-border, #e5e7eb)',
                  transition: 'background-color 0.15s'
                }}
              >
                {/* Title */}
                <td style={{ padding: '0.85rem 1rem', maxWidth: '16rem' }}>
                  <Link
                    to={detailUrl}
                    style={{
                      fontWeight: 600,
                      color: 'var(--color-primary, #2563eb)',
                      textDecoration: 'none',
                      wordBreak: 'break-word'
                    }}
                  >
                    {assignment.title}
                  </Link>
                </td>

                {/* Class */}
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
                    {assignment.classCode}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)' }}>
                    {assignment.courseName}
                  </div>
                </td>

                {/* Teacher Snapshot */}
                <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary, #4b5563)' }}>
                  {assignment.teacherName}
                </td>

                {/* Deadline */}
                <td style={{ padding: '0.85rem 1rem' }}>
                  <DeadlineBadge deadline={assignment.deadline} />
                </td>

                {/* Max Score */}
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
                  {assignment.maxScore}
                </td>

                {/* Submission Count */}
                <td style={{ padding: '0.85rem 1rem' }}>
                  <Link
                    to={submissionsUrl}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 500,
                      color: assignment.submissionCount > 0 ? 'var(--color-primary, #2563eb)' : 'var(--color-text-secondary, #6b7280)',
                      textDecoration: 'none'
                    }}
                  >
                    <span>{assignment.submissionCount}</span>
                    <span style={{ fontSize: '0.75rem' }}>bài</span>
                    <span style={{ fontSize: '0.75rem' }}>↗</span>
                  </Link>
                </td>

                {/* Status */}
                <td style={{ padding: '0.85rem 1rem' }}>
                  <AssignmentStatusBadge status={assignment.status} />
                </td>

                {/* Actions */}
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Link
                      to={detailUrl}
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        backgroundColor: 'var(--color-surface-subtle, #f3f4f6)',
                        color: 'var(--color-text-primary, #374151)',
                        border: '1px solid var(--color-border, #d1d5db)',
                        borderRadius: 'var(--radius-md, 6px)',
                        textDecoration: 'none'
                      }}
                    >
                      Chi tiết
                    </Link>

                    {onEdit && !isClassReadOnly && (
                      <button
                        type="button"
                        className="btn-edit-assignment"
                        title="Sửa"
                        onClick={() => onEdit(assignment)}
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          backgroundColor: 'rgba(59, 130, 246, 0.08)',
                          color: '#2563eb',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          borderRadius: 'var(--radius-md, 6px)',
                          cursor: 'pointer'
                        }}
                      >
                        Sửa
                      </button>
                    )}

                    {onDelete && !isClassReadOnly && assignment.submissionCount === 0 && (
                      <button
                        type="button"
                        className="btn-delete-assignment"
                        title="Xóa"
                        onClick={() => onDelete(assignment)}
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          color: '#dc2626',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: 'var(--radius-md, 6px)',
                          cursor: 'pointer'
                        }}
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
