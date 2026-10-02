import React from 'react';
import { Link } from 'react-router-dom';
import type { QuizDetailResponse } from '../../types/quiz.types';
import { formatDateTime } from '../../utils/quizHelper';
import { QuizStatusBadge } from './QuizStatusBadge';

interface QuizDetailCardProps {
  quiz: QuizDetailResponse;
  roleBaseUrl: string;
  isActionLoading: boolean;
  onPublish: () => void;
  onCloseQuiz: () => void;
  onReopen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const QuizDetailCard: React.FC<QuizDetailCardProps> = ({
  quiz,
  roleBaseUrl,
  isActionLoading,
  onPublish,
  onCloseQuiz,
  onReopen,
  onEdit,
  onDelete
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {quiz.title}
            </h1>
            <QuizStatusBadge status={quiz.status} />
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Lớp: <strong>{quiz.classCode}</strong> &bull; Khóa: <strong>{quiz.courseName}</strong> &bull; Giảng viên: <strong>{quiz.teacherName || 'Chưa phân công'}</strong>
          </div>
        </div>

        {/* Lifecycle actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {quiz.status === 'Draft' && (
            <button
              type="button"
              onClick={onPublish}
              disabled={isActionLoading || quiz.questionCount === 0}
              title={quiz.questionCount === 0 ? 'Cần ít nhất 1 câu hỏi để xuất bản' : 'Xuất bản bài kiểm tra'}
              style={{
                ...primaryBtnStyle,
                opacity: quiz.questionCount === 0 ? 0.6 : 1,
                cursor: quiz.questionCount === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              🚀 Xuất bản
            </button>
          )}

          {quiz.status === 'Published' && (
            <button
              type="button"
              onClick={onCloseQuiz}
              disabled={isActionLoading}
              title="Đóng bài kiểm tra"
              style={warningBtnStyle}
            >
              🔒 Đóng bài kiểm tra
            </button>
          )}

          {quiz.status === 'Closed' && (
            <button
              type="button"
              onClick={onReopen}
              disabled={isActionLoading}
              title="Mở lại bài kiểm tra"
              style={secondaryBtnStyle}
            >
              🔄 Mở lại
            </button>
          )}

          <button
            type="button"
            onClick={onEdit}
            disabled={isActionLoading}
            style={secondaryBtnStyle}
          >
            ✏️ Chỉnh sửa
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isActionLoading || quiz.attemptCount > 0}
            title={quiz.attemptCount > 0 ? 'Không thể xóa bài kiểm tra đã có lượt nộp bài' : 'Xóa bài kiểm tra'}
            style={{
              ...dangerBtnStyle,
              opacity: quiz.attemptCount > 0 ? 0.5 : 1,
              cursor: quiz.attemptCount > 0 ? 'not-allowed' : 'pointer'
            }}
          >
            🗑️ Xóa
          </button>
        </div>
      </div>

      {quiz.description && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            marginBottom: '1.25rem',
            lineHeight: 1.6
          }}
        >
          {quiz.description}
        </div>
      )}

      {/* Metadata Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--color-surface-subtle)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <div style={metaLabelStyle}>Thời lượng</div>
          <div style={metaValueStyle}>
            {quiz.durationMinutes ? `${quiz.durationMinutes} phút` : 'Không giới hạn'}
          </div>
        </div>

        <div>
          <div style={metaLabelStyle}>Số lần làm tối đa</div>
          <div style={metaValueStyle}>{quiz.maxAttempts} lần</div>
        </div>

        <div>
          <div style={metaLabelStyle}>Thời gian mở</div>
          <div style={metaValueStyle}>
            {quiz.startAt ? formatDateTime(quiz.startAt) : 'Mở tự do'}
          </div>
        </div>

        <div>
          <div style={metaLabelStyle}>Thời gian kết thúc</div>
          <div style={metaValueStyle}>
            {quiz.endAt ? formatDateTime(quiz.endAt) : 'Không giới hạn'}
          </div>
        </div>

        <div>
          <div style={metaLabelStyle}>Tổng số câu hỏi</div>
          <div style={metaValueStyle}>{quiz.questionCount} câu</div>
        </div>

        <div>
          <div style={metaLabelStyle}>Tổng thang điểm</div>
          <div style={metaValueStyle}>{quiz.maxScore} điểm</div>
        </div>

        <div>
          <div style={metaLabelStyle}>Tổng lượt làm bài</div>
          <div style={metaValueStyle}>{quiz.attemptCount} lượt</div>
        </div>
      </div>

      {/* Sub-resource Navigation Tabs / Links */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link
          to={`${roleBaseUrl}/quizzes/${quiz.id}/questions`}
          style={navTabLinkStyle}
        >
          📚 Quản lý câu hỏi ({quiz.questionCount}) &rarr;
        </Link>
        <Link
          to={`${roleBaseUrl}/quizzes/${quiz.id}/attempts`}
          style={navTabLinkStyle}
        >
          👥 Danh sách bài nộp của học viên ({quiz.attemptCount}) &rarr;
        </Link>
      </div>
    </div>
  );
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '0.25rem'
};

const metaValueStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)'
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer'
};

const warningBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--status-warning-border, rgba(245, 158, 11, 0.4))',
  backgroundColor: 'var(--status-warning-bg, rgba(245, 158, 11, 0.1))',
  color: 'var(--status-warning-text, #b45309)',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer'
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer'
};

const dangerBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--status-danger-border)',
  backgroundColor: 'var(--status-danger-bg)',
  color: 'var(--status-danger-text)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer'
};

const navTabLinkStyle: React.CSSProperties = {
  padding: '0.625rem 1.125rem',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface-subtle)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-primary)',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 600
};
