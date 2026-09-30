import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AssignmentFilters } from '../../components/assignments/AssignmentFilters';
import { StudentAssignmentCard } from '../../components/assignments/StudentAssignmentCard';
import { Pagination } from '../../components/common/Pagination';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { assignmentService } from '../../services/assignment.service';
import type {
  AssignmentListItem,
  AssignmentStatus,
  StudentAssignmentQueryParams
} from '../../types/assignment.types';

export const StudentAssignmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Parse student query parameters
  const queryParams: StudentAssignmentQueryParams = React.useMemo(() => ({
    search: searchParams.get('search') || undefined,
    status: (searchParams.get('status') as AssignmentStatus) || undefined,
    sortBy: searchParams.get('sortBy') || 'deadline',
    sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc',
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '10', 10)
  }), [searchParams]);

  const updateUrlParams = useCallback(
    (newParams: Partial<StudentAssignmentQueryParams>) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          next.delete(key);
        } else {
          next.set(key, value.toString());
        }
      });

      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const fetchAssignments = useCallback(
    async (params: StudentAssignmentQueryParams) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const res = await assignmentService.getStudentAssignments(params, controller.signal);
        if (res.success && res.data) {
          setAssignments(res.data.items || []);
          setTotalItems(res.data.totalItems || 0);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'CanceledError') return;
        setError('Không thể tải danh sách bài tập. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssignments(queryParams);
    }, 0);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [queryParams, fetchAssignments]);

  const handleFilterChange = (partial: Partial<StudentAssignmentQueryParams>) => {
    updateUrlParams({
      ...partial,
      page: 1
    });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  return (
    <AppShell>
      <PageHeader
        title="Bài tập của tôi"
        subtitle="Danh sách bài tập được giao cho các lớp học bạn đang theo học hoặc đã hoàn thành."
      />

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#dc2626',
            borderRadius: 'var(--radius-md, 6px)',
            marginBottom: '1rem'
          }}
        >
          {error}
        </div>
      )}

      {/* Filters (No class dropdown) */}
      <AssignmentFilters
        filters={queryParams}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        isStudent
      />

      {/* Grid of Cards */}
      {isLoading ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface, #ffffff)',
            borderRadius: 'var(--radius-lg, 8px)',
            border: '1px solid var(--color-border, #e5e7eb)',
            color: 'var(--color-text-secondary, #6b7280)'
          }}
        >
          Đang tải bài tập của bạn...
        </div>
      ) : assignments.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface, #ffffff)',
            borderRadius: 'var(--radius-lg, 8px)',
            border: '1px solid var(--color-border, #e5e7eb)',
            color: 'var(--color-text-secondary, #6b7280)'
          }}
        >
          Không có bài tập nào phù hợp.
        </div>
      ) : (
        <div
          id="student-assignments-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {assignments.map((assignment) => (
            <StudentAssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && assignments.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <Pagination
            page={queryParams.page || 1}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={queryParams.pageSize || 10}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </AppShell>
  );
};
