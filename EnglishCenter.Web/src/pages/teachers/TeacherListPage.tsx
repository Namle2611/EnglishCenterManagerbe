import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Pagination } from '../../components/common/Pagination';
import { SearchInput } from '../../components/common/SearchInput';
import { TeacherFilters } from '../../components/teachers/TeacherFilters';
import { TeacherStatusControl } from '../../components/teachers/TeacherStatusControl';
import { TeacherTable } from '../../components/teachers/TeacherTable';
import { teacherService } from '../../services/teacher.service';
import type { PagedResult } from '../../types/common.types';
import type { TeacherFilterParams, TeacherListItem, TeacherStatus } from '../../types/teacher.types';
import {
  getTeacherApiErrorMessage,
  normalizeTeacherQueryParams
} from '../../utils/teacherHelper';

export const TeacherListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = '/admin/teachers';

  // Parse and normalize parameters from URL
  const queryParams = normalizeTeacherQueryParams(searchParams);

  // Local state
  const [data, setData] = useState<PagedResult<TeacherListItem> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick status modal state
  const [statusTargetTeacher, setStatusTargetTeacher] = useState<TeacherListItem | null>(null);

  // Stale request protection
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTeachers = useCallback(async (params: TeacherFilterParams) => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await teacherService.getTeachers(params, controller.signal);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setErrorMessage(response.message || 'Không thể tải danh sách giáo viên.');
      }
    } catch (err: unknown) {
      // Cancellation is NOT an error; silently ignore superseded requests
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      setErrorMessage(getTeacherApiErrorMessage(err));
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  // Execute fetch whenever query parameters in URL change
  useEffect(() => {
    const params = normalizeTeacherQueryParams(searchParams);
    fetchTeachers(params);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTeachers, searchParams]);

  // Helper to update URL search parameters while keeping valid keys
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

      setSearchParams(updated, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Search input handler
  const handleSearch = (value: string) => {
    updateSearchParams({
      search: value.trim() || undefined,
      page: 1
    });
  };

  // Filter handlers
  const handleStatusFilterChange = (status?: TeacherStatus) => {
    updateSearchParams({
      status: status || undefined,
      page: 1
    });
  };

  const handleSpecializationFilterChange = (specialization?: string) => {
    updateSearchParams({
      specialization: specialization?.trim() || undefined,
      page: 1
    });
  };

  const handleClearFilters = () => {
    const updated = new URLSearchParams();
    if (queryParams.pageSize && queryParams.pageSize !== 10) {
      updated.set('pageSize', String(queryParams.pageSize));
    }
    setSearchParams(updated, { replace: true });
  };

  // Sort handler
  const handleSortChange = (column: string) => {
    let nextDirection: 'asc' | 'desc' = 'asc';
    if (queryParams.sortBy?.toLowerCase() === column.toLowerCase()) {
      nextDirection = queryParams.sortDirection === 'asc' ? 'desc' : 'asc';
    }

    updateSearchParams({
      sortBy: column,
      sortDirection: nextDirection,
      page: 1
    });
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updateSearchParams({
      pageSize: newPageSize,
      page: 1
    });
  };

  // Quick Status change execution from list row
  const handleQuickStatusChange = async (newStatus: TeacherStatus) => {
    if (!statusTargetTeacher) return;

    const response = await teacherService.updateTeacherStatus(statusTargetTeacher.id, newStatus);
    if (response.success) {
      setStatusTargetTeacher(null);
      // Refetch current query to reflect updated state & filters
      const params = normalizeTeacherQueryParams(searchParams);
      await fetchTeachers(params);
    }
  };

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    queryParams.search || queryParams.status || queryParams.specialization
  );

  // Auto-normalize page if current page exceeds totalPages
  useEffect(() => {
    if (data && data.totalPages > 0 && queryParams.page && queryParams.page > data.totalPages) {
      updateSearchParams({ page: data.totalPages });
    }
  }, [data, queryParams.page, updateSearchParams]);


  return (
    <div style={pageContainerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>
            Quản lý giáo viên
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Danh sách, tìm kiếm và phân quyền giáo viên trung tâm
          </p>
        </div>
        <Link to={`${basePath}/new`} style={createButtonStyle}>
          + Thêm giáo viên
        </Link>
      </div>

      {/* Search & Filters Bar */}
      <div style={searchFilterBarStyle}>
        <div style={{ flex: '1 1 300px' }}>
          <SearchInput
            value={queryParams.search || ''}
            onChange={handleSearch}
            placeholder="Tìm theo mã giáo viên, họ tên hoặc email..."
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Advanced Filter Row */}
      <TeacherFilters
        status={queryParams.status}
        specialization={queryParams.specialization}
        onStatusChange={handleStatusFilterChange}
        onSpecializationChange={handleSpecializationFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        disabled={isLoading}
      />

      {/* Content Area */}
      {isLoading ? (
        <div style={cardContainerStyle}>
          <LoadingState message="Đang tải danh sách giáo viên..." />
        </div>
      ) : errorMessage ? (
        <div style={cardContainerStyle}>
          <div style={errorContainerStyle}>
            <p style={{ margin: '0 0 1rem 0', color: '#b91c1c' }}>{errorMessage}</p>
            <button
              type="button"
              onClick={() => fetchTeachers(queryParams)}
              style={retryButtonStyle}
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div style={cardContainerStyle}>
          {hasActiveFilters ? (
            <EmptyState
              title="Không tìm thấy giáo viên phù hợp"
              description="Thử thay đổi từ khóa tìm kiếm hoặc xóa các bộ lọc hiện tại."
              actionText="Xóa bộ lọc"
              onAction={handleClearFilters}
            />
          ) : (
            <EmptyState
              title="Chưa có giáo viên"
              description="Hiện tại hệ thống chưa có hồ sơ giáo viên nào."
              actionText="Thêm giáo viên mới"
              onAction={() => window.location.assign(`${basePath}/new`)}
            />
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TeacherTable
            teachers={data.items}
            basePath={basePath}
            sortBy={queryParams.sortBy}
            sortDirection={queryParams.sortDirection}
            onSortChange={handleSortChange}
            onQuickStatusChange={(teacher) => setStatusTargetTeacher(teacher)}
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
      {statusTargetTeacher && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                Thay đổi trạng thái: {statusTargetTeacher.fullName} ({statusTargetTeacher.teacherCode})
              </h3>
              <button
                type="button"
                onClick={() => setStatusTargetTeacher(null)}
                style={modalCloseButtonStyle}
              >
                &times;
              </button>
            </div>
            <TeacherStatusControl
              currentStatus={statusTargetTeacher.status}
              onStatusChange={handleQuickStatusChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const pageContainerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '1.5rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem'
};

const createButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.6rem 1.1rem',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 600,
  transition: 'background-color 0.15s ease'
};

const searchFilterBarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1rem',
  alignItems: 'center'
};

const cardContainerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  padding: '2rem 1rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
};

const errorContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '1.5rem'
};

const retryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer'
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '1.5rem',
  maxWidth: '550px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
};

const modalCloseButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: '#64748b'
};
