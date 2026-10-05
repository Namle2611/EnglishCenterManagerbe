import React from 'react';
import type { GradeItemResponse } from '../../types/grade.types';
import { GradeStatusBadge } from './GradeStatusBadge';
import { canGradeAssignmentItem, formatPercentage, formatScore } from '../../utils/gradeHelper';

interface GradeItemListProps {
  items: GradeItemResponse[];
  userRole?: string | null;
  onGradeItem?: (item: GradeItemResponse) => void;
  title?: string;
  emptyMessage?: string;
}

export const GradeItemList: React.FC<GradeItemListProps> = ({
  items,
  userRole,
  onGradeItem,
  title = 'Danh sách các mục đánh giá',
  emptyMessage = 'Không có bài tập hoặc bài kiểm tra nào.'
}) => {
  return (
    <div className="grade-item-list-container" style={{ marginTop: '1.5rem' }}>
      {title && (
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--color-text-primary, #111827)'
          }}
        >
          {title}
        </h3>
      )}

      {items.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--color-text-secondary, #6b7280)'
          }}
        >
          {emptyMessage}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item) => {
            const isQuiz = item.sourceType === 'Quiz';
            const isLocked = item.status === 'Locked';
            const canGrade = canGradeAssignmentItem(item, userRole);
            const isGraded = item.rawScore !== null && item.rawScore !== undefined;

            return (
              <div
                key={`${item.sourceType}-${item.sourceId}`}
                className={`grade-item-card grade-item-${item.sourceType.toLowerCase()}`}
                data-testid={`grade-item-${item.sourceType.toLowerCase()}-${item.sourceId}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1rem',
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: 'var(--radius-md, 8px)',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  gap: '0.5rem'
                }}
              >
                {/* Header row: Source icon, title, status badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm, 4px)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor: isQuiz ? 'rgba(124, 58, 237, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                        color: isQuiz ? '#6d28d9' : '#1d4ed8'
                      }}
                    >
                      {isQuiz ? 'Quiz' : 'Bài tập'}
                    </span>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'var(--color-text-primary, #111827)'
                      }}
                    >
                      {item.title}
                    </h4>
                  </div>

                  <GradeStatusBadge status={item.status} />
                </div>

                {/* Content row: Dates, Scores, Percentage, Action */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--color-border, #f3f4f6)',
                    fontSize: '0.85rem'
                  }}
                >
                  {/* Left info: Dates */}
                  <div style={{ color: 'var(--color-text-secondary, #6b7280)', display: 'flex', gap: '1rem' }}>
                    {item.dueDate && (
                      <span>Hạn nộp: {new Date(item.dueDate).toLocaleDateString('vi-VN')}</span>
                    )}
                    {item.submittedAt && (
                      <span>Đã nộp: {new Date(item.submittedAt).toLocaleDateString('vi-VN')}</span>
                    )}
                  </div>

                  {/* Right info: Score display & Grade button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
                    {isLocked ? (
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontStyle: 'italic',
                          color: '#7c3aed'
                        }}
                      >
                        Chưa mở kết quả
                      </span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: isGraded ? '#111827' : '#9ca3af',
                            fontVariantNumeric: 'tabular-nums'
                          }}
                        >
                          {formatScore(item.rawScore, item.maxScore)}
                        </span>
                        {item.percentage !== null && item.percentage !== undefined && (
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#2563eb'
                            }}
                          >
                            ({formatPercentage(item.percentage)})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Management Grading Action */}
                    {canGrade && onGradeItem && (
                      <button
                        type="button"
                        id={`btn-grade-${item.sourceType.toLowerCase()}-${item.sourceId}`}
                        onClick={() => onGradeItem(item)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: isGraded ? '#374151' : '#ffffff',
                          backgroundColor: isGraded ? '#f3f4f6' : '#2563eb',
                          border: isGraded ? '1px solid #d1d5db' : 'none',
                          borderRadius: 'var(--radius-sm, 4px)',
                          cursor: 'pointer',
                          minHeight: '36px'
                        }}
                      >
                        {isGraded ? 'Chỉnh sửa điểm' : 'Chấm điểm'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Feedback section if available */}
                {item.feedback && !isLocked && (
                  <div
                    style={{
                      marginTop: '0.35rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--color-surface-subtle, #f9fafb)',
                      borderLeft: '3px solid #2563eb',
                      borderRadius: '0 var(--radius-sm, 4px) var(--radius-sm, 4px) 0',
                      fontSize: '0.825rem',
                      color: 'var(--color-text-secondary, #4b5563)'
                    }}
                  >
                    <strong>Nhận xét:</strong> {item.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
