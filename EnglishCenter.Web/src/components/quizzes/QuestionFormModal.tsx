import React, { useEffect, useState } from 'react';
import type { QuestionManagementResponse, QuestionOptionRequest, QuestionType } from '../../types/quiz.types';
import { getOptionBadgeLabel } from '../../utils/quizHelper';

interface QuestionFormModalProps {
  isOpen: boolean;
  questionToEdit?: QuestionManagementResponse | null;
  defaultOrderIndex: number;
  onSubmit: (formData: {
    content: string;
    questionType: QuestionType;
    correctTextAnswer?: string | null;
    score: number;
    orderIndex: number;
    options?: QuestionOptionRequest[];
  }) => Promise<void>;
  onClose: () => void;
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  questionToEdit,
  defaultOrderIndex,
  onSubmit,
  onClose
}) => {
  const isEditing = Boolean(questionToEdit);

  const [questionType, setQuestionType] = useState<QuestionType>('MultipleChoice');
  const [content, setContent] = useState('');
  const [score, setScore] = useState('1');
  const [orderIndex, setOrderIndex] = useState(defaultOrderIndex.toString());
  const [correctTextAnswer, setCorrectTextAnswer] = useState('');

  // Options for MC and TF
  const [options, setOptions] = useState<Array<{ content: string; isCorrect: boolean }>>([
    { content: '', isCorrect: true },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false }
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void Promise.resolve().then(() => {
        if (questionToEdit) {
          setQuestionType(questionToEdit.questionType);
          setContent(questionToEdit.content);
          setScore(questionToEdit.score.toString());
          setOrderIndex(questionToEdit.orderIndex.toString());
          setCorrectTextAnswer(questionToEdit.correctTextAnswer || '');
          if (questionToEdit.options && questionToEdit.options.length > 0) {
            setOptions(
              questionToEdit.options.map((opt) => ({
                content: opt.content,
                isCorrect: opt.isCorrect
              }))
            );
          } else if (questionToEdit.questionType === 'TrueFalse') {
            setOptions([
              { content: 'Đúng', isCorrect: true },
              { content: 'Sai', isCorrect: false }
            ]);
          } else {
            setOptions([
              { content: '', isCorrect: true },
              { content: '', isCorrect: false }
            ]);
          }
        } else {
          setQuestionType('MultipleChoice');
          setContent('');
          setScore('1');
          setOrderIndex(defaultOrderIndex.toString());
          setCorrectTextAnswer('');
          setOptions([
            { content: '', isCorrect: true },
            { content: '', isCorrect: false },
            { content: '', isCorrect: false },
            { content: '', isCorrect: false }
          ]);
        }
        setValidationError(null);
        setIsSubmitting(false);
      });
    }
  }, [isOpen, questionToEdit, defaultOrderIndex]);

  const handleTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    setValidationError(null);
    if (newType === 'TrueFalse') {
      setOptions([
        { content: 'Đúng', isCorrect: true },
        { content: 'Sai', isCorrect: false }
      ]);
    } else if (newType === 'MultipleChoice') {
      if (options.length < 2) {
        setOptions([
          { content: '', isCorrect: true },
          { content: '', isCorrect: false }
        ]);
      }
    }
  };

  const handleOptionContentChange = (index: number, val: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], content: val };
      return next;
    });
  };

  const handleCorrectOptionChange = (selectedIndex: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: i === selectedIndex
      }))
    );
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { content: '', isCorrect: false }]);
  };

  const removeOption = (indexToRemove: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => {
      const next = prev.filter((_, i) => i !== indexToRemove);
      // Ensure at least one option is marked correct
      if (!next.some((o) => o.isCorrect)) {
        next[0].isCorrect = true;
      }
      return next;
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setValidationError('Nội dung câu hỏi là bắt buộc.');
      return;
    }

    const parsedScore = parseFloat(score);
    if (isNaN(parsedScore) || parsedScore <= 0 || parsedScore > 999.99) {
      setValidationError('Điểm số phải lớn hơn 0 và nhỏ hơn hoặc bằng 999.99.');
      return;
    }

    const parsedOrder = parseInt(orderIndex, 10);
    if (isNaN(parsedOrder) || parsedOrder < 0) {
      setValidationError('Thứ tự hiển thị phải lớn hơn hoặc bằng 0.');
      return;
    }

    // Type specific checks
    if (questionType === 'MultipleChoice') {
      if (options.length < 2) {
        setValidationError('Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn.');
        return;
      }
      for (let i = 0; i < options.length; i++) {
        if (!options[i].content.trim()) {
          setValidationError(`Nội dung đáp án ${getOptionBadgeLabel(i)} không được để trống.`);
          return;
        }
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        setValidationError('Vui lòng chọn chính xác một đáp án đúng.');
        return;
      }
    } else if (questionType === 'TrueFalse') {
      if (options.length !== 2) {
        setValidationError('Câu hỏi Đúng / Sai phải có chính xác 2 lựa chọn.');
        return;
      }
      if (!options[0].content.trim() || !options[1].content.trim()) {
        setValidationError('Nội dung của cả 2 lựa chọn Đúng / Sai là bắt buộc.');
        return;
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        setValidationError('Vui lòng chọn chính xác một lựa chọn là đáp án đúng.');
        return;
      }
    } else if (questionType === 'FillInBlank') {
      if (!correctTextAnswer.trim()) {
        setValidationError('Vui lòng nhập đáp án chính xác cho câu hỏi điền từ.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        content: trimmedContent,
        questionType,
        score: parsedScore,
        orderIndex: parsedOrder,
        correctTextAnswer: questionType === 'FillInBlank' ? correctTextAnswer.trim() : null,
        options:
          questionType !== 'FillInBlank'
            ? options.map((opt, i) => ({
                content: opt.content.trim(),
                isCorrect: opt.isCorrect,
                orderIndex: i + 1
              }))
            : undefined
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi lưu câu hỏi.';
      setValidationError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            {isEditing ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
          </h2>
          <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Đóng">
            &times;
          </button>
        </div>

        {validationError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger-text)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              border: '1px solid var(--status-danger-border)',
              marginBottom: '1rem'
            }}
          >
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Question Type */}
          <div style={formGroupStyle}>
            <label htmlFor="modal-qtype-select" style={labelStyle}>
              Loại câu hỏi <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              id="modal-qtype-select"
              value={questionType}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
              style={inputStyle}
            >
              <option value="MultipleChoice">Trắc nghiệm nhiều lựa chọn (MultipleChoice)</option>
              <option value="TrueFalse">Đúng / Sai (TrueFalse)</option>
              <option value="FillInBlank">Điền vào chỗ trống (FillInBlank)</option>
            </select>
          </div>

          {/* Question Content */}
          <div style={formGroupStyle}>
            <label htmlFor="modal-qcontent-input" style={labelStyle}>
              Nội dung câu hỏi <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              id="modal-qcontent-input"
              rows={3}
              placeholder="Nhập đề bài hoặc câu hỏi..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Score */}
            <div style={formGroupStyle}>
              <label htmlFor="modal-qscore-input" style={labelStyle}>
                Điểm số <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="modal-qscore-input"
                type="number"
                step="0.1"
                min="0.1"
                max="999.99"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {/* OrderIndex */}
            <div style={formGroupStyle}>
              <label htmlFor="modal-qorder-input" style={labelStyle}>
                Thứ tự hiển thị <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="modal-qorder-input"
                type="number"
                min="0"
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* MultipleChoice Editor */}
          {questionType === 'MultipleChoice' && (
            <div style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={labelStyle}>
                  Danh sách đáp án lựa chọn (Chọn 1 đáp án đúng) <span style={{ color: 'var(--color-danger)' }}>*</span>
                </span>
                <button
                  type="button"
                  onClick={addOption}
                  style={addOptionBtnStyle}
                >
                  + Thêm đáp án
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {options.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="radio"
                      name="correct-option-group"
                      checked={opt.isCorrect}
                      onChange={() => handleCorrectOptionChange(idx)}
                      title="Đánh dấu đây là đáp án đúng"
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    <span
                      style={{
                        minWidth: '28px',
                        padding: '0.25rem 0.4rem',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: opt.isCorrect ? 'var(--status-active-bg)' : 'var(--color-surface-subtle)',
                        color: opt.isCorrect ? 'var(--status-active-text)' : 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      {getOptionBadgeLabel(idx)}
                    </span>
                    <input
                      type="text"
                      placeholder={`Nội dung đáp án ${getOptionBadgeLabel(idx)}...`}
                      value={opt.content}
                      onChange={(e) => handleOptionContentChange(idx, e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        title="Xóa lựa chọn này"
                        style={removeOptionBtnStyle}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TrueFalse Editor */}
          {questionType === 'TrueFalse' && (
            <div style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={labelStyle}>
                Lựa chọn Đúng / Sai (Chọn 1 đáp án đúng) <span style={{ color: 'var(--color-danger)' }}>*</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.5rem' }}>
                {options.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="radio"
                      name="correct-tf-group"
                      checked={opt.isCorrect}
                      onChange={() => handleCorrectOptionChange(idx)}
                      title="Đánh dấu đáp án đúng"
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    <input
                      type="text"
                      placeholder="Nhãn lựa chọn (VD: Đúng, Sai)"
                      value={opt.content}
                      onChange={(e) => handleOptionContentChange(idx, e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FillInBlank Editor */}
          {questionType === 'FillInBlank' && (
            <div style={formGroupStyle}>
              <label htmlFor="modal-fib-input" style={labelStyle}>
                Đáp án chính xác (Text Answer) <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="modal-fib-input"
                type="text"
                placeholder="VD: photosynthesis"
                value={correctTextAnswer}
                onChange={(e) => setCorrectTextAnswer(e.target.value)}
                required
                style={inputStyle}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.375rem', lineHeight: 1.4 }}>
                ℹ️ Hệ thống tự động so khớp chính xác chuỗi ký tự (không phân biệt chữ hoa/thường, tự động loại bỏ khoảng trắng thừa hai đầu). Không áp dụng AI chấm điểm mờ.
              </div>
            </div>
          )}

          <div style={footerStyle}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={cancelBtnStyle}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={submitBtnStyle}
            >
              {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  width: '100%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '1.75rem',
  boxShadow: 'var(--shadow-xl)',
  border: '1px solid var(--color-border)'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.25rem'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: 'var(--color-text-secondary)',
  padding: '0.25rem'
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '1.125rem'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '0.375rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  boxSizing: 'border-box'
};

const addOptionBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.625rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface-subtle)',
  color: 'var(--color-primary)',
  border: '1px solid var(--color-border)',
  cursor: 'pointer'
};

const removeOptionBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.25rem',
  cursor: 'pointer',
  color: 'var(--color-danger)',
  padding: '0.25rem'
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '1.5rem'
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface-subtle)',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer'
};

const submitBtnStyle: React.CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer'
};
