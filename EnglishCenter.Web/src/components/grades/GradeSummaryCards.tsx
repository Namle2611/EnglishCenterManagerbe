import React from 'react';
import type { GradeReportingSummaryResponse } from '../../types/grade.types';
import { formatPercentage, GRADE_REPORTING_LABELS } from '../../utils/gradeHelper';

interface GradeSummaryCardsProps {
  summary: GradeReportingSummaryResponse;
  title?: string;
  className?: string;
}

export const GradeSummaryCards: React.FC<GradeSummaryCardsProps> = ({
  summary,
  title,
  className = ''
}) => {
  return (
    <div className={`grade-summary-container ${className}`} style={{ marginBottom: '1.5rem' }}>
      {title && (
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
            color: 'var(--color-text-primary, #111827)'
          }}
        >
          {title}
        </h3>
      )}

      <div
        className="grade-summary-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Card 1: Số mục đã có điểm */}
        <div
          className="grade-summary-card"
          data-testid="summary-graded-count"
          style={{
            padding: '1rem',
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary, #6b7280)',
              marginBottom: '0.35rem'
            }}
          >
            {GRADE_REPORTING_LABELS.visibleGradedItemCount}
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text-primary, #111827)'
            }}
          >
            {summary.visibleGradedItemCount}
          </div>
        </div>

        {/* Card 2: Chờ xử lý */}
        <div
          className="grade-summary-card"
          data-testid="summary-pending-count"
          style={{
            padding: '1rem',
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary, #6b7280)',
              marginBottom: '0.35rem'
            }}
          >
            {GRADE_REPORTING_LABELS.pendingItemCount}
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: summary.pendingItemCount > 0 ? '#d97706' : 'var(--color-text-primary, #111827)'
            }}
          >
            {summary.pendingItemCount}
          </div>
        </div>

        {/* Card 3: Điểm đạt được */}
        <div
          className="grade-summary-card"
          data-testid="summary-earned-points"
          style={{
            padding: '1rem',
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary, #6b7280)',
              marginBottom: '0.35rem'
            }}
          >
            {GRADE_REPORTING_LABELS.visibleEarnedPoints}
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#059669'
            }}
          >
            {summary.visibleEarnedPoints}
          </div>
        </div>

        {/* Card 4: Tổng điểm có thể đạt */}
        <div
          className="grade-summary-card"
          data-testid="summary-possible-points"
          style={{
            padding: '1rem',
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary, #6b7280)',
              marginBottom: '0.35rem'
            }}
          >
            {GRADE_REPORTING_LABELS.visiblePossiblePoints}
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text-primary, #111827)'
            }}
          >
            {summary.visiblePossiblePoints}
          </div>
        </div>

        {/* Card 5: Tỷ lệ điểm hiện có */}
        <div
          className="grade-summary-card grade-summary-percentage"
          data-testid="summary-percentage"
          style={{
            padding: '1rem',
            backgroundColor: 'rgba(37, 99, 235, 0.05)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: '#2563eb',
              fontWeight: 600,
              marginBottom: '0.35rem'
            }}
          >
            {GRADE_REPORTING_LABELS.visiblePercentage}
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#1d4ed8'
            }}
          >
            {formatPercentage(summary.visiblePercentage)}
          </div>
        </div>
      </div>
    </div>
  );
};
