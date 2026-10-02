import React from 'react';
import type { QuestionType } from '../../types/quiz.types';
import { getQuestionTypeLabel } from '../../utils/quizHelper';

interface QuestionTypeBadgeProps {
  type: QuestionType;
}

export const QuestionTypeBadge: React.FC<QuestionTypeBadgeProps> = ({ type }) => {
  const label = getQuestionTypeLabel(type);

  const getStyle = (): React.CSSProperties => {
    switch (type) {
      case 'MultipleChoice':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#2563eb',
          border: '1px solid rgba(59, 130, 246, 0.25)'
        };
      case 'TrueFalse':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        };
      case 'FillInBlank':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#d97706',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        };
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
