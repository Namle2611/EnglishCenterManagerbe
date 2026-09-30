import React from 'react';
import { Link } from 'react-router-dom';
import type { AssignmentListItem } from '../../types/assignment.types';
import {
  TEACHER_SNAPSHOT_COMPACT_LABEL,
  TEACHER_SNAPSHOT_TOOLTIP
} from '../../utils/assignmentHelper';
import { AssignmentStatusBadge } from './AssignmentStatusBadge';
import { DeadlineBadge } from './DeadlineBadge';

interface StudentAssignmentCardProps {
  assignment: AssignmentListItem;
}

export const StudentAssignmentCard: React.FC<StudentAssignmentCardProps> = ({ assignment }) => {
  const isCompletedMember = assignment.studentMembershipStatus === 'Completed';

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        borderRadius: 'var(--radius-xl, 12px)',
        border: '1px solid var(--color-border, #e5e7eb)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1rem',
        transition: 'border-color 0.2s, box-shadow 0.2s'
      }}
    >
      {/* Top row: Status & Class */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AssignmentStatusBadge status={assignment.status} />
            {isCompletedMember && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(107, 114, 128, 0.1)',
                  color: '#4b5563',
                  fontWeight: 600
                }}
              >
                Lớp đã hoàn thành
              </span>
            )}
          </div>

          <span
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: assignment.hasSubmitted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: assignment.hasSubmitted ? '#059669' : '#dc2626',
              border: `1px solid ${assignment.hasSubmitted ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
            }}
          >
            {assignment.hasSubmitted ? '✓ Đã nộp bài' : 'Chưa nộp bài'}
          </span>
        </div>

        {/* Title */}
        <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 600 }}>
          <Link
            to={`/student/assignments/${assignment.id}`}
            style={{
              color: 'var(--color-text-primary, #111827)',
              textDecoration: 'none',
              wordBreak: 'break-word'
            }}
          >
            {assignment.title}
          </Link>
        </h3>

        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.5rem' }}>
          Lớp: <strong>{assignment.classCode}</strong> • {assignment.courseName}
        </div>

        <div
          style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b7280)' }}
          title={TEACHER_SNAPSHOT_TOOLTIP}
        >
          {TEACHER_SNAPSHOT_COMPACT_LABEL}: <strong>{assignment.teacherName}</strong>
        </div>
      </div>

      {/* Meta: Deadline & Score */}
      <div
        style={{
          padding: '0.75rem',
          backgroundColor: 'var(--color-surface-subtle, #f9fafb)',
          borderRadius: 'var(--radius-md, 6px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.15rem' }}>
            Hạn nộp bài
          </div>
          <DeadlineBadge deadline={assignment.deadline} />
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.15rem' }}>
            Điểm tối đa
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary, #2563eb)' }}>
            {assignment.maxScore} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>đ</span>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
        <Link
          to={`/student/assignments/${assignment.id}`}
          style={{
            width: '100%',
            textAlign: 'center',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md, 6px)',
            textDecoration: 'none',
            backgroundColor: assignment.hasSubmitted
              ? 'var(--color-surface-subtle, #f3f4f6)'
              : 'var(--color-primary, #2563eb)',
            color: assignment.hasSubmitted ? 'var(--color-text-primary, #374151)' : '#ffffff',
            border: assignment.hasSubmitted ? '1px solid var(--color-border, #d1d5db)' : 'none',
            transition: 'background-color 0.15s'
          }}
        >
          {assignment.hasSubmitted ? 'Xem chi tiết & bài nộp' : 'Làm bài nộp →'}
        </Link>
      </div>
    </div>
  );
};
