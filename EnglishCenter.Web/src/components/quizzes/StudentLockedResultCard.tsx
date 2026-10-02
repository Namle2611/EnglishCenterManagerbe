import React from 'react';
import { Link } from 'react-router-dom';
import type { StudentOpenQuizResultResponse } from '../../types/quiz.types';
import { formatDateTime } from '../../utils/quizHelper';
import { QuizAttemptStatusBadge } from './QuizAttemptStatusBadge';

interface StudentLockedResultCardProps {
  result: StudentOpenQuizResultResponse;
}

export const StudentLockedResultCard: React.FC<StudentLockedResultCardProps> = ({ result }) => {
  const isExpired = result.status === 'Expired';

  return (
    <div
      style={{
        maxWidth: '680px',
        margin: '0 auto',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)'
      }}
    >
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1 }}>
        {isExpired ? '⌛' : '🎉'}
      </div>

      <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
        <QuizAttemptStatusBadge status={result.status} />
      </div>

      <h1
        style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)'
        }}
      >
        {isExpired ? 'Bài làm đã kết thúc' : 'Đã nộp bài kiểm tra thành công!'}
      </h1>

      <p style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
        Bài kiểm tra: <strong>{result.quizTitle}</strong> (Lần làm thứ {result.attemptNumber})
      </p>

      {/* Locked Notice Banner */}
      <div
        style={{
          padding: '1.25rem',
          backgroundColor: 'var(--color-surface-subtle)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          marginBottom: '1.75rem',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔒</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              Điểm số và đáp án đang được bảo mật
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Điểm và đáp án chi tiết sẽ hiển thị sau khi bài kiểm tra kết thúc và tất cả học viên hoàn thành lượt làm bài.
            </div>
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--color-surface-subtle)',
          borderRadius: 'var(--radius-lg)',
          fontSize: '0.875rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}
      >
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>Bắt đầu: </span>
          <strong>{formatDateTime(result.startedAt)}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>Nộp bài lúc: </span>
          <strong>{result.submittedAt ? formatDateTime(result.submittedAt) : '—'}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>Tổng số câu hỏi: </span>
          <strong>{result.questionCount} câu</strong>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>Điểm số: </span>
          <span style={{ fontWeight: 700, color: 'var(--status-warning-text, #b45309)' }}>
            Chờ công bố
          </span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link
          to={`/student/quizzes/${result.quizId}/attempts`}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-subtle)',
            color: 'var(--color-text-primary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          📜 Xem lịch sử làm bài
        </Link>
        <Link
          to="/student/quizzes"
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          Quay về danh sách bài kiểm tra &rarr;
        </Link>
      </div>
    </div>
  );
};
