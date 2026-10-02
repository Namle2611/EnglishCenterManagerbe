import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { StudentAttemptTimer } from '../../components/quizzes/StudentAttemptTimer';
import { StudentLockedResultCard } from '../../components/quizzes/StudentLockedResultCard';
import { StudentQuestionTakingCard } from '../../components/quizzes/StudentQuestionTakingCard';
import { StudentReviewQuestionCard } from '../../components/quizzes/StudentReviewQuestionCard';
import { StudentSubmitConfirmModal } from '../../components/quizzes/StudentSubmitConfirmModal';
import { QuestionAnswerCoordinator, quizService } from '../../services/quiz.service';
import type {
  StudentAttemptDetailResponse,
  StudentAttemptReviewResponse,
  StudentOpenQuizResultResponse
} from '../../types/quiz.types';
import {
  formatScore,
  isStudentAttemptReview,
  isStudentAttemptTaking,
  isStudentOpenResult
} from '../../utils/quizHelper';

export const StudentQuizTakingPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();

  const id = attemptId ? parseInt(attemptId, 10) : NaN;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Discriminator states
  const [takingAttempt, setTakingAttempt] = useState<StudentAttemptDetailResponse | null>(null);
  const [lockedResult, setLockedResult] = useState<StudentOpenQuizResultResponse | null>(null);
  const [reviewResult, setReviewResult] = useState<StudentAttemptReviewResponse | null>(null);

  // Submit modal & submission state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Coordinators map for in-progress attempt questions
  const coordinatorsRef = useRef<Map<number, QuestionAnswerCoordinator>>(new Map());
  const [coordinators, setCoordinators] = useState<Map<number, QuestionAnswerCoordinator>>(new Map());
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const recalculateAnswered = (
    map: Map<number, QuestionAnswerCoordinator>,
    questions: Array<{ id: number; selectedOptionId: number | null; textAnswer: string | null }>
  ) => {
    let count = 0;
    questions.forEach((qn) => {
      const coord = map.get(qn.id);
      const opt = coord ? coord.latestLocalValue.selectedOptionId : qn.selectedOptionId;
      const text = coord ? coord.latestLocalValue.textAnswer : qn.textAnswer;
      if (opt !== null && opt !== undefined) {
        count++;
      } else if (text && text.trim().length > 0) {
        count++;
      }
    });
    return count;
  };

  const fetchAttempt = useCallback(async () => {
    if (isNaN(id)) {
      setErrorMessage('Mã bài làm không hợp lệ.');
      setIsLoading(false);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await quizService.getAttemptDetail(id, controller.signal);
      if (res.success && res.data) {
        const data = res.data;

        if (isStudentAttemptTaking(data)) {
          setTakingAttempt(data);
          setLockedResult(null);
          setReviewResult(null);

          const newMap = new Map<number, QuestionAnswerCoordinator>();
          // Initialize coordinators for questions
          data.questions.forEach((qn) => {
            let coord = coordinatorsRef.current.get(qn.id);
            if (!coord) {
              coord = new QuestionAnswerCoordinator(
                data.attemptId,
                qn.id,
                {
                  selectedOptionId: qn.selectedOptionId,
                  textAnswer: qn.textAnswer
                },
                () => {
                  setAnsweredCount(recalculateAnswered(coordinatorsRef.current, data.questions));
                }
              );
              coordinatorsRef.current.set(qn.id, coord);
            }
            newMap.set(qn.id, coord);
          });
          setCoordinators(newMap);
          setAnsweredCount(recalculateAnswered(newMap, data.questions));
        } else if (isStudentOpenResult(data)) {
          setLockedResult(data);
          setTakingAttempt(null);
          setReviewResult(null);
        } else if (isStudentAttemptReview(data)) {
          setReviewResult(data);
          setTakingAttempt(null);
          setLockedResult(null);
        } else {
          setErrorMessage('Không thể hiển thị bài làm: Định dạng dữ liệu không hợp lệ.');
        }
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Không thể tải bài làm.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchAttempt());
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchAttempt]);

  // Warn if navigating away with unsaved answers
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      let hasUnsaved = false;
      coordinatorsRef.current.forEach((c) => {
        if (c.saveStatus === 'unsaved' || c.isSaving) {
          hasUnsaved = true;
        }
      });
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  /**
   * Final sequential Submit Protocol:
   * 1. Lock Submit.
   * 2. Cancel all debounce timers.
   * 3. Enqueue all dirty latest answers.
   * 4. Await all per-question queues to settle.
   * 5. Verify every latest local answer is confirmed.
   * 6. If any failure, ABORT submit, show failing questions.
   * 7. Only then send single POST /submit.
   */
  const executeFinalSubmit = useCallback(async () => {
    if (isSubmitting || !takingAttempt) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Step 2 & 3 & 4: Flush debounces, enqueue dirty, await settlement
      const coords = Array.from(coordinatorsRef.current.values());
      for (const coord of coords) {
        coord.flushDebounce();
      }
      await Promise.all(coords.map((c) => c.waitForSettled()));

      // Step 5: Verify all confirmed
      const failedCoords = coords.filter((c) => c.saveStatus === 'error');
      if (failedCoords.length > 0) {
        setIsSubmitting(false);
        setSubmitError(
          `Không thể nộp bài vì có ${failedCoords.length} câu hỏi chưa thể lưu lên máy chủ. Vui lòng kiểm tra lại kết nối mạng và thử lại.`
        );
        return;
      }

      // Step 6: Dispatch single POST /submit
      const res = await quizService.submitAttempt(takingAttempt.attemptId);
      setIsSubmitModalOpen(false);

      if (res.success && res.data) {
        const data = res.data;
        if (isStudentAttemptReview(data)) {
          setReviewResult(data);
          setTakingAttempt(null);
        } else if (isStudentOpenResult(data)) {
          setLockedResult(data);
          setTakingAttempt(null);
        } else {
          // Re-fetch authoritative state
          void fetchAttempt();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Nộp bài kiểm tra thất bại.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, takingAttempt, fetchAttempt]);

  const handleTimerExpire = useCallback(async () => {
    // When countdown hits 0, trigger submit automatically
    if (!takingAttempt || isSubmitting) return;
    void executeFinalSubmit();
  }, [takingAttempt, isSubmitting, executeFinalSubmit]);

  return (
    <AppShell>
      {errorMessage && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--status-danger-border)',
            marginBottom: '1.5rem'
          }}
        >
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
          Đang tải bài làm...
        </div>
      ) : takingAttempt ? (
        /* STATE A: TAKING SCREEN (IN-PROGRESS) */
        <div style={{ maxWidth: '840px', margin: '0 auto', overflowX: 'hidden' }}>
          {/* Sticky Header Bar */}
          <div
            style={{
              position: 'sticky',
              top: '70px',
              zIndex: 100,
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              padding: '1rem 1.5rem',
              boxShadow: 'var(--shadow-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {takingAttempt.quizTitle}
              </h1>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                Lần làm thứ {takingAttempt.attemptNumber} &bull; {takingAttempt.questions.length} câu hỏi &bull; Thang điểm {takingAttempt.quizMaxScore}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <StudentAttemptTimer
                effectiveDeadline={takingAttempt.effectiveDeadline}
                onExpire={handleTimerExpire}
              />
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                disabled={isSubmitting}
                style={{
                  minHeight: '44px',
                  padding: '0.625rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-text-inverse)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                Nộp bài thi
              </button>
            </div>
          </div>

          {submitError && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger-text)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--status-danger-border)',
                marginBottom: '1.25rem'
              }}
            >
              ⚠️ {submitError}
            </div>
          )}

          {/* Question List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {takingAttempt.questions.map((qn, idx) => (
              <StudentQuestionTakingCard
                key={qn.id}
                question={qn}
                index={idx}
                coordinator={coordinators.get(qn.id)}
                disabled={isSubmitting}
              />
            ))}
          </div>

          {/* Bottom Submit Toolbar */}
          <div
            style={{
              marginTop: '1.5rem',
              marginBottom: '3rem',
              padding: '1.5rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Đã trả lời: <strong>{answeredCount} / {takingAttempt.questions.length}</strong> câu hỏi.
            </div>

            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              disabled={isSubmitting}
              style={{
                minHeight: '48px',
                padding: '0.75rem 2rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              Nộp bài kiểm tra &rarr;
            </button>
          </div>

          <StudentSubmitConfirmModal
            isOpen={isSubmitModalOpen}
            totalQuestions={takingAttempt.questions.length}
            answeredQuestions={answeredCount}
            isSubmitting={isSubmitting}
            onConfirm={executeFinalSubmit}
            onClose={() => setIsSubmitModalOpen(false)}
          />
        </div>
      ) : lockedResult ? (
        /* STATE B: LOCKED RESULT SCREEN */
        <div style={{ padding: '2rem 1rem' }}>
          <StudentLockedResultCard result={lockedResult} />
        </div>
      ) : reviewResult ? (
        /* STATE C: FULL REVIEW SCREEN */
        <div style={{ maxWidth: '840px', margin: '0 auto', overflowX: 'hidden' }}>
          <PageHeader
            title={`Kết quả: ${reviewResult.quizTitle}`}
            subtitle={`Lần làm thứ ${reviewResult.attemptNumber} • Xem lại câu trả lời và thang điểm chi tiết.`}
            breadcrumbs={[
              { label: 'Danh sách bài kiểm tra', path: '/student/quizzes' },
              { label: `Kết quả: ${reviewResult.quizTitle}` }
            ]}
          />

          {/* Score Header Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              padding: '2rem',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}
          >
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Tổng điểm bài kiểm tra
              </h2>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Hệ thống đã tự động chấm điểm cho {reviewResult.questions.length} câu hỏi.
              </div>
            </div>

            <div
              style={{
                padding: '1rem 2rem',
                backgroundColor: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                Điểm số đạt được
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                {formatScore(reviewResult.totalScore, reviewResult.quizMaxScore)}
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>
            Chi tiết từng câu hỏi ({reviewResult.questions.length} câu)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {reviewResult.questions.map((qn, idx) => (
              <StudentReviewQuestionCard key={qn.questionId} question={qn} index={idx} />
            ))}
          </div>

          <div style={{ marginTop: '2rem', marginBottom: '3rem', textAlign: 'center' }}>
            <Link
              to="/student/quizzes"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                fontSize: '0.9375rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Về danh sách bài kiểm tra &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
          Không tìm thấy bài làm.
        </div>
      )}
    </AppShell>
  );
};
