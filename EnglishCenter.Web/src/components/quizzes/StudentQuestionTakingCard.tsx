import React, { useState } from 'react';
import type { QuestionAnswerCoordinator } from '../../services/quiz.service';
import type { StudentQuestionResponse } from '../../types/quiz.types';
import { getOptionBadgeLabel, getQuestionTypeLabel } from '../../utils/quizHelper';

interface StudentQuestionTakingCardProps {
  question: StudentQuestionResponse;
  index: number;
  coordinator?: QuestionAnswerCoordinator;
  disabled?: boolean;
}

export const StudentQuestionTakingCard: React.FC<StudentQuestionTakingCardProps> = ({
  question,
  index,
  coordinator,
  disabled = false
}) => {
  const [localOptionId, setLocalOptionId] = useState<number | null>(
    coordinator?.latestLocalValue.selectedOptionId ?? question.selectedOptionId
  );
  const [localTextAnswer, setLocalTextAnswer] = useState<string>(
    coordinator?.latestLocalValue.textAnswer ?? question.textAnswer ?? ''
  );

  const saveStatus = coordinator?.saveStatus || (question.selectedOptionId || question.textAnswer ? 'saved' : 'unsaved');
  const errorMessage = coordinator?.errorMessage || null;

  const handleOptionSelect = (optionId: number) => {
    if (disabled) return;
    setLocalOptionId(optionId);
    if (coordinator) {
      coordinator.updateValue({ selectedOptionId: optionId, textAnswer: null }, 0);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = e.target.value;
    setLocalTextAnswer(val);
    if (coordinator) {
      coordinator.updateValue({ selectedOptionId: null, textAnswer: val }, 500);
    }
  };

  const handleBlurFlush = () => {
    if (disabled) return;
    if (coordinator) {
      coordinator.flushDebounce();
    }
  };

  const handleExplicitSave = () => {
    if (disabled) return;
    if (coordinator) {
      coordinator.flushDebounce();
      coordinator.processQueue();
    }
  };

  const handleRetry = () => {
    if (disabled) return;
    if (coordinator) {
      coordinator.processQueue();
    }
  };

  const renderSaveStatusBadge = () => {
    switch (saveStatus) {
      case 'saved':
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-active-text, #059669)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            ✓ Đã lưu
          </span>
        );
      case 'saving':
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary, #2563eb)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            ⏳ Đang lưu...
          </span>
        );
      case 'error':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-danger-text, #dc2626)' }}>
              ⚠️ Lưu thất bại
            </span>
            <button
              type="button"
              onClick={handleRetry}
              disabled={disabled}
              style={{
                padding: '0.15rem 0.45rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger-text)',
                border: '1px solid var(--status-danger-border)',
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
          </span>
        );
      case 'unsaved':
      default:
        return (
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted, #9ca3af)' }}>
            Chưa lưu
          </span>
        );
    }
  };

  return (
    <div
      id={`question-card-${question.id}`}
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
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-surface-subtle)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
          >
            {question.score} điểm
          </span>
        </div>

        <div>{renderSaveStatusBadge()}</div>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            border: '1px solid var(--status-danger-border)',
            marginBottom: '0.75rem'
          }}
        >
          {errorMessage}
        </div>
      )}

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

      {/* MultipleChoice & TrueFalse options */}
      {question.options && question.options.length > 0 && (
        <div
          role="radiogroup"
          aria-labelledby={`question-content-${question.id}`}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}
        >
          {question.options
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((opt, optIdx) => {
              const isSelected = localOptionId === opt.id;
              const inputId = `q-${question.id}-opt-${opt.id}`;

              return (
                <label
                  key={opt.id}
                  htmlFor={inputId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    minHeight: '44px',
                    borderRadius: 'var(--radius-lg)',
                    border: isSelected
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    backgroundColor: isSelected
                      ? 'rgba(37, 99, 235, 0.05)'
                      : 'var(--color-surface)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box'
                  }}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name={`question-${question.id}`}
                    value={opt.id}
                    checked={isSelected}
                    onChange={() => handleOptionSelect(opt.id)}
                    disabled={disabled}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: disabled ? 'not-allowed' : 'pointer'
                    }}
                  />
                  {question.questionType === 'MultipleChoice' && (
                    <span
                      style={{
                        minWidth: '24px',
                        padding: '0.15rem 0.35rem',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: isSelected
                          ? 'var(--color-primary)'
                          : 'var(--color-surface-subtle)',
                        color: isSelected
                          ? 'var(--color-text-inverse)'
                          : 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      {getOptionBadgeLabel(optIdx)}
                    </span>
                  )}
                  <span
                    style={{
                      flex: 1,
                      fontSize: '0.9375rem',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)'
                    }}
                  >
                    {/* Render backend option content verbatim */}
                    {opt.content}
                  </span>
                </label>
              );
            })}
        </div>
      )}

      {/* FillInBlank input */}
      {question.questionType === 'FillInBlank' && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Nhập câu trả lời của bạn..."
              value={localTextAnswer}
              onChange={handleTextChange}
              onBlur={handleBlurFlush}
              disabled={disabled}
              style={{
                flex: 1,
                minHeight: '44px',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.9375rem',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={handleExplicitSave}
              disabled={disabled || saveStatus === 'saving'}
              style={{
                minHeight: '44px',
                padding: '0.625rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-subtle)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer'
              }}
            >
              Lưu
            </button>
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.375rem'
            }}
          >
            ℹ️ Câu trả lời sẽ tự động lưu sau khi dừng gõ 0.5s hoặc khi nhấn nút "Lưu".
          </div>
        </div>
      )}
    </div>
  );
};
