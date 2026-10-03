import React from 'react';
import type {
  GeneratedQuizOptionItemResponse,
  GeneratedQuizQuestionItemResponse
} from '../../types/quiz.types';
import { getOptionBadgeLabel } from '../../utils/quizAiHelper';

export interface QuizAiQuestionCardProps {
  question: GeneratedQuizQuestionItemResponse;
  index: number;
  totalCount: number;
  onChange: (updated: GeneratedQuizQuestionItemResponse) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
}

export const QuizAiQuestionCard: React.FC<QuizAiQuestionCardProps> = ({
  question,
  index,
  totalCount,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  disabled = false
}) => {
  const isMultipleChoice = question.questionType === 'MultipleChoice';
  const isTrueFalse = question.questionType === 'TrueFalse';
  const isFillInBlank = question.questionType === 'FillInBlank';

  const handleContentChange = (content: string) => {
    onChange({ ...question, content });
  };

  const handleScoreChange = (scoreStr: string) => {
    const parsed = parseFloat(scoreStr);
    onChange({ ...question, score: isNaN(parsed) ? 0 : parsed });
  };

  const handleOptionContentChange = (optIndex: number, text: string) => {
    const updatedOptions = (question.options || []).map((opt, i) =>
      i === optIndex ? { ...opt, content: text } : opt
    );
    onChange({ ...question, options: updatedOptions });
  };

  const handleSelectCorrectOption = (optIndex: number) => {
    const updatedOptions = (question.options || []).map((opt, i) => ({
      ...opt,
      isCorrect: i === optIndex
    }));
    onChange({ ...question, options: updatedOptions });
  };

  const handleAddOption = () => {
    const currentOptions = question.options || [];
    const newOption: GeneratedQuizOptionItemResponse = {
      content: '',
      isCorrect: currentOptions.length === 0,
      orderIndex: currentOptions.length + 1
    };
    onChange({ ...question, options: [...currentOptions, newOption] });
  };

  const handleRemoveOption = (optIndex: number) => {
    const currentOptions = question.options || [];
    if (currentOptions.length <= 2) return;

    const filtered = currentOptions.filter((_, i) => i !== optIndex);
    // If removed option was the correct one, make the first remaining option correct
    const hasCorrect = filtered.some((o) => o.isCorrect);
    if (!hasCorrect && filtered.length > 0) {
      filtered[0].isCorrect = true;
    }
    onChange({ ...question, options: filtered });
  };

  const handleCorrectTextAnswerChange = (val: string) => {
    onChange({ ...question, correctTextAnswer: val });
  };

  const typeLabels: Record<string, string> = {
    MultipleChoice: 'Trắc nghiệm nhiều lựa chọn',
    TrueFalse: 'Đúng / Sai',
    FillInBlank: 'Điền vào chỗ trống'
  };

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-surface)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      {/* Header: Question Number, Type Badge, Reorder & Delete actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--color-text-primary)'
            }}
          >
            Câu {index + 1}
          </span>
          <span
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)'
            }}
          >
            {typeLabels[question.questionType] || question.questionType}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Move Up */}
          <button
            type="button"
            onClick={onMoveUp}
            disabled={disabled || index === 0}
            aria-label={`Di chuyển câu ${index + 1} lên`}
            style={{
              minWidth: '44px',
              minHeight: '44px',
              padding: '0.375rem 0.625rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: index === 0 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              cursor: disabled || index === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem'
            }}
          >
            ↑ Lên
          </button>

          {/* Move Down */}
          <button
            type="button"
            onClick={onMoveDown}
            disabled={disabled || index === totalCount - 1}
            aria-label={`Di chuyển câu ${index + 1} xuống`}
            style={{
              minWidth: '44px',
              minHeight: '44px',
              padding: '0.375rem 0.625rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color:
                index === totalCount - 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              cursor: disabled || index === totalCount - 1 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem'
            }}
          >
            ↓ Xuống
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled || totalCount <= 1}
            aria-label={`Xóa câu ${index + 1}`}
            style={{
              minWidth: '44px',
              minHeight: '44px',
              padding: '0.375rem 0.625rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--status-danger-border)',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger-text)',
              cursor: disabled || totalCount <= 1 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            Xóa
          </button>
        </div>
      </div>

      {/* Main Form: Content & Score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
        <div>
          <label
            htmlFor={`ai-q-content-${question.tempId}`}
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.375rem'
            }}
          >
            Nội dung câu hỏi <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <textarea
            id={`ai-q-content-${question.tempId}`}
            value={question.content}
            onChange={(e) => handleContentChange(e.target.value)}
            disabled={disabled}
            rows={2}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              resize: 'vertical',
              minHeight: '44px'
            }}
          />
        </div>

        <div style={{ minWidth: '100px' }}>
          <label
            htmlFor={`ai-q-score-${question.tempId}`}
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.375rem'
            }}
          >
            Điểm <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <input
            id={`ai-q-score-${question.tempId}`}
            type="number"
            min="0.1"
            max="999.99"
            step="0.5"
            value={question.score}
            onChange={(e) => handleScoreChange(e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              minHeight: '44px'
            }}
          />
        </div>
      </div>

      {/* Answer Configuration by Question Type */}

      {/* 1. Multiple Choice Options */}
      {isMultipleChoice && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)'
              }}
            >
              Các lựa chọn đáp án (chọn radio để đánh dấu đáp án đúng):
            </span>
            <button
              type="button"
              onClick={handleAddOption}
              disabled={disabled}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-subtle)',
                color: 'var(--color-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                minHeight: '44px'
              }}
            >
              + Thêm lựa chọn
            </button>
          </div>

          {(question.options || []).map((opt, optIdx) => {
            const badgeLabel = getOptionBadgeLabel(optIdx);
            return (
              <div
                key={optIdx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: opt.isCorrect
                    ? 'var(--status-active-bg)'
                    : 'var(--color-surface-subtle)',
                  border: `1px solid ${
                    opt.isCorrect ? 'var(--status-active-border)' : 'var(--color-border)'
                  }`
                }}
              >
                {/* Radio button for Correct Answer */}
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    minHeight: '44px',
                    paddingRight: '0.25rem'
                  }}
                >
                  <input
                    type="radio"
                    name={`correct-option-${question.tempId}`}
                    checked={opt.isCorrect}
                    onChange={() => handleSelectCorrectOption(optIdx)}
                    disabled={disabled}
                    aria-label={`Đáp án ${badgeLabel} là đáp án đúng`}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--status-active-text)',
                      cursor: disabled ? 'not-allowed' : 'pointer'
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: opt.isCorrect
                        ? 'var(--status-active-text)'
                        : 'var(--color-text-secondary)',
                      minWidth: '24px'
                    }}
                  >
                    {badgeLabel}.
                  </span>
                </label>

                {/* Option text input */}
                <input
                  type="text"
                  value={opt.content}
                  onChange={(e) => handleOptionContentChange(optIdx, e.target.value)}
                  placeholder={`Nội dung lựa chọn ${badgeLabel}...`}
                  disabled={disabled}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    minHeight: '40px'
                  }}
                />

                {/* Badge indication */}
                {opt.isCorrect && (
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--status-active-bg)',
                      color: 'var(--status-active-text)',
                      border: '1px solid var(--status-active-border)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ✓ Đáp án đúng
                  </span>
                )}

                {/* Remove button */}
                {(question.options || []).length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(optIdx)}
                    disabled={disabled}
                    aria-label={`Xóa lựa chọn ${badgeLabel}`}
                    style={{
                      minWidth: '44px',
                      minHeight: '44px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-muted)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      fontSize: '1.125rem'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. True / False Options (Rendered VERBATIM from Proposal) */}
      {isTrueFalse && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)'
            }}
          >
            Lựa chọn Đúng / Sai (chọn radio để đánh dấu đáp án đúng):
          </span>

          {(question.options || []).map((opt, optIdx) => {
            const badgeLabel = getOptionBadgeLabel(optIdx);
            return (
              <div
                key={optIdx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: opt.isCorrect
                    ? 'var(--status-active-bg)'
                    : 'var(--color-surface-subtle)',
                  border: `1px solid ${
                    opt.isCorrect ? 'var(--status-active-border)' : 'var(--color-border)'
                  }`
                }}
              >
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    minHeight: '44px',
                    paddingRight: '0.25rem'
                  }}
                >
                  <input
                    type="radio"
                    name={`correct-option-${question.tempId}`}
                    checked={opt.isCorrect}
                    onChange={() => handleSelectCorrectOption(optIdx)}
                    disabled={disabled}
                    aria-label={`Đáp án ${badgeLabel} là đáp án đúng`}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--status-active-text)',
                      cursor: disabled ? 'not-allowed' : 'pointer'
                    }}
                  />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: opt.isCorrect
                        ? 'var(--status-active-text)'
                        : 'var(--color-text-secondary)',
                      minWidth: '24px'
                    }}
                  >
                    {badgeLabel}.
                  </span>
                </label>

                {/* Render verbatim content */}
                <input
                  type="text"
                  value={opt.content}
                  onChange={(e) => handleOptionContentChange(optIdx, e.target.value)}
                  placeholder={`Lựa chọn ${badgeLabel}...`}
                  disabled={disabled}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.875rem',
                    minHeight: '40px'
                  }}
                />

                {opt.isCorrect && (
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--status-active-bg)',
                      color: 'var(--status-active-text)',
                      border: '1px solid var(--status-active-border)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ✓ Đáp án đúng
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Fill In Blank Input */}
      {isFillInBlank && (
        <div>
          <label
            htmlFor={`ai-q-fib-${question.tempId}`}
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.375rem'
            }}
          >
            Đáp án văn bản chính xác <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <input
            id={`ai-q-fib-${question.tempId}`}
            type="text"
            value={question.correctTextAnswer || ''}
            onChange={(e) => handleCorrectTextAnswerChange(e.target.value)}
            placeholder="Nhập từ hoặc cụm từ chính xác học viên phải điền..."
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              minHeight: '44px'
            }}
          />
        </div>
      )}

      {/* Explanation: Preview-Only Display */}
      {question.explanation && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid var(--color-primary)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: '0.75rem',
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}
          >
            Giải thích — chỉ xem trước, không lưu
          </span>
          <div style={{ wordBreak: 'break-word', color: 'var(--color-text-primary)' }}>
            {question.explanation}
          </div>
        </div>
      )}
    </div>
  );
};
