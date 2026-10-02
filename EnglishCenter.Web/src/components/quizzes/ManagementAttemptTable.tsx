import React from 'react';
import { Link } from 'react-router-dom';
import type { QuizAttemptListItemResponse } from '../../types/quiz.types';
import { formatDateTime, formatScore } from '../../utils/quizHelper';
import { QuizAttemptStatusBadge } from './QuizAttemptStatusBadge';

interface ManagementAttemptTableProps {
  attempts: QuizAttemptListItemResponse[];
  roleBaseUrl: string;
}

export const ManagementAttemptTable: React.FC<ManagementAttemptTableProps> = ({
  attempts,
  roleBaseUrl
}) => {
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
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
        <p style={{ margin: 0, fontWeight: 500 }}>Chưa có lượt nộp bài nào cho bài kiểm tra này.</p>
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
              <th style={thStyle}>Mã học viên</th>
              <th style={thStyle}>Họ và tên</th>
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td style={tdStyle}>
                  <span className="font-mono" style={{ fontWeight: 600 }}>
                    {att.studentCode}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {att.studentName}
                  </div>
                </td>
                <td style={tdStyle}>
                  Lần {att.attemptNumber}
                </td>
                <td style={tdStyle}>
                  {formatDateTime(att.startedAt)}
                </td>
                <td style={tdStyle}>
                  {att.submittedAt ? formatDateTime(att.submittedAt) : '—'}
                </td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    {formatScore(att.score, att.quizMaxScore)}
                  </span>
                </td>
                <td style={tdStyle}>
                  <QuizAttemptStatusBadge status={att.status} />
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <Link
                    to={`${roleBaseUrl}/quiz-attempts/${att.attemptId}`}
                    style={viewBtnStyle}
                  >
                    Xem chi tiết bài làm &rarr;
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

const viewBtnStyle: React.CSSProperties = {
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
