import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Pagination } from '../../components/common/Pagination';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { StudentQuizCard } from '../../components/quizzes/StudentQuizCard';
import { quizService } from '../../services/quiz.service';
import type { QuizListItemResponse, QuizQueryParams, QuizStatus } from '../../types/quiz.types';

export const StudentQuizListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: QuizQueryParams = React.useMemo(() => ({
    search: searchParams.get('search') || undefined,
    status: (searchParams.get('status') as QuizStatus) || undefined,
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '12', 10)
  }), [searchParams]);

  const [quizzes, setQuizzes] = useState<QuizListItemResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingId, setIsStartingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchQuizzes = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await quizService.getQuizzes(filters, controller.signal);
      if (res.success && res.data) {
        setQuizzes(res.data.items);
        setTotalItems(res.data.totalItems);
        setTotalPages(res.data.totalPages);
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách bài kiểm tra.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchQuizzes());
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchQuizzes]);

  const updateFilters = (newParams: Partial<QuizQueryParams>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') {
        updated.delete(k);
      } else {
        updated.set(k, String(v));
      }
    });
    setSearchParams(updated);
  };

  const handleStartOrResume = async (quizId: number) => {
    if (isStartingId !== null) return;
    try {
      setIsStartingId(quizId);
      setErrorMessage(null);
      const res = await quizService.startAttempt(quizId);
      if (res.success && res.data?.attemptId) {
        navigate(`/student/quiz-attempts/${res.data.attemptId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể bắt đầu lượt làm bài.';
      setErrorMessage(msg);
      fetchQuizzes();
    } finally {
      setIsStartingId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Bài kiểm tra của tôi"
        subtitle="Danh sách các bài kiểm tra trực tuyến được phân công theo lớp học của bạn."
      />

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Tìm theo tiêu đề bài kiểm tra..."
            value={filters.search || ''}
            onChange={(e) => updateFilters({ search: e.target.value, page: 1 })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div>
          <select
            value={filters.status || ''}
            onChange={(e) => updateFilters({ status: (e.target.value as QuizStatus) || undefined, page: 1 })}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Published">Đang mở (Published)</option>
            <option value="Closed">Đã đóng (Closed)</option>
          </select>
        </div>
      </div>

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
          Đang tải danh sách bài kiểm tra...
        </div>
      ) : quizzes.length === 0 ? (
        <div
          style={{
            padding: '4rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📚</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
            Hiện tại bạn chưa có bài kiểm tra nào
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            Khi giảng viên mở bài kiểm tra cho lớp học của bạn, thông tin bài thi sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            {quizzes.map((quiz) => (
              <StudentQuizCard
                key={quiz.id}
                quiz={quiz}
                isStarting={isStartingId === quiz.id}
                onStartOrResume={handleStartOrResume}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <Pagination
                page={filters.page || 1}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={filters.pageSize || 12}
                onPageChange={(p) => updateFilters({ page: p })}
              />
            </div>
          )}
        </>
      )}
    </AppShell>
  );
};
