import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { StudentMyAttemptsTable } from '../../components/quizzes/StudentMyAttemptsTable';
import { quizService } from '../../services/quiz.service';
import type { StudentAttemptSummaryResponse, StudentQuizDetailResponse } from '../../types/quiz.types';

export const StudentQuizAttemptHistoryPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const id = quizId ? parseInt(quizId, 10) : NaN;

  const [quiz, setQuiz] = useState<StudentQuizDetailResponse | null>(null);
  const [attempts, setAttempts] = useState<StudentAttemptSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (isNaN(id)) {
      setErrorMessage('Mã bài kiểm tra không hợp lệ.');
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

      const [quizRes, attRes] = await Promise.all([
        quizService.getQuizDetail(id, controller.signal),
        quizService.getMyAttempts(id, controller.signal)
      ]);

      if (quizRes.success && quizRes.data) {
        setQuiz(quizRes.data as StudentQuizDetailResponse);
      }
      if (attRes.success && attRes.data) {
        setAttempts(attRes.data);
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Không thể tải lịch sử làm bài.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [loadData]);

  return (
    <AppShell>
      <PageHeader
        title={`Lịch sử làm bài: ${quiz?.title || 'Bài kiểm tra'}`}
        subtitle={`Lớp: ${quiz?.classCode || '...'} • Đã làm ${attempts.length} / ${quiz?.maxAttempts || 1} lần`}
        breadcrumbs={[
          { label: 'Thông tin bài kiểm tra', path: `/student/quizzes/${id}` },
          { label: 'Lịch sử làm bài' }
        ]}
      />

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
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Đang tải lịch sử các lần làm bài...
        </div>
      ) : (
        <StudentMyAttemptsTable attempts={attempts} />
      )}
    </AppShell>
  );
};
