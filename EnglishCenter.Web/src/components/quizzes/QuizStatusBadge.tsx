import React from 'react';
import type { QuizStatus } from '../../types/quiz.types';
import { getQuizStatusBadge } from '../../utils/quizHelper';

interface QuizStatusBadgeProps {
  status: QuizStatus;
}

export const QuizStatusBadge: React.FC<QuizStatusBadgeProps> = ({ status }) => {
  const { label, variant } = getQuizStatusBadge(status);

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
