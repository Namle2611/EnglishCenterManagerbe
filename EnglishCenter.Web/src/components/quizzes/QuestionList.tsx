import React from 'react';
import type { QuestionManagementResponse } from '../../types/quiz.types';
import { getOptionBadgeLabel } from '../../utils/quizHelper';
import { QuestionTypeBadge } from './QuestionTypeBadge';

interface QuestionListProps {
  questions: QuestionManagementResponse[];
  isReadOnly: boolean;
  onEdit: (question: QuestionManagementResponse) => void;
  onDelete: (question: QuestionManagementResponse) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  isReadOnly,
  onEdit,
  onDelete
}) => {
  if (questions.length === 0) {
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
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>❓</div>
        <p style={{ margin: 0, fontWeight: 500 }}>Chưa có câu hỏi nào trong bài kiểm tra.</p>
        {!isReadOnly && (
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8125rem' }}>
            Nhấn vào nút "Thêm câu hỏi" ở trên để bắt đầu soạn câu hỏi đầu tiên.
          </p>
        )}
      </div>
    );
  }

  // Sorted by orderIndex ascending
  const sortedQuestions = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {sortedQuestions.map((qn, index) => (
        <div
          key={qn.id}
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            padding: '1.25rem 1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'var(--color-primary)'
                }}
              >
                Câu {index + 1}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                (Thứ tự: {qn.orderIndex})
              </span>
              <QuestionTypeBadge type={qn.questionType} />
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                {qn.score} điểm
              </span>
            </div>

            {!isReadOnly && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => onEdit(qn)}
                  style={actionBtnStyle}
                >
                  ✏️ Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(qn)}
                  style={{ ...actionBtnStyle, color: 'var(--color-danger)' }}
                >
                  🗑️ Xóa
                </button>
              </div>
            )}
          </div>

          {/* Question content */}
          <div
            style={{
              fontSize: '0.9375rem',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              lineHeight: 1.6,
              marginBottom: '1rem',
              whiteSpace: 'pre-wrap'
            }}
          >
            {qn.content}
          </div>

          {/* Options for MC and TF */}
          {qn.options && qn.options.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                backgroundColor: 'var(--color-surface-subtle)',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
              }}
            >
              {qn.options
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((opt, optIdx) => (
                  <div
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      fontSize: '0.875rem',
                      color: opt.isCorrect ? 'var(--status-active-text)' : 'var(--color-text-primary)'
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
                        backgroundColor: opt.isCorrect ? 'var(--status-active-bg)' : 'var(--color-surface)',
                        color: opt.isCorrect ? 'var(--status-active-text)' : 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      {getOptionBadgeLabel(optIdx)}
                    </span>
                    <span style={{ flex: 1, fontWeight: opt.isCorrect ? 600 : 400 }}>
                      {opt.content}
                    </span>
                    {opt.isCorrect && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--status-active-text)'
                        }}
                      >
                        ✓ Đáp án đúng
                      </span>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* FillInBlank answer key */}
          {qn.questionType === 'FillInBlank' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem'
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Đáp án chính xác:
              </span>
              <code
                style={{
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  backgroundColor: 'var(--color-surface)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)'
                }}
              >
                {qn.correctTextAnswer}
              </code>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const actionBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface-subtle)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer'
};
