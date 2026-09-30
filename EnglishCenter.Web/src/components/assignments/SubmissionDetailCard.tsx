import React from 'react';
import type { SubmissionDetail } from '../../types/assignment.types';
import { formatDateTime } from '../../utils/assignmentHelper';
import { AttachmentLink } from './AttachmentLink';
import { DeadlineBadge } from './DeadlineBadge';

interface SubmissionDetailCardProps {
  submission: SubmissionDetail;
  isStudent?: boolean;
}

export const SubmissionDetailCard: React.FC<SubmissionDetailCardProps> = ({
  submission,
  isStudent = false
}) => {
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
      {/* Top Assignment Header */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--color-surface-subtle, #f9fafb)',
          borderBottom: '1px solid var(--color-border, #e5e7eb)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.2rem' }}>
            Bài tập
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary, #111827)' }}>
            {submission.assignmentTitle}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)' }}>Hạn nộp</div>
            <DeadlineBadge deadline={submission.deadline} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)' }}>Điểm tối đa</div>
            <div style={{ fontWeight: 700, color: 'var(--color-primary, #2563eb)' }}>
              {submission.maxScore} điểm
            </div>
          </div>
        </div>
      </div>

      {/* Student & Submission Status Meta */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-border, #e5e7eb)'
        }}
      >
        {!isStudent && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.2rem' }}>
              Học viên
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
              {submission.studentName}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b7280)', fontFamily: 'monospace' }}>
              Mã: {submission.studentCode}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.2rem' }}>
            Thời gian nộp
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>
            {formatDateTime(submission.submittedAt)}
          </div>
          <span
            style={{
              display: 'inline-block',
              marginTop: '0.25rem',
              padding: '0.1rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 600,
              backgroundColor: submission.isLate ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: submission.isLate ? '#dc2626' : '#059669',
              border: `1px solid ${submission.isLate ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
            }}
          >
            {submission.isLate ? 'Nộp muộn' : 'Đúng hạn'}
          </span>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.2rem' }}>
            Trạng thái chấm điểm
          </div>
          <span
            style={{
              display: 'inline-block',
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: submission.isGraded ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              color: submission.isGraded ? '#059669' : '#d97706',
              border: `1px solid ${submission.isGraded ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
            }}
          >
            {submission.isGraded ? 'Đã chấm điểm' : 'Chưa chấm điểm'}
          </span>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.2rem' }}>
            Điểm số đạt được
          </div>
          {submission.score !== null ? (
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
              {submission.score}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--color-text-secondary, #6b7280)' }}>
                / {submission.maxScore}
              </span>
            </div>
          ) : (
            <span style={{ color: 'var(--color-text-secondary, #9ca3af)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              Chưa có điểm
            </span>
          )}
        </div>
      </div>

      {/* Grade Feedback Section */}
      {submission.isGraded && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            borderBottom: '1px solid var(--color-border, #e5e7eb)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>💬</span>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
              Nhận xét của giảng viên
            </h4>
          </div>
          {submission.feedback ? (
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                lineHeight: 1.5,
                color: 'var(--color-text-primary, #374151)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {submission.feedback}
            </p>
          ) : (
            <span style={{ color: 'var(--color-text-secondary, #9ca3af)', fontStyle: 'italic', fontSize: '0.85rem' }}>
              Không có nhận xét chi tiết.
            </span>
          )}
        </div>
      )}

      {/* Submission Attachment */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary, #4b5563)' }}>
          Tệp đính kèm bài làm
        </h4>
        <AttachmentLink url={submission.fileUrl} label="Tải / Mở tệp bài nộp" />
      </div>

      {/* Plain Multiline Text Content */}
      <div style={{ padding: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
          Nội dung bài làm
        </h4>
        {submission.content ? (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--color-surface-subtle, #f9fafb)',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--color-border, #e5e7eb)'
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: 'var(--color-text-primary, #1f2937)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {submission.content}
            </p>
          </div>
        ) : (
          <span style={{ color: 'var(--color-text-secondary, #9ca3af)', fontStyle: 'italic', fontSize: '0.875rem' }}>
            Không có nội dung văn bản.
          </span>
        )}
      </div>
    </div>
  );
};
