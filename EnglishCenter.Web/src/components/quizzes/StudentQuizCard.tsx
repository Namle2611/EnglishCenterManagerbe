import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { QuizListItemResponse } from '../../types/quiz.types';
import { formatDateTime, getStudentQuizEligibility } from '../../utils/quizHelper';

interface StudentQuizCardProps {
  quiz: QuizListItemResponse;
  isStarting: boolean;
  onStartOrResume: (quizId: number) => void;
}

export const StudentQuizCard: React.FC<StudentQuizCardProps> = ({
  quiz,
  isStarting,
  onStartOrResume
}) => {
  const navigate = useNavigate();
  const eligibility = getStudentQuizEligibility(quiz);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            <Link
              to={`/student/quizzes/${quiz.id}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {quiz.title}
            </Link>
          </h2>

          {quiz.hasActiveAttempt ? (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--status-warning-bg, rgba(245, 158, 11, 0.1))',
                color: 'var(--status-warning-text, #b45309)',
                border: '1px solid var(--status-warning-border, rgba(245, 158, 11, 0.3))',
                whiteSpace: 'nowrap'
              }}
            >
              Đang làm dở
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface-subtle)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                whiteSpace: 'nowrap'
              }}
            >
              {quiz.classCode}
            </span>
          )}
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Khóa học: <strong>{quiz.courseName}</strong>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem 1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.8125rem',
            marginBottom: '1rem'
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Thời lượng: </span>
            <strong>{quiz.durationMinutes ? `${quiz.durationMinutes} phút` : 'Tự do'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Số lượt làm: </span>
            <strong>{quiz.attemptCount} / {quiz.maxAttempts}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Mở: </span>
            <span>{quiz.startAt ? formatDateTime(quiz.startAt) : 'Tự do'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Đóng: </span>
            <span>{quiz.endAt ? formatDateTime(quiz.endAt) : 'Không'}</span>
          </div>
        </div>

        {eligibility.reason && (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '1rem'
            }}
          >
            ℹ️ {eligibility.reason}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={() => {
            if (eligibility.canStart || eligibility.canResume) {
              onStartOrResume(quiz.id);
            } else {
              navigate(`/student/quizzes/${quiz.id}`);
            }
          }}
          disabled={isStarting || (!eligibility.canStart && !eligibility.canResume && quiz.classStatus === 'Planned')}
          style={{
            flex: 1,
            padding: '0.625rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor:
              eligibility.canResume
                ? 'var(--status-warning-bg, #f59e0b)'
                : eligibility.canStart
                ? 'var(--color-primary)'
                : 'var(--color-surface-subtle)',
            color:
              eligibility.canResume || eligibility.canStart
                ? 'var(--color-text-inverse, #ffffff)'
                : 'var(--color-text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor:
              eligibility.canStart || eligibility.canResume ? 'pointer' : 'default'
          }}
        >
          {isStarting ? 'Đang xử lý...' : eligibility.buttonLabel}
        </button>

        <Link
          to={`/student/quizzes/${quiz.id}/attempts`}
          title="Xem lịch sử làm bài"
          style={{
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          Lịch sử ({quiz.attemptCount})
        </Link>
      </div>
    </div>
  );
};
