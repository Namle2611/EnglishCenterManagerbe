import React from 'react';
import type { LessonStatus } from '../../types/learningContent.types';
import { getLessonStatusBadgeStyle, getLessonStatusLabel } from '../../utils/learningContentHelper';

interface LessonStatusBadgeProps {
  status: LessonStatus;
}

export const LessonStatusBadge: React.FC<LessonStatusBadgeProps> = ({ status }) => {
  const label = getLessonStatusLabel(status);
  const style = getLessonStatusBadgeStyle(status);

  const getIcon = () => {
    switch (status) {
      case 'Published':
        return '✓';
      case 'Hidden':
        return '👁️‍🗨️';
      case 'Draft':
      default:
        return '✎';
    }
  };

  return (
    <span
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.15rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        userSelect: 'none'
      }}
      aria-label={`Trạng thái bài học: ${label}`}
    >
      <span aria-hidden="true" style={{ fontSize: '0.7rem' }}>
        {getIcon()}
      </span>
      <span>{label}</span>
    </span>
  );
};
