import React from 'react';
import type { QuizAttemptStatus } from '../../types/quiz.types';
import { getQuizAttemptStatusBadge } from '../../utils/quizHelper';

interface QuizAttemptStatusBadgeProps {
  status: QuizAttemptStatus;
}

export const QuizAttemptStatusBadge: React.FC<QuizAttemptStatusBadgeProps> = ({ status }) => {
  const { label, variant } = getQuizAttemptStatusBadge(status);

  const getStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'var(--status-active-bg)',
          color: 'var(--status-active-text)',
          border: '1px solid var(--status-active-border)'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--status-pending-bg)',
          color: 'var(--status-pending-text)',
          border: '1px solid var(--status-pending-border)'
        };
      case 'danger':
        return {
          backgroundColor: 'var(--status-danger-bg)',
          color: 'var(--status-danger-text)',
          border: '1px solid var(--status-danger-border)'
        };
      case 'neutral':
      default:
        return {
          backgroundColor: 'var(--color-surface-subtle)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)'
        };
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.55rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        ...getStyle()
      }}
    >
      {label}
    </span>
  );
};
