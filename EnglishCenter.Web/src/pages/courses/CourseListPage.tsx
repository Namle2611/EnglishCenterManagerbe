import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Pagination } from '../../components/common/Pagination';
import { SearchInput } from '../../components/common/SearchInput';
import { CourseFilters } from '../../components/courses/CourseFilters';
import { CourseStatusControl } from '../../components/courses/CourseStatusControl';
import { CourseTable } from '../../components/courses/CourseTable';
import { courseService } from '../../services/course.service';
import type { PagedResult } from '../../types/common.types';
import type { CourseFilterParams, CourseListItem, CourseStatus } from '../../types/course.types';
import {
  getCourseApiErrorMessage,
  getCourseBasePath,
  normalizeCourseQueryParams
} from '../../utils/courseHelper';

export const CourseListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const basePath = getCourseBasePath(location.pathname);

  // Normalize parameters from URL
  const queryParams = normalizeCourseQueryParams(searchParams);

  // Local state
  const [data, setData] = useState<PagedResult<CourseListItem> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick status modal state
  const [statusTargetCourse, setStatusTargetCourse] = useState<CourseListItem | null>(null);

  // Stale request protection
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCourses = useCallback(async (params: CourseFilterParams) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await courseService.getCourses(params, controller.signal);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setErrorMessage(response.message || 'Không thể tải danh sách khóa học.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      setErrorMessage(getCourseApiErrorMessage(err));
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch when URL params change
  useEffect(() => {
    const params = normalizeCourseQueryParams(searchParams);
    fetchCourses(params);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCourses, searchParams]);

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

      setSearchParams(updated, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Search input handler
  const handleSearch = (value: string) => {
    updateSearchParams({
      search: value ? value.trim() : undefined,
      page: 1 // Reset to page 1 on search
    });
  };

  // Status filter handler
  const handleStatusChange = (status?: CourseStatus) => {
    updateSearchParams({
      status: status || undefined,
      page: 1
    });
  };

  // Level filter handler
  const handleLevelChange = (level?: string) => {
    updateSearchParams({
      level: level && level.trim().length > 0 ? level.trim() : undefined,
      page: 1
    });
  };

  // Clear filters
  const handleClearFilters = () => {
    const updated = new URLSearchParams();
    if (queryParams.pageSize && queryParams.pageSize !== 10) {
      updated.set('pageSize', String(queryParams.pageSize));
    }
    setSearchParams(updated, { replace: true });
  };

  // Sort handler
  const handleSortChange = (column: string) => {
    const currentSortBy = queryParams.sortBy || 'id';
    const currentDirection = queryParams.sortDirection || 'desc';

    let newDirection: 'asc' | 'desc' = 'asc';
    if (currentSortBy.toLowerCase() === column.toLowerCase()) {
      newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    }

    updateSearchParams({
      sortBy: column,
      sortDirection: newDirection,
      page: 1
    });
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    updateSearchParams({ page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    updateSearchParams({ pageSize, page: 1 });
  };

  // Quick status toggle
  const handleQuickStatusChange = (course: CourseListItem) => {
    setStatusTargetCourse(course);
  };

  const handleExecuteStatusUpdate = async (newStatus: CourseStatus) => {
    if (!statusTargetCourse) return;
    const response = await courseService.updateCourseStatus(statusTargetCourse.id, newStatus);
    if (response.success) {
      setStatusTargetCourse(null);
      // Refetch current list so filtered lists immediately update
      fetchCourses(normalizeCourseQueryParams(searchParams));
    }
  };

  const hasActiveFilters = Boolean(
    queryParams.status || (queryParams.level && queryParams.level.trim().length > 0)
  );

  const hasSearch = Boolean(queryParams.search && queryParams.search.trim().length > 0);

  return (
    <div style={pageContainerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Quản lý khóa học</h1>
          <p style={subtitleStyle}>
            Xem danh sách, tìm kiếm, lọc và quản lý các khóa học tiếng Anh trên hệ thống
          </p>
        </div>
        <Link to={`${basePath}/new`} style={createButtonStyle}>
          + Thêm khóa học
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div style={controlsContainerStyle}>
        <div style={searchRowStyle}>
          <SearchInput
            value={queryParams.search || ''}
            onChange={handleSearch}
            placeholder="Tìm theo mã khóa học hoặc tên khóa học..."
            debounceMs={400}
            disabled={isLoading && !data}
          />
        </div>

        <CourseFilters
          status={queryParams.status}
          level={queryParams.level}
          onStatusChange={handleStatusChange}
          onLevelChange={handleLevelChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          disabled={isLoading && !data}
        />
      </div>

      {/* Main Content Area */}
      {isLoading && !data ? (
        <LoadingState message="Đang tải danh sách khóa học..." />
      ) : errorMessage ? (
        <div style={errorContainerStyle} role="alert">
          <p style={{ margin: 0, fontWeight: 500 }}>{errorMessage}</p>
          <button
            type="button"
            onClick={() => fetchCourses(normalizeCourseQueryParams(searchParams))}
            style={retryButtonStyle}
          >
            Thử lại
          </button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={hasSearch || hasActiveFilters ? 'Không tìm thấy khóa học' : 'Chưa có khóa học nào'}
          description={
            hasSearch || hasActiveFilters
              ? 'Không có khóa học nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.'
              : 'Hệ thống chưa có khóa học nào. Hãy bắt đầu bằng cách thêm khóa học mới.'
          }
          actionText={hasSearch || hasActiveFilters ? 'Xóa bộ lọc' : '+ Thêm khóa học'}
          onAction={
            hasSearch || hasActiveFilters
              ? handleClearFilters
              : () => {
                  window.location.href = `${basePath}/new`;
                }
          }
        />
      ) : (
        <>
          <CourseTable
            courses={data.items}
            basePath={basePath}
            sortBy={queryParams.sortBy}
            sortDirection={queryParams.sortDirection}
            onSortChange={handleSortChange}
            onQuickStatusChange={handleQuickStatusChange}
            disabled={isLoading}
          />

          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            totalItems={data.totalItems}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      {/* Quick Status Modal */}
      {statusTargetCourse && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>
                Đổi trạng thái: {statusTargetCourse.courseName}
              </h3>
              <button
                type="button"
                onClick={() => setStatusTargetCourse(null)}
                style={modalCloseButtonStyle}
              >
                ✕
              </button>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <CourseStatusControl
                currentStatus={statusTargetCourse.status}
                onStatusChange={handleExecuteStatusUpdate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const pageContainerStyle: React.CSSProperties = {
  padding: '1.5rem 2rem',
  maxWidth: '1200px',
  margin: '0 auto',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
  gap: '1rem'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#0f172a'
};

const subtitleStyle: React.CSSProperties = {
  margin: '0.25rem 0 0 0',
  fontSize: '0.875rem',
  color: '#64748b'
};

const createButtonStyle: React.CSSProperties = {
  padding: '0.6rem 1.25rem',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.875rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)'
};

const controlsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginBottom: '1.5rem'
};

const searchRowStyle: React.CSSProperties = {
  maxWidth: '500px'
};

const errorContainerStyle: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: '8px',
  padding: '1.5rem',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75rem'
};

const retryButtonStyle: React.CSSProperties = {
  padding: '0.45rem 1rem',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer'
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '550px',
  padding: '1.5rem',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const modalCloseButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.1rem',
  cursor: 'pointer',
  color: '#64748b'
};
