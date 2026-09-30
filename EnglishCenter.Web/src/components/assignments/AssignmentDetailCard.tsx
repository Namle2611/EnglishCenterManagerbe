import React from 'react';
import { Link } from 'react-router-dom';
import type { AssignmentDetail } from '../../types/assignment.types';
import {
  CLASS_STATUS_LABELS,
  TEACHER_SNAPSHOT_DETAIL_LABEL,
  TEACHER_SNAPSHOT_TOOLTIP
} from '../../utils/assignmentHelper';
import { AssignmentStatusBadge } from './AssignmentStatusBadge';
import { AttachmentLink } from './AttachmentLink';
import { DeadlineBadge } from './DeadlineBadge';

interface AssignmentDetailCardProps {
  assignment: AssignmentDetail;
  roleBaseUrl: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isStudent?: boolean;
}

export const AssignmentDetailCard: React.FC<AssignmentDetailCardProps> = ({
  assignment,
  roleBaseUrl,
  onEdit,
  onDelete,
  isStudent = false
}) => {
  const isClassHistorical =
    assignment.classStatus === 'Completed' || assignment.classStatus === 'Cancelled';

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        borderRadius: 'var(--radius-xl, 12px)',
        border: '1px solid var(--color-border, #e5e7eb)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}
    >
      {/* Top Banner if historical class */}
      {isClassHistorical && (
        <div
          style={{
            padding: '0.65rem 1.25rem',
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            color: '#4b5563',
            fontSize: '0.85rem',
            fontWeight: 500,
            borderBottom: '1px solid var(--color-border, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>ℹ️</span>
          <span>
            Lớp học đang ở trạng thái <strong>{CLASS_STATUS_LABELS[assignment.classStatus]}</strong>. Bài tập ở chế độ lưu trữ chỉ đọc.
          </span>
        </div>
      )}

      {/* Main Header */}
      <div
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--color-border, #e5e7eb)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div style={{ flex: 1, minWidth: '18rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <AssignmentStatusBadge status={assignment.status} />
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                fontWeight: 600,
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                color: '#2563eb'
              }}
            >
              Lớp: {assignment.classCode}
            </span>
          </div>

          <h1
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text-primary, #111827)',
              wordBreak: 'break-word'
            }}
          >
            {assignment.title}
          </h1>

          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #6b7280)' }}>
            Khóa học: <strong>{assignment.courseName}</strong>
          </div>
        </div>

        {/* Action buttons (Management only) */}
        {!isStudent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Link
              to={`${roleBaseUrl}/assignments/${assignment.id}/submissions`}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: 'var(--color-primary, #2563eb)',
                color: '#ffffff',
                borderRadius: 'var(--radius-md, 6px)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>Xem bài nộp</span>
              <span
                style={{
                  padding: '0.1rem 0.4rem',
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: '9999px'
                }}
              >
                {assignment.submissionCount}
              </span>
            </Link>

            {onEdit && !isClassHistorical && (
              <button
                type="button"
                onClick={onEdit}
                style={{
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text-primary, #374151)',
                  border: '1px solid var(--color-border, #d1d5db)',
                  borderRadius: 'var(--radius-md, 6px)',
                  cursor: 'pointer'
                }}
              >
                Chỉnh sửa
              </button>
            )}

            {onDelete && !isClassHistorical && assignment.submissionCount === 0 && (
              <button
                type="button"
                onClick={onDelete}
                style={{
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.875rem',
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
        )}
      </div>

      {/* Meta Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--color-surface-subtle, #f9fafb)',
          borderBottom: '1px solid var(--color-border, #e5e7eb)'
        }}
      >
        <div>
          <div
            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.25rem' }}
            title={TEACHER_SNAPSHOT_TOOLTIP}
          >
            {TEACHER_SNAPSHOT_DETAIL_LABEL}
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
            {assignment.teacherName}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.25rem' }}>
            Hạn nộp bài
          </div>
          <DeadlineBadge deadline={assignment.deadline} />
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.25rem' }}>
            Điểm tối đa
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary, #2563eb)' }}>
            {assignment.maxScore} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-text-secondary, #6b7280)' }}>điểm</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.25rem' }}>
            Tài liệu đính kèm
          </div>
          <AttachmentLink url={assignment.attachmentUrl} />
        </div>
      </div>

      {/* Description Content */}
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
          Mô tả & Hướng dẫn làm bài
        </h3>
        {assignment.description ? (
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: 'var(--color-text-primary, #374151)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {assignment.description}
          </p>
        ) : (
          <span style={{ color: 'var(--color-text-secondary, #9ca3af)', fontStyle: 'italic', fontSize: '0.875rem' }}>
            Không có mô tả chi tiết.
          </span>
        )}
      </div>
    </div>
  );
};
