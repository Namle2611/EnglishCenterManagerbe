import React from 'react';
import { Link } from 'react-router-dom';
import type { QuizListItemResponse } from '../../types/quiz.types';
import { formatDateTime } from '../../utils/quizHelper';
import { QuizStatusBadge } from './QuizStatusBadge';

interface QuizTableProps {
  quizzes: QuizListItemResponse[];
  roleBaseUrl: string;
  onEdit: (quiz: QuizListItemResponse) => void;
  onDelete: (quiz: QuizListItemResponse) => void;
}

export const QuizTable: React.FC<QuizTableProps> = ({
  quizzes,
  roleBaseUrl,
  onEdit,
  onDelete
}) => {
  if (quizzes.length === 0) {
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
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</div>
        <p style={{ margin: 0, fontWeight: 500 }}>Không tìm thấy bài kiểm tra nào phù hợp.</p>
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
              <th style={thStyle}>Tiêu đề bài kiểm tra</th>
              <th style={thStyle}>Lớp học</th>
              <th style={thStyle}>Thời lượng</th>
              <th style={thStyle}>Thời gian mở</th>
              <th style={thStyle}>Câu hỏi / Điểm</th>
              <th style={thStyle}>Lượt nộp</th>
              <th style={thStyle}>Trạng thái</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => (
              <tr
                key={quiz.id}
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
                  <Link
                    to={`${roleBaseUrl}/quizzes/${quiz.id}`}
                    style={{
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      textDecoration: 'none',
                      fontSize: '0.9375rem'
                    }}
                  >
                    {quiz.title}
                  </Link>
                  {quiz.teacherName && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                      GV: {quiz.teacherName}
                    </div>
                  )}
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {quiz.classCode}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {quiz.courseName}
                  </div>
                </td>
                <td style={tdStyle}>
                  {quiz.durationMinutes ? `${quiz.durationMinutes} phút` : 'Không giới hạn'}
                </td>
                <td style={tdStyle}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
                    {quiz.startAt ? formatDateTime(quiz.startAt) : 'Mở tự do'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    đến {quiz.endAt ? formatDateTime(quiz.endAt) : 'vô thời hạn'}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500 }}>{quiz.questionCount} câu</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {quiz.maxScore} điểm
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 500 }}>{quiz.attemptCount}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {' '}(tối đa {quiz.maxAttempts})
                  </span>
                </td>
                <td style={tdStyle}>
                  <QuizStatusBadge status={quiz.status} />
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}>
                    <Link
                      to={`${roleBaseUrl}/quizzes/${quiz.id}`}
                      title="Xem tổng quan"
                      style={actionLinkStyle}
                    >
                      Tổng quan
                    </Link>
                    <Link
                      to={`${roleBaseUrl}/quizzes/${quiz.id}/questions`}
                      title="Quản lý câu hỏi"
                      style={actionLinkStyle}
                    >
                      Câu hỏi ({quiz.questionCount})
                    </Link>
                    <Link
                      to={`${roleBaseUrl}/quizzes/${quiz.id}/attempts`}
                      title="Xem danh sách bài nộp"
                      style={actionLinkStyle}
                    >
                      Bài nộp ({quiz.attemptCount})
                    </Link>
                    <button
                      type="button"
                      onClick={() => onEdit(quiz)}
                      title="Chỉnh sửa bài kiểm tra"
                      style={editBtnStyle}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(quiz)}
                      title="Xóa bài kiểm tra"
                      style={deleteBtnStyle}
                    >
                      Xóa
                    </button>
                  </div>
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

const actionLinkStyle: React.CSSProperties = {
  padding: '0.3rem 0.55rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface-subtle)',
  color: 'var(--color-primary)',
  border: '1px solid var(--color-border)',
  textDecoration: 'none',
  whiteSpace: 'nowrap'
};

const editBtnStyle: React.CSSProperties = {
  padding: '0.3rem 0.55rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface-subtle)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};

const deleteBtnStyle: React.CSSProperties = {
  padding: '0.3rem 0.55rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--status-danger-bg)',
  color: 'var(--status-danger-text)',
  border: '1px solid var(--status-danger-border)',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};
