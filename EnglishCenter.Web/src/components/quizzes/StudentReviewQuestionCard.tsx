import React from 'react';
import type { StudentQuestionReviewItem } from '../../types/quiz.types';
import { getOptionBadgeLabel, getQuestionTypeLabel } from '../../utils/quizHelper';

interface StudentReviewQuestionCardProps {
  question: StudentQuestionReviewItem;
  index: number;
}

export const StudentReviewQuestionCard: React.FC<StudentReviewQuestionCardProps> = ({
  question,
  index
}) => {
  const isCorrect = question.isCorrect === true;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.25rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.875rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.625rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            Câu {index + 1}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            ({getQuestionTypeLabel(question.questionType)})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: isCorrect ? 'var(--status-active-bg)' : 'var(--status-danger-bg)',
              color: isCorrect ? 'var(--status-active-text)' : 'var(--status-danger-text)',
              border: `1px solid ${isCorrect ? 'var(--status-active-border)' : 'var(--status-danger-border)'}`
            }}
          >
            {isCorrect ? '✓ Đúng' : '✗ Sai'}
          </span>

          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {question.scoreEarned} / {question.score} điểm
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          fontSize: '1rem',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          lineHeight: 1.6,
          marginBottom: '1.25rem',
          whiteSpace: 'pre-wrap'
        }}
      >
        {question.content}
      </div>

      {/* Options for MC and TF */}
      {question.options && question.options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {question.options
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((opt, optIdx) => {
              const isSelectedByStudent = opt.id === question.selectedOptionId;
              const isOptionCorrect = opt.isCorrect;

              let rowBg = 'var(--color-surface)';
              let border = '1px solid var(--color-border)';

              if (isSelectedByStudent && isOptionCorrect) {
                rowBg = 'rgba(16, 185, 129, 0.1)';
                border = '1px solid rgba(16, 185, 129, 0.3)';
              } else if (isSelectedByStudent && !isOptionCorrect) {
                rowBg = 'rgba(239, 68, 68, 0.1)';
                border = '1px solid rgba(239, 68, 68, 0.3)';
              } else if (!isSelectedByStudent && isOptionCorrect) {
                rowBg = 'rgba(16, 185, 129, 0.05)';
                border = '1px dashed rgba(16, 185, 129, 0.4)';
              }

              return (
                <div
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: rowBg,
                    border,
                    fontSize: '0.875rem'
                  }}
                >
                  <span
                    style={{
                      minWidth: '24px',
                      padding: '0.15rem 0.35rem',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: isOptionCorrect ? 'var(--status-active-bg)' : 'var(--color-surface-subtle)',
                      color: isOptionCorrect ? 'var(--status-active-text)' : 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {getOptionBadgeLabel(optIdx)}
                  </span>
                  <span style={{ flex: 1, fontWeight: isSelectedByStudent ? 600 : 400 }}>
                    {opt.content}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isSelectedByStudent && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isCorrect ? 'var(--status-active-bg)' : 'var(--status-danger-bg)',
                          color: isCorrect ? 'var(--status-active-text)' : 'var(--status-danger-text)'
                        }}
                      >
                        Bạn đã chọn
                      </span>
                    )}
                    {isOptionCorrect && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--status-active-bg)',
                          color: 'var(--status-active-text)'
                        }}
                      >
                        ✓ Đáp án đúng
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* FillInBlank answer comparison */}
      {question.questionType === 'FillInBlank' && (
        <div
          style={{
            backgroundColor: 'var(--color-surface-subtle)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            fontSize: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-text-secondary)', width: '150px' }}>
              Câu trả lời của bạn:
            </span>
            <strong style={{ color: isCorrect ? 'var(--status-active-text)' : 'var(--status-danger-text)' }}>
              {question.textAnswer ? question.textAnswer : '(Chưa điền)'}
            </strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-text-secondary)', width: '150px' }}>
              Đáp án chính xác:
            </span>
            <code style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              {question.correctTextAnswer}
            </code>
          </div>
        </div>
      )}
    </div>
  );
};
