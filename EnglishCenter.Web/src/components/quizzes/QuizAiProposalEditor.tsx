import React, { useRef, useState } from 'react';
import axios from 'axios';
import { quizService } from '../../services/quiz.service';
import type {
  GeneratedQuizQuestionItemResponse,
  GeneratedQuizQuestionsResponse
} from '../../types/quiz.types';
import {
  buildApplyPayload,
  getAiErrorMessage,
  reorderProposal,
  validateProposal
} from '../../utils/quizAiHelper';
import { QuizAiQuestionCard } from './QuizAiQuestionCard';

export interface QuizAiProposalEditorProps {
  quizId: number;
  proposal: GeneratedQuizQuestionsResponse;
  onApplySuccess: () => void;
  onRegenerateRequest: () => void;
  onDiscard: () => void;
  onNetworkUncertain: () => void;
  onConflict: () => void;
}

export const QuizAiProposalEditor: React.FC<QuizAiProposalEditorProps> = ({
  quizId,
  proposal,
  onApplySuccess,
  onRegenerateRequest,
  onDiscard,
  onNetworkUncertain,
  onConflict
}) => {
  const [questions, setQuestions] = useState<GeneratedQuizQuestionItemResponse[]>(() => [
    ...proposal.questions
  ]);
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [uncertainAlert, setUncertainAlert] = useState<string | null>(null);

  // In-flight double-submit guard
  const isApplyingRef = useRef(false);

  const handleQuestionChange = (index: number, updated: GeneratedQuizQuestionItemResponse) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
    setIsDirty(true);
    setValidationErrors([]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setQuestions((prev) => reorderProposal(prev, index, index - 1));
    setIsDirty(true);
    setValidationErrors([]);
  };

  const handleMoveDown = (index: number) => {
    if (index >= questions.length - 1) return;
    setQuestions((prev) => reorderProposal(prev, index, index + 1));
    setIsDirty(true);
    setValidationErrors([]);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
    setValidationErrors([]);
  };

  // Safe discard handler with dirty protection
  const handleDiscardClick = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'Đề xuất câu hỏi AI có những chỉnh sửa chưa được lưu. Bạn có chắc muốn hủy bỏ đề xuất này?'
      );
      if (!confirmed) return;
    }
    onDiscard();
  };

  // Safe regenerate handler with dirty protection
  const handleRegenerateClick = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'Đề xuất hiện tại có các chỉnh sửa chưa lưu. Bạn có chắc muốn tạo lại và bỏ qua các chỉnh sửa này?'
      );
      if (!confirmed) return;
    }
    onRegenerateRequest();
  };

  // Submit Apply to backend
  const handleApply = async () => {
    // 1. In-flight guard to prevent duplicate POST on double-click
    if (isApplyingRef.current || isApplying) {
      return;
    }

    // 2. Validate proposal locally first
    const valResult = validateProposal(questions);
    if (!valResult.isValid) {
      setValidationErrors(valResult.errors);
      return;
    }

    setValidationErrors([]);
    setErrorMessage(null);
    setUncertainAlert(null);

    isApplyingRef.current = true;
    setIsApplying(true);

    try {
      const payload = buildApplyPayload(questions);
      const res = await quizService.applyAiQuestions(quizId, payload);

      if (res.success) {
        onApplySuccess();
      } else {
        setErrorMessage(res.message || 'Không thể lưu câu hỏi vào bài kiểm tra.');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 409) {
          // Attempt race or immutable state
          setErrorMessage(
            'Trạng thái bài kiểm tra đã thay đổi hoặc đã có lượt làm bài từ học viên. Không thể lưu thay đổi.'
          );
          onConflict();
          return;
        }

        if (status === 403) {
          setErrorMessage('Bạn không có quyền áp dụng câu hỏi cho bài kiểm tra này.');
          onConflict();
          return;
        }

        if (status === 400) {
          // Contextual validation error: keep proposal so user can correct it
          const data = err.response?.data as { message?: string } | undefined;
          setErrorMessage(
            data?.message || 'Dữ liệu câu hỏi không hợp lệ theo yêu cầu của hệ thống.'
          );
          return;
        }

        // Network error / timeout / disconnect: Uncertain completion state!
        // DO NOT retry automatically. Inform user and refresh authoritative questions.
        if (!err.response || status === 504 || err.code === 'ECONNABORTED') {
          setUncertainAlert(
            'Kết quả lưu chưa xác định do mất kết nối hoặc quá thời gian phản hồi. Hệ thống đã làm mới danh sách câu hỏi để bạn kiểm tra trạng thái thực tế. Vui lòng KHÔNG nhấn lưu lại liên tiếp.'
          );
          onNetworkUncertain();
          return;
        }
      }

      setErrorMessage(getAiErrorMessage(err));
    } finally {
      isApplyingRef.current = false;
      setIsApplying(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}
    >
      {/* Transient Proposal Notice Banner */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-primary-subtle)',
          border: '1.5px solid var(--color-primary-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.25rem' }}>✨</span>
          <strong
            style={{
              fontSize: '1rem',
              color: 'var(--color-primary)'
            }}
          >
            Đề xuất từ AI — Chưa được lưu vào bài kiểm tra
          </strong>
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          {proposal.sourceSummary
            ? `Nguồn tạo: ${proposal.sourceSummary}. `
            : 'Đề xuất câu hỏi được tạo từ mô hình AI. '}
          Bạn có thể kiểm tra, chỉnh sửa nội dung, thang điểm hoặc loại bỏ câu hỏi trước khi nhấn
          lưu.
        </div>
      </div>

      {/* Warnings Banner (Lesson truncation, etc.) */}
      {proposal.warnings && proposal.warnings.length > 0 && (
        <div
          role="alert"
          style={{
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-warning-bg)',
            color: 'var(--status-warning-text)',
            border: '1px solid var(--status-warning-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <span>⚠️</span>
            <span>Lưu ý từ hệ thống AI:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem' }}>
            {proposal.warnings.map((warn, wIdx) => (
              <li key={wIdx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Network Uncertain Alert */}
      {uncertainAlert && (
        <div
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-warning-bg)',
            color: 'var(--status-warning-text)',
            border: '2px solid var(--status-warning-border)',
            fontSize: '0.875rem',
            lineHeight: 1.5
          }}
        >
          <strong>⚠️ {uncertainAlert}</strong>
        </div>
      )}

      {/* General Error Message */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '0.875rem 1.25rem',
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

      {/* Validation Errors List */}
      {validationErrors.length > 0 && (
        <div
          role="alert"
          style={{
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            border: '1px solid var(--status-danger-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          <strong style={{ fontSize: '0.875rem' }}>
            Vui lòng kiểm tra lại các câu hỏi trước khi lưu:
          </strong>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem' }}>
            {validationErrors.map((err, errIdx) => (
              <li key={errIdx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Proposal Question Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {questions.map((q, idx) => (
          <QuizAiQuestionCard
            key={q.tempId}
            question={q}
            index={idx}
            totalCount={questions.length}
            onChange={(updated) => handleQuestionChange(idx, updated)}
            onDelete={() => handleDeleteQuestion(idx)}
            onMoveUp={() => handleMoveUp(idx)}
            onMoveDown={() => handleMoveDown(idx)}
            disabled={isApplying}
          />
        ))}
      </div>

      {/* Action Footer: Apply, Regenerate, Discard */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--color-border)'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Discard */}
          <button
            type="button"
            onClick={handleDiscardClick}
            disabled={isApplying}
            style={{
              minHeight: '44px',
              padding: '0.625rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isApplying ? 'not-allowed' : 'pointer'
            }}
          >
            Hủy đề xuất
          </button>

          {/* Regenerate */}
          <button
            type="button"
            onClick={handleRegenerateClick}
            disabled={isApplying}
            style={{
              minHeight: '44px',
              padding: '0.625rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-primary-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isApplying ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <span>🔄</span> Tạo lại câu hỏi khác
          </button>
        </div>

        {/* Apply Button */}
        <button
          type="button"
          onClick={handleApply}
          disabled={isApplying || questions.length === 0}
          style={{
            minHeight: '44px',
            padding: '0.625rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: isApplying || questions.length === 0 ? 'not-allowed' : 'pointer',
            opacity: isApplying ? 0.7 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {isApplying ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                ⏳
              </span>
              Đang lưu vào bài kiểm tra...
            </>
          ) : (
            <>
              <span>💾</span> Áp dụng vào bài kiểm tra ({questions.length} câu)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
