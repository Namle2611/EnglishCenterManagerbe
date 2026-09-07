import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Pagination } from '../../components/common/Pagination';
import { SearchInput } from '../../components/common/SearchInput';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { StudentFilters } from '../../components/students/StudentFilters';
import { StudentStatusControl } from '../../components/students/StudentStatusControl';
import { StudentTable } from '../../components/students/StudentTable';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/student.service';
import type { PagedResult } from '../../types/common.types';
import type { StudentFilterParams, StudentListItem, StudentStatus } from '../../types/student.types';
import { getRoleHomeRoute } from '../../utils/roleHelper';
import {
  getApiErrorMessage,
  getStudentBasePath,
  normalizeStudentQueryParams
} from '../../utils/studentHelper';

export const StudentListPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const basePath = getStudentBasePath(location.pathname, user?.roles);
  const homeRoute = user ? getRoleHomeRoute(user.roles) : '/login';

  // Parse and normalize parameters from URL
  const queryParams = normalizeStudentQueryParams(searchParams);

  // Local state
  const [data, setData] = useState<PagedResult<StudentListItem> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick status modal state
  const [statusTargetStudent, setStatusTargetStudent] = useState<StudentListItem | null>(null);

  // Stale request protection
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStudents = useCallback(async (params: StudentFilterParams) => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await studentService.getStudents(params, controller.signal);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setErrorMessage(response.message || 'Không thể tải danh sách học viên.');
      }
    } catch (err: unknown) {
      // Cancellation is NOT an error; silently ignore superseded requests
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      // Only turn off loading if this was the latest controller
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  // Execute fetch whenever query parameters in URL change
  useEffect(() => {
    const params = normalizeStudentQueryParams(searchParams);
    fetchStudents(params);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStudents, searchParams]);

  // Helper to update URL search parameters while keeping valid keys
  const updateSearchParams = (newParams: Record<string, string | number | undefined>) => {
    const updated = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        updated.delete(key);
      } else {
        updated.set(key, String(value));
      }
    });

    setSearchParams(updated, { replace: true });
  };

  // Search input change (single 400ms debounce layer handled by SearchInput)
  const handleSearchChange = (value: string) => {
    updateSearchParams({
      search: value.trim() || undefined,
      page: 1 // Reset page on search change
    });
  };

  // Status filter change
  const handleStatusChange = (status?: StudentStatus) => {
    updateSearchParams({
      status: status || undefined,
      page: 1 // Reset page on filter change
    });
  };

  // Level filter change
  const handleCurrentLevelChange = (level?: string) => {
    updateSearchParams({
      currentLevel: level ? level.trim() : undefined,
      page: 1 // Reset page on filter change
    });
  };

  // Sort change
  const handleSortChange = (column: string) => {
    const isCurrent = queryParams.sortBy?.toLowerCase() === column.toLowerCase();
    const nextDirection = isCurrent && queryParams.sortDirection === 'asc' ? 'desc' : 'asc';

    updateSearchParams({
      sortBy: column,
      sortDirection: nextDirection,
      page: 1 // Reset page on sort change
    });
  };

  // Pagination change
  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updateSearchParams({
      pageSize: newPageSize,
      page: 1 // Reset to page 1 on page size change
    });
  };

  // Clear all active filters
  const handleClearFilters = () => {
    setSearchParams(
      {
        page: '1',
        pageSize: String(queryParams.pageSize || 10)
      },
      { replace: true }
    );
  };

  // Quick status change inside list
  const handleQuickStatusUpdate = async (newStatus: StudentStatus) => {
    if (!statusTargetStudent) return;
    await studentService.updateStudentStatus(statusTargetStudent.id, newStatus);
    setStatusTargetStudent(null);
    fetchStudents(queryParams);
  };

  const hasActiveFilters = Boolean(
    queryParams.search ||
      queryParams.status ||
      queryParams.currentLevel ||
      queryParams.sortBy ||
      queryParams.sortDirection
  );

  return (
    <AppShell>
      {/* Page Header */}
      <PageHeader
        title="Quản lý học viên"
        subtitle="Xem danh sách, tìm kiếm, lọc và quản lý hồ sơ học viên trong trung tâm."
        breadcrumbs={[
          { label: 'Trang chủ', path: homeRoute },
          { label: 'Quản lý học viên' }
        ]}
        actions={
          <Link to={`${basePath}/new`} style={createButtonStyle}>
            + Thêm học viên
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div style={filterSectionStyle}>
        <SearchInput
          value={queryParams.search || ''}
          onChange={handleSearchChange}
          placeholder="Tìm theo mã HV, họ tên hoặc email..."
          disabled={isLoading}
        />

        <StudentFilters
          status={queryParams.status}
          currentLevel={queryParams.currentLevel}
          onStatusChange={handleStatusChange}
          onCurrentLevelChange={handleCurrentLevelChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          disabled={isLoading}
        />
      </div>

      {/* Error state */}
      {errorMessage && !isLoading && (
        <div style={errorContainerStyle} role="alert">
          <div>
            <strong>Không thể tải danh sách học viên:</strong> {errorMessage}
          </div>
          <button type="button" onClick={() => fetchStudents(queryParams)} style={retryButtonStyle}>
            Thử lại
          </button>
        </div>
      )}

      {/* Content area */}
      {isLoading ? (
        <LoadingState message="Đang tải danh sách học viên..." />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'Không tìm thấy học viên phù hợp' : 'Chưa có học viên nào'}
          description={
            hasActiveFilters
              ? 'Không có học viên nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn.'
              : 'Hệ thống hiện tại chưa có học viên nào. Hãy bắt đầu bằng cách thêm học viên mới.'
          }
          actionText={hasActiveFilters ? 'Xóa bộ lọc' : '+ Thêm học viên'}
          onAction={
            hasActiveFilters
              ? handleClearFilters
              : () => (window.location.href = `${basePath}/new`)
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <StudentTable
            students={data.items}
            basePath={basePath}
            sortBy={queryParams.sortBy}
            sortDirection={queryParams.sortDirection}
            onSortChange={handleSortChange}
            onQuickStatusChange={(student) => setStatusTargetStudent(student)}
            disabled={isLoading}
          />

          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            totalPages={data.totalPages}
            totalItems={data.totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      )}

      {/* Quick Status Modal */}
      {statusTargetStudent && (
        <div style={modalOverlayStyle} role="dialog" aria-modal="true">
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Đổi trạng thái: {statusTargetStudent.fullName} ({statusTargetStudent.studentCode})
              </h3>
              <button
                type="button"
                onClick={() => setStatusTargetStudent(null)}
                style={closeButtonStyle}
                aria-label="Đóng hộp thoại"
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '1.25rem' }}>
              <StudentStatusControl
                currentStatus={statusTargetStudent.status}
                onStatusChange={handleQuickStatusUpdate}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

const createButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.625rem 1.125rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  boxShadow: 'var(--shadow-xs)',
  transition: 'background-color 0.15s ease'
};

const filterSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
  justifyContent: 'space-between',
  marginBottom: '1.25rem'
};

const errorContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.875rem 1.25rem',
  backgroundColor: 'var(--status-danger-bg)',
  border: '1px solid var(--status-danger-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--status-danger-text)',
  fontSize: '0.875rem',
  marginBottom: '1rem'
};

const retryButtonStyle: React.CSSProperties = {
  padding: '0.375rem 0.75rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  backgroundColor: 'var(--status-danger-text)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer'
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  width: '100%',
  maxWidth: '560px',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '1rem 1.25rem',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'var(--color-surface-subtle)'
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  lineHeight: 1,
  padding: 0
};
