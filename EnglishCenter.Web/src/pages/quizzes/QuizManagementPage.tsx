import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Pagination } from '../../components/common/Pagination';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { DeleteQuizModal } from '../../components/quizzes/DeleteQuizModal';
import { QuizFilters } from '../../components/quizzes/QuizFilters';
import { QuizFormModal } from '../../components/quizzes/QuizFormModal';
import { QuizTable } from '../../components/quizzes/QuizTable';
import { quizService } from '../../services/quiz.service';
import type {
  QuizListItemResponse,
  QuizQueryParams,
  TeacherQuizClassLookupItemResponse
} from '../../types/quiz.types';

export const QuizManagementPage: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const getRoleBaseUrl = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
  };
  const roleBaseUrl = getRoleBaseUrl();

  // Parse filters from URL
  const filters: QuizQueryParams = React.useMemo(() => ({
    search: searchParams.get('search') || undefined,
    classId: searchParams.get('classId') ? parseInt(searchParams.get('classId')!, 10) : undefined,
    status: searchParams.get('status') || undefined,
    fromDate: searchParams.get('fromDate') || undefined,
    toDate: searchParams.get('toDate') || undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc',
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '10', 10)
  }), [searchParams]);

  const [quizzes, setQuizzes] = useState<QuizListItemResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Classes for lookup dropdown
  const [classes, setClasses] = useState<TeacherQuizClassLookupItemResponse[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<QuizListItemResponse | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<QuizListItemResponse | null>(null);

  const listAbortRef = useRef<AbortController | null>(null);

  // Fetch classes lookup on mount
  useEffect(() => {
    let isCancelled = false;
    const loadClasses = async () => {
      try {
        setIsLoadingClasses(true);
        const res = await quizService.getTeacherClassLookup({ page: 1, pageSize: 100 });
        if (!isCancelled && res.success && res.data) {
          setClasses(res.data.items);
        }
      } catch {
        // Ignore
      } finally {
        if (!isCancelled) setIsLoadingClasses(false);
      }
    };
    loadClasses();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Fetch quizzes with AbortController
  const fetchQuizzes = useCallback(async (currentFilters: QuizQueryParams) => {
    if (listAbortRef.current) {
      listAbortRef.current.abort();
    }
    const controller = new AbortController();
    listAbortRef.current = controller;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await quizService.getQuizzes(currentFilters, controller.signal);
      if (res.success && res.data) {
        setQuizzes(res.data.items);
        setTotalItems(res.data.totalItems);
        setTotalPages(res.data.totalPages);
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
        return; // Silent cancellation
      }
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách bài kiểm tra.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => fetchQuizzes(filters));
    return () => {
      if (listAbortRef.current) {
        listAbortRef.current.abort();
      }
    };
  }, [filters, fetchQuizzes]);

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

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleCreateOpen = () => {
    setQuizToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEditOpen = (quiz: QuizListItemResponse) => {
    setQuizToEdit(quiz);
    setIsFormModalOpen(true);
  };

  const handleDeleteOpen = (quiz: QuizListItemResponse) => {
    setQuizToDelete(quiz);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (formData: {
    classId: number;
    title: string;
    description: string;
    durationMinutes: number | null;
    maxAttempts: number;
    startAt: string;
    endAt: string;
  }) => {
    if (quizToEdit) {
      await quizService.updateQuiz(quizToEdit.id, formData);
    } else {
      await quizService.createQuiz(formData);
    }
    fetchQuizzes(filters);
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;
    await quizService.deleteQuiz(quizToDelete.id);
    fetchQuizzes(filters);
  };

  return (
    <AppShell>
      <PageHeader
        title="Quản lý bài kiểm tra"
        subtitle="Soạn thảo, quản lý bài kiểm tra, ngân hàng câu hỏi và theo dõi kết quả làm bài của học viên."
        actions={
          <button
            type="button"
            onClick={handleCreateOpen}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>+</span> Tạo bài kiểm tra
          </button>
        }
      />

      <QuizFilters
        filters={filters}
        classes={classes}
        isLoadingClasses={isLoadingClasses}
        onFilterChange={updateFilters}
        onReset={handleResetFilters}
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
          Đang tải danh sách bài kiểm tra...
        </div>
      ) : (
        <>
          <QuizTable
            quizzes={quizzes}
            roleBaseUrl={roleBaseUrl}
            onEdit={handleEditOpen}
            onDelete={handleDeleteOpen}
          />

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

      <QuizFormModal
        isOpen={isFormModalOpen}
        quizToEdit={quizToEdit}
        classes={classes}
        onSubmit={handleFormSubmit}
        onClose={() => setIsFormModalOpen(false)}
      />

      <DeleteQuizModal
        isOpen={isDeleteModalOpen}
        quiz={quizToDelete}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </AppShell>
  );
};
