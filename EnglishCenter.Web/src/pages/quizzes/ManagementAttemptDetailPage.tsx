import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { ManagementAttemptDetailCard } from '../../components/quizzes/ManagementAttemptDetailCard';
import { quizService } from '../../services/quiz.service';
import type { ManagementAttemptDetailResponse } from '../../types/quiz.types';
import { isManagementAttempt } from '../../utils/quizHelper';

export const ManagementAttemptDetailPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const location = useLocation();

  const getRoleBaseUrl = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
  };
  const roleBaseUrl = getRoleBaseUrl();

  const id = attemptId ? parseInt(attemptId, 10) : NaN;

  const [attempt, setAttempt] = useState<ManagementAttemptDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchDetail = useCallback(async () => {
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
        if (isManagementAttempt(res.data)) {
          setAttempt(res.data);
        } else {
          setErrorMessage('Không thể hiển thị bài làm: Định dạng dữ liệu không khớp quyền quản lý.');
        }
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Không thể tải chi tiết bài làm.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchDetail());
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchDetail]);

  const backUrl = attempt
    ? `${roleBaseUrl}/quizzes/${attempt.quizId}/attempts`
    : `${roleBaseUrl}/quizzes`;

  return (
    <AppShell>
      <PageHeader
        title={attempt ? `Bài làm: ${attempt.studentName}` : 'Chi tiết bài làm'}
        subtitle="Kiểm tra câu trả lời, đối soát đáp án và điểm số chấm tự động của học viên."
        breadcrumbs={[
          { label: 'Danh sách bài nộp', path: backUrl },
          { label: attempt ? `Bài làm: ${attempt.studentName}` : 'Chi tiết bài làm' }
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
            marginBottom: '1.25rem'
          }}
        >
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Đang tải chi tiết bài làm...
        </div>
      ) : attempt ? (
        <ManagementAttemptDetailCard attempt={attempt} />
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Không tìm thấy bài làm.
        </div>
      )}
    </AppShell>
  );
};
