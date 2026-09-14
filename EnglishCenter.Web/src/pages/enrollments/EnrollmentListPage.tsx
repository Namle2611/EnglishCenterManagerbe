import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Pagination } from '../../components/common/Pagination';
import { EnrollmentDeleteDialog } from '../../components/enrollments/EnrollmentDeleteDialog';
import { EnrollmentFilters } from '../../components/enrollments/EnrollmentFilters';
import { EnrollmentStatusDialog } from '../../components/enrollments/EnrollmentStatusDialog';
import { EnrollmentTable } from '../../components/enrollments/EnrollmentTable';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { enrollmentService } from '../../services/enrollment.service';
import type { PagedResult } from '../../types/common.types';
import type {
  EnrollmentDetail,
  EnrollmentFilterParams,
  EnrollmentListItem,
  EnrollmentStatus
} from '../../types/enrollment.types';
import {
  getEnrollmentApiErrorMessage,
  getEnrollmentBasePath,
  normalizeEnrollmentQueryParams
} from '../../utils/enrollmentHelper';

export const EnrollmentListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const basePath = getEnrollmentBasePath(location.pathname);

  // Normalize parameters from URL
  const queryParams = normalizeEnrollmentQueryParams(searchParams);

  // Data state
  const [data, setData] = useState<PagedResult<EnrollmentListItem> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Flash message from navigation state
  const [flashMessage, setFlashMessage] = useState<string | null>(
    (location.state as { flashMessage?: string } | null)?.flashMessage || null
  );

  // Status transition modal state
  const [statusTarget, setStatusTarget] = useState<EnrollmentListItem | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<EnrollmentListItem | null>(null);

  // AbortController ref for race condition & stale query protection
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchEnrollments = useCallback(async (params: EnrollmentFilterParams) => {
    // Check date range validity before dispatching
    if (params.dateFrom && params.dateTo && params.dateFrom > params.dateTo) {
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await enrollmentService.getEnrollments(params, controller.signal);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setErrorMessage(response.message || 'Không thể tải danh sách ghi danh.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      setErrorMessage(getEnrollmentApiErrorMessage(err));
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch when URL search params change
  useEffect(() => {
    const params = normalizeEnrollmentQueryParams(searchParams);
    fetchEnrollments(params);

    // If searchParams contain malformed parameters, safely sanitize the URL
    if (searchParams.toString()) {
      const clean = new URLSearchParams();
      if (searchParams.has('page')) clean.set('page', String(params.page || 1));
      if (searchParams.has('pageSize')) clean.set('pageSize', String(params.pageSize || 10));
      if (params.search) clean.set('search', params.search);
      if (params.studentId) clean.set('studentId', String(params.studentId));
      if (params.courseId) clean.set('courseId', String(params.courseId));
      if (params.classId) clean.set('classId', String(params.classId));
      if (params.status) clean.set('status', params.status);
      if (params.dateFrom) clean.set('dateFrom', params.dateFrom);
      if (params.dateTo) clean.set('dateTo', params.dateTo);
      if (params.sortBy) {
        clean.set('sortBy', params.sortBy);
        if (params.sortDirection) clean.set('sortDirection', params.sortDirection);
      }

      if (clean.toString() !== searchParams.toString()) {
        setSearchParams(clean, { replace: true });
      }
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchEnrollments, searchParams, setSearchParams]);

  // Update URL search parameters
  const updateSearchParams = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const updated = new URLSearchParams(searchParams);

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === null) {
          updated.delete(key);
        } else {
          updated.set(key, String(value));
        }
      });

      setSearchParams(updated);
    },
    [searchParams, setSearchParams]
  );

  // 10 data-shaping parameter changes that strictly reset page = 1:
  // search, studentId, courseId, classId, status, dateFrom, dateTo, pageSize, sortBy, sortDirection
  const handleSearchChange = (val: string) => {
    updateSearchParams({ search: val || undefined, page: 1 });
  };

  const handleStudentChange = (id?: number) => {
    updateSearchParams({ studentId: id, page: 1 });
  };

  const handleCourseChange = (id?: number) => {
    updateSearchParams({ courseId: id, page: 1 });
  };

  const handleClassChange = (id?: number) => {
    updateSearchParams({ classId: id, page: 1 });
  };

  const handleStatusChange = (newStatus?: EnrollmentStatus) => {
    updateSearchParams({ status: newStatus, page: 1 });
  };

  const handleDateFromChange = (d?: string) => {
    updateSearchParams({ dateFrom: d, page: 1 });
  };

  const handleDateToChange = (d?: string) => {
    updateSearchParams({ dateTo: d, page: 1 });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateSearchParams({ pageSize: newSize, page: 1 });
  };

  const handleSortChange = (column: string) => {
    const isCurrent = queryParams.sortBy?.toLowerCase() === column.toLowerCase();
    let nextDirection: 'asc' | 'desc' = 'asc';
    if (isCurrent) {
      nextDirection = queryParams.sortDirection === 'asc' ? 'desc' : 'asc';
    }
    updateSearchParams({ sortBy: column, sortDirection: nextDirection, page: 1 });
  };

  const handleResetFilters = () => {
    const clean = new URLSearchParams();
    clean.set('page', '1');
    clean.set('pageSize', String(queryParams.pageSize || 10));
    setSearchParams(clean);
  };

  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage });
  };

  // Status transition success handler
  const handleStatusSuccess = (updated: EnrollmentDetail) => {
    setFlashMessage(`Ghi danh #${updated.id} đã chuyển sang trạng thái "${updated.status}".`);
    fetchEnrollments(queryParams);
  };

  // Last-item page correction on Delete:
  // If last item on page > 1 is deleted, step back to page - 1 while preserving other params
  const handleDeleteSuccess = () => {
    setFlashMessage('Xóa ghi danh thành công.');
    const currentPage = queryParams.page || 1;
    if (currentPage > 1 && data?.items.length === 1) {
      updateSearchParams({ page: currentPage - 1 });
    } else {
      fetchEnrollments(queryParams);
    }
  };

  const executeDeleteAction = async (id: number) => {
    await enrollmentService.deleteEnrollment(id);
  };

  return (
    <AppShell>
      <PageHeader
        title="Quản lý ghi danh"
        subtitle="Theo dõi, xác nhận học phí và phân lớp cho học viên."
        actions={
          <Link
            to={`${basePath}/new`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span>+</span> Tạo ghi danh mới
          </Link>
        }
      />

      {/* Flash Success Message */}
      {flashMessage && (
        <div
          role="status"
          style={{
            backgroundColor: 'var(--status-active-bg)',
            color: 'var(--status-active-text)',
            border: '1px solid var(--status-active-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>✓ {flashMessage}</span>
          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            border: '1px solid var(--status-danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.25rem'
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Filters Bar */}
      <EnrollmentFilters
        search={queryParams.search || ''}
        studentId={queryParams.studentId}
        courseId={queryParams.courseId}
        classId={queryParams.classId}
        status={queryParams.status}
        dateFrom={queryParams.dateFrom}
        dateTo={queryParams.dateTo}
        onSearchChange={handleSearchChange}
        onStudentChange={handleStudentChange}
        onCourseChange={handleCourseChange}
        onClassChange={handleClassChange}
        onStatusChange={handleStatusChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onReset={handleResetFilters}
        disabled={isLoading}
      />

      {/* Content Area */}
      {isLoading ? (
        <LoadingState message="Đang tải danh sách ghi danh..." />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Không tìm thấy ghi danh nào"
          description={
            queryParams.search || queryParams.studentId || queryParams.courseId || queryParams.status
              ? 'Không có kết quả phù hợp với tiêu chí lọc hiện tại.'
              : 'Chưa có ghi danh nào được tạo trong hệ thống.'
          }
          actionText={
            queryParams.search || queryParams.studentId || queryParams.courseId || queryParams.status
              ? 'Đặt lại bộ lọc'
              : undefined
          }
          onAction={
            queryParams.search || queryParams.studentId || queryParams.courseId || queryParams.status
              ? handleResetFilters
              : undefined
          }
        />
      ) : (
        <>
          <EnrollmentTable
            enrollments={data.items}
            basePath={basePath}
            sortBy={queryParams.sortBy}
            sortDirection={queryParams.sortDirection}
            onSortChange={handleSortChange}
            onOpenStatusModal={(item) => setStatusTarget(item)}
            onDeleteClick={(item) => setDeleteTarget(item)}
            disabled={isLoading}
          />

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            totalItems={data.totalItems}
            pageSize={data.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      {/* Status Transition Dialog */}
      <EnrollmentStatusDialog
        isOpen={Boolean(statusTarget)}
        enrollment={statusTarget}
        onClose={() => setStatusTarget(null)}
        onSuccess={handleStatusSuccess}
      />

      {/* Delete Dialog */}
      <EnrollmentDeleteDialog
        isOpen={Boolean(deleteTarget)}
        enrollment={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirmSuccess={handleDeleteSuccess}
        deleteAction={executeDeleteAction}
      />
    </AppShell>
  );
};
