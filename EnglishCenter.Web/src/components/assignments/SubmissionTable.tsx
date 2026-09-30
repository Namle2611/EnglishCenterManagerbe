import React from 'react';
import { Link } from 'react-router-dom';
import type { SubmissionListItem } from '../../types/assignment.types';
import { formatDateTime } from '../../utils/assignmentHelper';
import { AttachmentLink } from './AttachmentLink';

interface SubmissionTableProps {
  submissions: SubmissionListItem[];
  isLoading: boolean;
  roleBaseUrl: string;
  maxScore: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (column: string) => void;
}

export const SubmissionTable: React.FC<SubmissionTableProps> = ({
  submissions,
  isLoading,
  roleBaseUrl,
  maxScore,
  sortBy,
  sortDirection,
  onSortChange
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
        Đang tải danh sách bài nộp...
      </div>
    );
  }

  if (submissions.length === 0) {
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
        Chưa có bài nộp nào phù hợp.
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
              onClick={() => onSortChange('studentcode')}
              style={{ padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Học viên {renderSortIndicator('studentcode')}
            </th>
            <th
              onClick={() => onSortChange('submittedat')}
              style={{ padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Thời gian nộp {renderSortIndicator('submittedat')}
            </th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Nội dung / Đính kèm
            </th>
            <th
              onClick={() => onSortChange('score')}
              style={{ padding: '0.75rem 1rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Điểm số {renderSortIndicator('score')}
            </th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Trạng thái chấm
            </th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub) => {
            const detailUrl = `${roleBaseUrl}/submissions/${sub.id}`;

            return (
              <tr
                key={sub.id}
                style={{
                  borderBottom: '1px solid var(--color-border, #e5e7eb)',
                  transition: 'background-color 0.15s'
                }}
              >
                {/* Student */}
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
                    {sub.studentName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)', fontFamily: 'monospace' }}>
                    {sub.studentCode}
                  </div>
                </td>

                {/* Submitted At */}
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>
                    {formatDateTime(sub.submittedAt)}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '0.2rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      backgroundColor: sub.isLate ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: sub.isLate ? '#dc2626' : '#059669',
                      border: `1px solid ${sub.isLate ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                    }}
                  >
                    {sub.isLate ? 'Nộp muộn' : 'Đúng hạn'}
                  </span>
                </td>

                {/* Content / Attachment */}
                <td style={{ padding: '0.85rem 1rem', maxWidth: '16rem' }}>
                  {sub.fileUrl && (
                    <div style={{ marginBottom: sub.content ? '0.35rem' : 0 }}>
                      <AttachmentLink url={sub.fileUrl} label="Tệp bài nộp" />
                    </div>
                  )}
                  {sub.content && (
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-secondary, #4b5563)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        whiteSpace: 'pre-wrap'
                      }}
                      title={sub.content}
                    >
                      {sub.content}
                    </div>
                  )}
                </td>

                {/* Score */}
                <td style={{ padding: '0.85rem 1rem' }}>
                  {sub.score !== null ? (
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary, #2563eb)' }}>
                      {sub.score}{' '}
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-secondary, #6b7280)' }}>
                        / {maxScore}
                      </span>
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-secondary, #9ca3af)', fontStyle: 'italic' }}>—</span>
                  )}
                </td>

                {/* Graded Status */}
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: sub.isGraded ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: sub.isGraded ? '#059669' : '#d97706',
                      border: `1px solid ${sub.isGraded ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                    }}
                  >
                    {sub.isGraded ? 'Đã chấm điểm' : 'Chưa chấm điểm'}
                  </span>
                </td>

                {/* Actions */}
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Link
                    to={detailUrl}
                    className="btn-view-submission"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      backgroundColor: 'var(--color-surface-subtle, #f3f4f6)',
                      color: 'var(--color-text-primary, #374151)',
                      border: '1px solid var(--color-border, #d1d5db)',
                      borderRadius: 'var(--radius-md, 6px)',
                      textDecoration: 'none'
                    }}
                  >
                    Xem chi tiết
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
