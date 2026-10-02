import React from 'react';
import { Link } from 'react-router-dom';
import type { StudentAttemptSummaryResponse } from '../../types/quiz.types';
import { formatDateTime, formatScore } from '../../utils/quizHelper';
import { QuizAttemptStatusBadge } from './QuizAttemptStatusBadge';

interface StudentMyAttemptsTableProps {
  attempts: StudentAttemptSummaryResponse[];
}

export const StudentMyAttemptsTable: React.FC<StudentMyAttemptsTableProps> = ({ attempts }) => {
  if (attempts.length === 0) {
    return (
      <div
        style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)'
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📜</div>
        <p style={{ margin: 0, fontWeight: 500 }}>Bạn chưa có lượt làm bài nào cho bài kiểm tra này.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                borderBottom: '1px solid var(--color-border)'
              }}
            >
              <th style={thStyle}>Lần làm</th>
              <th style={thStyle}>Bắt đầu lúc</th>
              <th style={thStyle}>Nộp bài lúc</th>
              <th style={thStyle}>Điểm số</th>
              <th style={thStyle}>Trạng thái</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((att) => (
              <tr
                key={att.attemptId}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <td style={{ ...tdStyle, fontWeight: 700 }}>
                  Lần {att.attemptNumber}
                </td>
                <td style={tdStyle}>
                  {formatDateTime(att.startedAt)}
                </td>
                <td style={tdStyle}>
                  {att.submittedAt ? formatDateTime(att.submittedAt) : '—'}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      fontWeight: 700,
                      color: att.score === null ? 'var(--status-warning-text, #b45309)' : 'var(--color-primary)'
                    }}
                  >
                    {formatScore(att.score)}
                  </span>
                </td>
                <td style={tdStyle}>
                  <QuizAttemptStatusBadge status={att.status} />
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <Link
                    to={`/student/quiz-attempts/${att.attemptId}`}
                    style={
                      att.status === 'InProgress' ? resumeLinkStyle : viewLinkStyle
                    }
                  >
                    {att.status === 'InProgress' ? 'Tiếp tục làm bài &rarr;' : 'Xem kết quả &rarr;'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  fontSize: '0.875rem',
  color: 'var(--color-text-primary)',
  verticalAlign: 'middle'
};

const viewLinkStyle: React.CSSProperties = {
  padding: '0.35rem 0.75rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface-subtle)',
  color: 'var(--color-primary)',
  border: '1px solid var(--color-border)',
  textDecoration: 'none',
  display: 'inline-block'
};

const resumeLinkStyle: React.CSSProperties = {
  padding: '0.35rem 0.75rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--status-warning-bg, rgba(245, 158, 11, 0.15))',
  color: 'var(--status-warning-text, #b45309)',
  border: '1px solid var(--status-warning-border, rgba(245, 158, 11, 0.4))',
  textDecoration: 'none',
  display: 'inline-block'
};
