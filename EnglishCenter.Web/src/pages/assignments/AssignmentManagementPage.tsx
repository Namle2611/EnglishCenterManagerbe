import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AssignmentFilters } from '../../components/assignments/AssignmentFilters';
import { AssignmentFormModal } from '../../components/assignments/AssignmentFormModal';
import { AssignmentTable } from '../../components/assignments/AssignmentTable';
import { DeleteAssignmentModal } from '../../components/assignments/DeleteAssignmentModal';
import { Pagination } from '../../components/common/Pagination';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { assignmentService } from '../../services/assignment.service';
import type {
  AssignmentClassLookupItem,
  AssignmentListItem,
  AssignmentQueryParams,
  AssignmentStatus,
  CreateAssignmentPayload,
  UpdateAssignmentPayload
} from '../../types/assignment.types';

export const AssignmentManagementPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine role base URL
  const getRoleBaseUrl = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
  };
  const roleBaseUrl = getRoleBaseUrl();

  // State
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected class & read-only state for Section 11
  const [selectedClass, setSelectedClass] = useState<AssignmentClassLookupItem | null>(null);
  const isClassReadOnly = selectedClass?.status === 'Completed' || selectedClass?.status === 'Cancelled';

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentListItem | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<AssignmentListItem | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Extract query params from URL
  const queryParams: AssignmentQueryParams = React.useMemo(() => ({
    search: searchParams.get('search') || undefined,
    classId: searchParams.get('classId') ? parseInt(searchParams.get('classId')!, 10) : undefined,
    status: (searchParams.get('status') as AssignmentStatus) || undefined,
    dueFrom: searchParams.get('dueFrom') || undefined,
    dueTo: searchParams.get('dueTo') || undefined,
    sortBy: searchParams.get('sortBy') || 'deadline',
    sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc',
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '10', 10)
  }), [searchParams]);

  const updateUrlParams = useCallback(
    (newParams: Partial<AssignmentQueryParams>) => {
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

  // Fetch assignments with AbortController
  const fetchAssignments = useCallback(
    async (params: AssignmentQueryParams) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const res = await assignmentService.getAssignments(params, controller.signal);
        if (res.success && res.data) {
          setAssignments(res.data.items || []);
          setTotalItems(res.data.totalItems || 0);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'CanceledError') {
          return;
        }
        setError('Không thể tải danh sách bài tập. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger fetch whenever queryParams change (wrapped in setTimeout to satisfy linter)
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

  const handleFilterChange = (partial: Partial<AssignmentQueryParams>) => {
    updateUrlParams({
      ...partial,
      page: 1
    });
  };

  // Sync selectedClass from queryParams.classId if needed
  useEffect(() => {
    if (queryParams.classId) {
      if (!selectedClass || (selectedClass.classId || selectedClass.id) !== queryParams.classId) {
        assignmentService.getClassLookup({ classId: queryParams.classId, page: 1, pageSize: 1 }).then((res) => {
          if (res.success && res.data) {
            const found = res.data.items?.find((c) => (c.classId || c.id) === queryParams.classId) || res.data.items?.[0];
            if (found) setSelectedClass(found);
          }
        }).catch(() => {});
      }
    } else if (!queryParams.classId && selectedClass) {
      const t = setTimeout(() => setSelectedClass(null), 0);
      return () => clearTimeout(t);
    }
  }, [queryParams.classId, selectedClass]);

  const handleResetFilters = () => {
    setSelectedClass(null);
    setSearchParams(new URLSearchParams());
  };

  const handleSortChange = (column: string) => {
    const isCurrent = queryParams.sortBy?.toLowerCase() === column.toLowerCase();
    const newDir = isCurrent && queryParams.sortDirection === 'asc' ? 'desc' : 'asc';
    updateUrlParams({
      sortBy: column,
      sortDirection: newDir,
      page: 1
    });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  // Create Assignment
  const handleCreateAssignment = async (payload: CreateAssignmentPayload) => {
    await assignmentService.createAssignment(payload);
    fetchAssignments(queryParams);
  };

  // Update Assignment
  const handleUpdateAssignment = async (id: number, payload: UpdateAssignmentPayload) => {
    await assignmentService.updateAssignment(id, payload);
    fetchAssignments(queryParams);
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id: number) => {
    await assignmentService.deleteAssignment(id);
    fetchAssignments(queryParams);
  };

  return (
    <AppShell>
      <PageHeader
        title={user?.roles.includes('TEACHER') ? 'Danh sách bài tập' : 'Quản lý bài tập'}
        subtitle="Quản lý bài tập của các lớp học, theo dõi hạn nộp và tổng hợp bài nộp của học viên."
        actions={
          <button
            id="btn-create-assignment"
            type="button"
            disabled={isClassReadOnly}
            onClick={() => !isClassReadOnly && setIsCreateModalOpen(true)}
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: isClassReadOnly ? 'var(--color-surface-subtle, #9ca3af)' : 'var(--color-primary, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md, 6px)',
              cursor: isClassReadOnly ? 'not-allowed' : 'pointer',
              opacity: isClassReadOnly ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            title={isClassReadOnly ? 'Không thể tạo bài tập cho lớp học đã kết thúc hoặc bị hủy' : undefined}
          >
            <span>+</span>
            <span>Tạo bài tập mới</span>
          </button>
        }
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

      {/* Historical Class Banner for Completed / Cancelled classes */}
      {isClassReadOnly && (
        <div
          id="historical-class-banner"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: '#b45309',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md, 6px)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>ℹ️</span>
          <span>
            Lớp học đang ở trạng thái <strong>{selectedClass?.status === 'Completed' ? 'Đã kết thúc' : 'Đã hủy'}</strong>. Chế độ chỉ đọc: không thể tạo, chỉnh sửa hoặc xóa bài tập.
          </span>
        </div>
      )}

      {/* Filters */}
      <AssignmentFilters
        filters={queryParams}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onClassChange={(_, item) => setSelectedClass(item || null)}
      />

      {/* Table */}
      <AssignmentTable
        assignments={assignments}
        isLoading={isLoading}
        roleBaseUrl={roleBaseUrl}
        sortBy={queryParams.sortBy}
        sortDirection={queryParams.sortDirection}
        onSortChange={handleSortChange}
        onEdit={(a) => setEditingAssignment(a)}
        onDelete={(a) => setDeletingAssignment(a)}
        isClassReadOnly={isClassReadOnly}
      />

      {/* Pagination */}
      {!isLoading && assignments.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <Pagination
            page={queryParams.page || 1}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={queryParams.pageSize || 10}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Create Modal */}
      <AssignmentFormModal
        isOpen={isCreateModalOpen}
        defaultClassId={queryParams.classId}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmitCreate={handleCreateAssignment}
      />

      {/* Edit Modal */}
      <AssignmentFormModal
        isOpen={!!editingAssignment}
        onClose={() => setEditingAssignment(null)}
        initialData={editingAssignment}
        onSubmitUpdate={handleUpdateAssignment}
      />

      {/* Delete Modal */}
      <DeleteAssignmentModal
        isOpen={!!deletingAssignment}
        onClose={() => setDeletingAssignment(null)}
        assignment={deletingAssignment}
        onConfirm={handleDeleteAssignment}
      />
    </AppShell>
  );
};
