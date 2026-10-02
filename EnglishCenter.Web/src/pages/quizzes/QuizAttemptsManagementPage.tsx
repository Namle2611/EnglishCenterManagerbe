import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Pagination } from '../../components/common/Pagination';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { ManagementAttemptTable } from '../../components/quizzes/ManagementAttemptTable';
import { quizService } from '../../services/quiz.service';
import type {
  QuizAttemptListItemResponse,
  QuizAttemptQueryParams,
  QuizAttemptStatus,
  QuizDetailResponse
} from '../../types/quiz.types';

export const QuizAttemptsManagementPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const getRoleBaseUrl = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
  };
  const roleBaseUrl = getRoleBaseUrl();

  const id = quizId ? parseInt(quizId, 10) : NaN;

  const [quiz, setQuiz] = useState<QuizDetailResponse | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptListItemResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filters: QuizAttemptQueryParams = React.useMemo(() => ({
    search: searchParams.get('search') || undefined,
    status: (searchParams.get('status') as QuizAttemptStatus) || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc',
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '10', 10)
  }), [searchParams]);

  const abortRef = useRef<AbortController | null>(null);

  const fetchAttempts = useCallback(async () => {
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
        quizService.getAttempts(id, filters, controller.signal)
      ]);

      if (quizRes.success && quizRes.data) {
        setQuiz(quizRes.data as QuizDetailResponse);
      }
      if (attRes.success && attRes.data) {
        setAttempts(attRes.data.items);
        setTotalItems(attRes.data.totalItems);
        setTotalPages(attRes.data.totalPages);
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách bài nộp.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id, filters]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchAttempts());
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchAttempts]);

  const updateFilters = (newParams: Partial<QuizAttemptQueryParams>) => {
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

  return (
    <AppShell>
      <PageHeader
        title={`Danh sách bài nộp: ${quiz?.title || 'Bài kiểm tra'}`}
        subtitle={`Lớp: ${quiz?.classCode || '...'} • Tổng số lượt làm: ${totalItems}`}
        breadcrumbs={[
          { label: 'Chi tiết bài kiểm tra', path: `${roleBaseUrl}/quizzes/${id}` },
          { label: 'Danh sách bài nộp' }
        ]}
      />

      {/* Filter toolbar */}
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
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên học viên..."
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
            onChange={(e) => updateFilters({ status: (e.target.value as QuizAttemptStatus) || undefined, page: 1 })}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="InProgress">Đang làm bài (InProgress)</option>
            <option value="Submitted">Đã nộp bài (Submitted)</option>
            <option value="Expired">Đã hết hạn (Expired)</option>
          </select>
        </div>

        <div>
          <select
            value={filters.sortBy || ''}
            onChange={(e) => updateFilters({ sortBy: e.target.value || undefined, page: 1 })}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Sắp xếp mặc định</option>
            <option value="startedat">Thời gian bắt đầu</option>
            <option value="submittedat">Thời gian nộp bài</option>
            <option value="score">Điểm số</option>
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
            marginBottom: '1.25rem'
          }}
        >
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Đang tải danh sách bài nộp...
        </div>
      ) : (
        <>
          <ManagementAttemptTable attempts={attempts} roleBaseUrl={roleBaseUrl} />

          {totalPages > 1 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <Pagination
                page={filters.page || 1}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={filters.pageSize || 10}
                onPageChange={(p) => updateFilters({ page: p })}
              />
            </div>
          )}
        </>
      )}
    </AppShell>
  );
};
