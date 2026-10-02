import React from 'react';
import type { ManagementAttemptDetailResponse } from '../../types/quiz.types';
import { formatDateTime, formatScore, getOptionBadgeLabel, getQuestionTypeLabel } from '../../utils/quizHelper';
import { QuizAttemptStatusBadge } from './QuizAttemptStatusBadge';

interface ManagementAttemptDetailCardProps {
  attempt: ManagementAttemptDetailResponse;
}

export const ManagementAttemptDetailCard: React.FC<ManagementAttemptDetailCardProps> = ({ attempt }) => {
  return (
    <div>
      {/* Overview Card */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '1.5rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Chi tiết bài làm: {attempt.quizTitle}
              </h1>
              <QuizAttemptStatusBadge status={attempt.status} />
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Học viên: <strong style={{ color: 'var(--color-text-primary)' }}>{attempt.studentName}</strong> (Mã: {attempt.studentCode}) &bull; Lớp: <strong>{attempt.classCode}</strong> &bull; Lần nộp thứ {attempt.attemptNumber}
            </div>
          </div>

          <div
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Điểm đạt được
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.2rem' }}>
              {formatScore(attempt.score, attempt.quizMaxScore)}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          <div>
            Bắt đầu làm bài: <strong>{formatDateTime(attempt.startedAt)}</strong>
          </div>
          <div>
            Nộp bài lúc: <strong>{attempt.submittedAt ? formatDateTime(attempt.submittedAt) : 'Chưa nộp (Đang diễn ra)'}</strong>
          </div>
        </div>
      </div>

      {/* Questions Review Section */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
        Danh sách câu trả lời của học viên ({attempt.questions.length} câu)
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {attempt.questions.map((qn, idx) => {
          const isCorrect = qn.isCorrect === true;

          return (
            <div
              key={qn.questionId}
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                padding: '1.25rem 1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Question Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                    Câu {idx + 1}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    ({getQuestionTypeLabel(qn.questionType)})
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

                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {qn.scoreEarned} / {qn.score} điểm
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  marginBottom: '1rem',
                  lineHeight: 1.6,
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
                  {qn.options.map((opt, optIdx) => {
                    const isSelectedByStudent = opt.id === qn.selectedOptionId;
                    const isCorrectAnswer = opt.isCorrect;

                    let rowBg = 'transparent';
                    let border = '1px solid transparent';
                    if (isSelectedByStudent && isCorrectAnswer) {
                      rowBg = 'rgba(16, 185, 129, 0.1)';
                      border = '1px solid rgba(16, 185, 129, 0.3)';
                    } else if (isSelectedByStudent && !isCorrectAnswer) {
                      rowBg = 'rgba(239, 68, 68, 0.1)';
                      border = '1px solid rgba(239, 68, 68, 0.3)';
                    } else if (!isSelectedByStudent && isCorrectAnswer) {
                      rowBg = 'rgba(16, 185, 129, 0.05)';
                      border = '1px dashed rgba(16, 185, 129, 0.3)';
                    }

                    return (
                      <div
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          padding: '0.4rem 0.6rem',
                          borderRadius: 'var(--radius-md)',
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
                            backgroundColor: isCorrectAnswer ? 'var(--status-active-bg)' : 'var(--color-surface)',
                            color: isCorrectAnswer ? 'var(--status-active-text)' : 'var(--color-text-secondary)',
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
                              Học viên chọn
                            </span>
                          )}
                          {isCorrectAnswer && (
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

              {/* FillInBlank Text Review */}
              {qn.questionType === 'FillInBlank' && (
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-subtle)',
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)', width: '160px' }}>
                      Câu trả lời của học viên:
                    </span>
                    <strong style={{ color: isCorrect ? 'var(--status-active-text)' : 'var(--status-danger-text)' }}>
                      {qn.textAnswer ? qn.textAnswer : '(Bỏ trống)'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)', width: '160px' }}>
                      Đáp án chính xác:
                    </span>
                    <code style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {qn.correctTextAnswer}
                    </code>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
