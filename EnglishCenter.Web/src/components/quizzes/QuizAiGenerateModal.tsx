import React, { useRef, useState } from 'react';
import axios from 'axios';
import { quizService } from '../../services/quiz.service';
import type {
  GeneratedQuizQuestionsResponse,
  QuestionType,
  QuizAiDifficulty,
  QuizAiLanguage,
  QuizAiSourceType
} from '../../types/quiz.types';
import { buildGeneratePayload, getAiErrorMessage } from '../../utils/quizAiHelper';
import { QuizAiSourceSelector } from './QuizAiSourceSelector';

export interface QuizAiGenerateModalProps {
  isOpen: boolean;
  quizId: number;
  quizCourseId: number;
  onClose: () => void;
  onGenerateSuccess: (result: GeneratedQuizQuestionsResponse) => void;
  onConflict?: () => void;
}

export const QuizAiGenerateModal: React.FC<QuizAiGenerateModalProps> = ({
  isOpen,
  quizId,
  quizCourseId,
  onClose,
  onGenerateSuccess,
  onConflict
}) => {
  // Form State
  const [sourceType, setSourceType] = useState<QuizAiSourceType>('Topic');
  const [topic, setTopic] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    'MultipleChoice',
    'TrueFalse',
    'FillInBlank'
  ]);
  const [difficulty, setDifficulty] = useState<QuizAiDifficulty>('Medium');
  const [language, setLanguage] = useState<QuizAiLanguage>('English');
  const [scorePerQuestion, setScorePerQuestion] = useState<number>(1.0);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // UI & Network State
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // In-flight guard to strictly prevent double-submit
  const isGeneratingRef = useRef(false);
  // Abort controller for clean cancellation on modal close
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!isOpen) return null;

  const handleSourceTypeChange = (type: QuizAiSourceType) => {
    setSourceType(type);
    setErrorMessage(null);
  };

  const handleLessonSelect = (lessonId: number | null) => {
    setSelectedLessonId(lessonId);
    setErrorMessage(null);
  };

  const handleToggleQuestionType = (type: QuestionType) => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Must keep at least one
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleClose = () => {
    // If request is in flight, abort it cleanly without error toast
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isGeneratingRef.current = false;
    setIsGenerating(false);
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Guard against duplicate click while generating
    if (isGeneratingRef.current || isGenerating) {
      return;
    }

    // 2. Client-side validation
    if (sourceType === 'Topic') {
      if (!topic.trim()) {
        setErrorMessage('Vui lòng nhập chủ đề kiến thức cho câu hỏi.');
        return;
      }
    } else {
      if (!selectedLessonId) {
        setErrorMessage('Vui lòng chọn một bài học có nội dung văn bản.');
        return;
      }
    }

    if (questionTypes.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một dạng câu hỏi.');
      return;
    }

    if (isNaN(questionCount) || questionCount < 1 || questionCount > 20) {
      setErrorMessage('Số lượng câu hỏi phải nằm trong khoảng từ 1 đến 20.');
      return;
    }

    if (isNaN(scorePerQuestion) || scorePerQuestion <= 0 || scorePerQuestion > 999.99) {
      setErrorMessage('Điểm mỗi câu phải lớn hơn 0 và không vượt quá 999.99.');
      return;
    }

    setErrorMessage(null);
    isGeneratingRef.current = true;
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const payload = buildGeneratePayload({
        sourceType,
        topic,
        lessonId: selectedLessonId,
        questionCount,
        questionTypes,
        difficulty,
        language,
        scorePerQuestion,
        additionalInstructions
      });

      const response = await quizService.generateAiQuestions(
        quizId,
        payload,
        controller.signal
      );

      if (response.success && response.data) {
        onGenerateSuccess(response.data);
        handleClose();
      } else {
        setErrorMessage(response.message || 'Không thể tạo câu hỏi từ hệ thống AI.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
        // Intentional cancellation: silent
        return;
      }

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409 && onConflict) {
          onConflict();
        }
      }

      setErrorMessage(getAiErrorMessage(err));
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-generate-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 50,
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '1.25rem' }}>✨</span>
            <h2
              id="ai-generate-modal-title"
              style={{
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)'
              }}
            >
              Tạo câu hỏi bằng AI
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng cửa sổ"
            disabled={isGenerating}
            style={{
              minWidth: '44px',
              minHeight: '44px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '1.25rem',
              color: 'var(--color-text-muted)',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              style={{
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger-text)',
                border: '1px solid var(--status-danger-border)',
                fontSize: '0.875rem'
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Source Selector (Topic vs Lesson) */}
          <QuizAiSourceSelector
            sourceType={sourceType}
            onSourceTypeChange={handleSourceTypeChange}
            topic={topic}
            onTopicChange={setTopic}
            selectedLessonId={selectedLessonId}
            onLessonSelect={handleLessonSelect}
            quizCourseId={quizCourseId}
            disabled={isGenerating}
          />

          {/* Question Count & Score Per Question */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}
          >
            {/* Question Count */}
            <div>
              <label
                htmlFor="ai-modal-q-count"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.375rem'
                }}
              >
                Số lượng câu (1 - 20) <span style={{ color: 'var(--status-danger-text)' }}>*</span>
              </label>
              <input
                id="ai-modal-q-count"
                type="number"
                min="1"
                max="20"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                disabled={isGenerating}
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

            {/* Score Per Question */}
            <div>
              <label
                htmlFor="ai-modal-q-score"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.375rem'
                }}
              >
                Điểm khởi tạo / câu <span style={{ color: 'var(--status-danger-text)' }}>*</span>
              </label>
              <input
                id="ai-modal-q-score"
                type="number"
                min="0.1"
                max="999.99"
                step="0.5"
                value={scorePerQuestion}
                onChange={(e) => setScorePerQuestion(parseFloat(e.target.value))}
                disabled={isGenerating}
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
          </div>

          {/* Question Types Checkboxes */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '0.375rem'
              }}
            >
              Dạng câu hỏi mong muốn <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.625rem'
              }}
            >
              {[
                { type: 'MultipleChoice' as const, label: 'Trắc nghiệm' },
                { type: 'TrueFalse' as const, label: 'Đúng / Sai' },
                { type: 'FillInBlank' as const, label: 'Điền từ' }
              ].map(({ type, label }) => {
                const checked = questionTypes.includes(type);
                return (
                  <label
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${
                        checked ? 'var(--color-primary-border)' : 'var(--color-border)'
                      }`,
                      backgroundColor: checked
                        ? 'var(--color-primary-subtle)'
                        : 'var(--color-surface)',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      minHeight: '44px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleQuestionType(type)}
                      disabled={isGenerating}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--color-primary)'
                      }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: checked ? 600 : 500 }}>
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Language Selects */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}
          >
            {/* Difficulty */}
            <div>
              <label
                htmlFor="ai-modal-difficulty"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.375rem'
                }}
              >
                Độ khó
              </label>
              <select
                id="ai-modal-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuizAiDifficulty)}
                disabled={isGenerating}
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
              >
                <option value="Easy">Dễ (Easy)</option>
                <option value="Medium">Trung bình (Medium)</option>
                <option value="Hard">Khó (Hard)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label
                htmlFor="ai-modal-language"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.375rem'
                }}
              >
                Ngôn ngữ câu hỏi
              </label>
              <select
                id="ai-modal-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as QuizAiLanguage)}
                disabled={isGenerating}
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
              >
                <option value="English">Tiếng Anh (English)</option>
                <option value="Vietnamese">Tiếng Việt (Vietnamese)</option>
              </select>
            </div>
          </div>

          {/* Additional Instructions */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.375rem'
              }}
            >
              <label
                htmlFor="ai-modal-instructions"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)'
                }}
              >
                Hướng dẫn bổ sung cho AI (tùy chọn)
              </label>
              <span
                style={{
                  fontSize: '0.75rem',
                  color:
                    additionalInstructions.length > 500
                      ? 'var(--status-danger-text)'
                      : 'var(--color-text-muted)'
                }}
              >
                {additionalInstructions.length}/500 ký tự
              </span>
            </div>
            <textarea
              id="ai-modal-instructions"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value.slice(0, 500))}
              placeholder="Ví dụ: Tập trung vào từ vựng liên quan đến kinh doanh, tránh câu hỏi phủ định..."
              disabled={isGenerating}
              maxLength={500}
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

          {/* Indeterminate Loading Progress Indicator */}
          {isGenerating && (
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                border: '1px solid var(--color-primary-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  animation: 'spin 1.2s linear infinite',
                  fontSize: '1.25rem'
                }}
              >
                ⏳
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                  Đang khởi tạo câu hỏi với mô hình AI...
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Quá trình có thể mất từ 5-15 giây tùy thuộc vào số lượng câu và nội dung bài học.
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--color-border)'
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              style={{
                minHeight: '44px',
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              style={{
                minHeight: '44px',
                padding: '0.625rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isGenerating ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                    ⏳
                  </span>
                  Đang tạo câu hỏi...
                </>
              ) : (
                <>
                  <span>✨</span> Bắt đầu tạo câu hỏi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
