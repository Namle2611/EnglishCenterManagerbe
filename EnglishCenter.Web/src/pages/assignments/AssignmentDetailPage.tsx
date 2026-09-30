import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AssignmentDetailCard } from '../../components/assignments/AssignmentDetailCard';
import { AssignmentFormModal } from '../../components/assignments/AssignmentFormModal';
import { DeleteAssignmentModal } from '../../components/assignments/DeleteAssignmentModal';
import { SubmissionFilterBar } from '../../components/assignments/SubmissionFilterBar';
import { SubmissionTable } from '../../components/assignments/SubmissionTable';
import { Pagination } from '../../components/common/Pagination';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { assignmentService } from '../../services/assignment.service';
import type {
  AssignmentDetail,
  SubmissionListItem,
  SubmissionQueryParams,
  UpdateAssignmentPayload
} from '../../types/assignment.types';

export const AssignmentDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const getRoleBaseUrl = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
  };
  const roleBaseUrl = getRoleBaseUrl();

  const id = assignmentId ? parseInt(assignmentId, 10) : NaN;

  // Assignment detail state
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submissions state
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [totalSubmissionPages, setTotalSubmissionPages] = useState(1);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const submissionsAbortRef = useRef<AbortController | null>(null);

  // Parse submission query parameters
  const submissionFilters: SubmissionQueryParams = React.useMemo(() => ({
    search: searchParams.get('subSearch') || undefined,
    isLate: searchParams.get('isLate') === 'true' ? true : searchParams.get('isLate') === 'false' ? false : undefined,
    isGraded: searchParams.get('isGraded') === 'true' ? true : searchParams.get('isGraded') === 'false' ? false : undefined,
    sortBy: searchParams.get('sortBy') || 'submittedat',
    sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc',
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '10', 10)
  }), [searchParams]);

  const updateSubmissionFilters = (newParams: Partial<SubmissionQueryParams>) => {
    const next = new URLSearchParams(searchParams);
    if (newParams.search !== undefined) {
      if (newParams.search) next.set('subSearch', newParams.search);
      else next.delete('subSearch');
    }
    if (newParams.isLate !== undefined) {
      next.set('isLate', newParams.isLate.toString());
    } else if (newParams.isLate === undefined && 'isLate' in newParams) {
      next.delete('isLate');
    }
    if (newParams.isGraded !== undefined) {
      next.set('isGraded', newParams.isGraded.toString());
    } else if (newParams.isGraded === undefined && 'isGraded' in newParams) {
      next.delete('isGraded');
    }
    if (newParams.sortBy) next.set('sortBy', newParams.sortBy);
    if (newParams.sortDirection) next.set('sortDirection', newParams.sortDirection);
    if (newParams.page) next.set('page', newParams.page.toString());

    setSearchParams(next);
  };

  // Fetch assignment detail
  const fetchDetail = useCallback(async () => {
    if (isNaN(id) || id <= 0) {
      setError('Mã bài tập không hợp lệ.');
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await assignmentService.getAssignmentById(id, controller.signal);
      if (res.success && res.data) {
        setAssignment(res.data);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'CanceledError') return;
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axErr.response?.status === 404) {
          setError('Không tìm thấy bài tập hoặc bài tập đã bị xóa.');
        } else if (axErr.response?.status === 403) {
          setError('Bạn không có quyền truy cập bài tập này.');
        } else {
          setError(axErr.response?.data?.message || 'Không thể tải thông tin bài tập.');
        }
      } else {
        setError('Không thể tải thông tin bài tập.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch submissions list
  const fetchSubmissions = useCallback(
    async (params: SubmissionQueryParams) => {
      if (isNaN(id) || id <= 0) return;

      if (submissionsAbortRef.current) {
        submissionsAbortRef.current.abort();
      }
      const controller = new AbortController();
      submissionsAbortRef.current = controller;

      setIsLoadingSubmissions(true);

      try {
        const res = await assignmentService.getSubmissions(id, params, controller.signal);
        if (res.success && res.data) {
          setSubmissions(res.data.items || []);
          setTotalSubmissions(res.data.totalItems || 0);
          setTotalSubmissionPages(res.data.totalPages || 1);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'CanceledError') return;
      } finally {
        setIsLoadingSubmissions(false);
      }
    },
    [id]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDetail();
    }, 0);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDetail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubmissions(submissionFilters);
    }, 0);

    return () => {
      clearTimeout(timer);
      if (submissionsAbortRef.current) {
        submissionsAbortRef.current.abort();
      }
    };
  }, [submissionFilters, fetchSubmissions]);

  // Update Assignment
  const handleUpdate = async (targetId: number, payload: UpdateAssignmentPayload) => {
    await assignmentService.updateAssignment(targetId, payload);
    fetchDetail();
  };

  // Delete Assignment
  const handleDelete = async (targetId: number) => {
    await assignmentService.deleteAssignment(targetId);
    navigate(`${roleBaseUrl}/assignments`, { replace: true });
  };

  const handleSortChange = (column: string) => {
    const isCurrent = submissionFilters.sortBy?.toLowerCase() === column.toLowerCase();
    const newDir = isCurrent && submissionFilters.sortDirection === 'asc' ? 'desc' : 'asc';
    updateSubmissionFilters({
      sortBy: column,
      sortDirection: newDir,
      page: 1
    });
  };

  return (
    <AppShell>
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to={`${roleBaseUrl}/assignments`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--color-primary, #2563eb)',
            fontSize: '0.875rem',
            textDecoration: 'none',
            fontWeight: 500
          }}
        >
          ← Quay lại danh sách bài tập
        </Link>
      </div>

      <PageHeader
        title="Chi tiết bài tập"
        subtitle={assignment ? `Lớp ${assignment.classCode} • ${assignment.courseName}` : 'Đang tải thông tin bài tập...'}
      />

      {error ? (
        <div
          style={{
            padding: '2rem',
            backgroundColor: 'var(--color-surface, #ffffff)',
            borderRadius: 'var(--radius-xl, 12px)',
            border: '1px solid var(--color-border, #e5e7eb)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>{error}</h3>
          <Link
            to={`${roleBaseUrl}/assignments`}
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: '#ffffff',
              borderRadius: 'var(--radius-md, 6px)',
              textDecoration: 'none'
            }}
          >
            Quay lại danh sách
          </Link>
        </div>
      ) : isLoading || !assignment ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface, #ffffff)',
            borderRadius: 'var(--radius-xl, 12px)',
            border: '1px solid var(--color-border, #e5e7eb)',
            color: 'var(--color-text-secondary, #6b7280)'
          }}
        >
          Đang tải thông tin bài tập...
        </div>
      ) : (
        <>
          {/* Assignment Detail Card */}
          <AssignmentDetailCard
            assignment={assignment}
            roleBaseUrl={roleBaseUrl}
            onEdit={() => setIsEditModalOpen(true)}
            onDelete={() => setIsDeleteModalOpen(true)}
          />

          {/* Submissions Section */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary, #111827)' }}>
                Danh sách bài nộp của học viên ({totalSubmissions})
              </h3>
            </div>

            <SubmissionFilterBar
              filters={submissionFilters}
              onFilterChange={(p) => updateSubmissionFilters({ ...p, page: 1 })}
              onReset={() => setSearchParams(new URLSearchParams())}
            />

            <SubmissionTable
              submissions={submissions}
              isLoading={isLoadingSubmissions}
              roleBaseUrl={roleBaseUrl}
              maxScore={assignment.maxScore}
              sortBy={submissionFilters.sortBy}
              sortDirection={submissionFilters.sortDirection}
              onSortChange={handleSortChange}
            />

            {!isLoadingSubmissions && submissions.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <Pagination
                  page={submissionFilters.page || 1}
                  totalPages={totalSubmissionPages}
                  totalItems={totalSubmissions}
                  pageSize={submissionFilters.pageSize || 10}
                  onPageChange={(p) => updateSubmissionFilters({ page: p })}
                />
              </div>
            )}
          </div>

          {/* Edit Modal */}
          <AssignmentFormModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            initialData={assignment}
            onSubmitUpdate={handleUpdate}
          />

          {/* Delete Modal */}
          <DeleteAssignmentModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            assignment={assignment}
            onConfirm={handleDelete}
          />
        </>
      )}
    </AppShell>
  );
};
