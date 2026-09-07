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
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
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
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Page Header */}
        <PageHeader
          title="Quản lý khóa học"
          subtitle="Xem danh sách, tìm kiếm, lọc và quản lý các khóa học tiếng Anh trên hệ thống"
          breadcrumbs={[
            { label: 'Quản lý khóa học' }
          ]}
          actions={
            <Link
              to={`${basePath}/new`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5625rem 1.125rem',
                backgroundColor: 'var(--color-primary, #1e40af)',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: 'var(--radius-md, 8px)',
                fontWeight: 600,
                fontSize: '0.875rem',
                boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                transition: 'background-color 0.15s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Thêm khóa học
            </Link>
          }
        />

        {/* Search and Filters Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ maxWidth: '480px' }}>
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
          <div
            role="alert"
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '1.75rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.875rem'
            }}
          >
            <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9375rem' }}>{errorMessage}</p>
            <button
              type="button"
              onClick={() => fetchCourses(normalizeCourseQueryParams(searchParams))}
              style={{
                padding: '0.5rem 1.125rem',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md, 8px)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
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
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-surface, #ffffff)',
                borderRadius: 'var(--radius-lg, 12px)',
                width: '100%',
                maxWidth: '560px',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
                border: '1px solid var(--color-border, #e2e8f0)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.0625rem',
                    fontWeight: 600,
                    color: 'var(--color-text, #0f172a)'
                  }}
                >
                  Đổi trạng thái: {statusTargetCourse.courseName}
                </h3>
                <button
                  type="button"
                  onClick={() => setStatusTargetCourse(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted, #64748b)',
                    padding: '0.25rem',
                    lineHeight: 1
                  }}
                  aria-label="Đóng"
                >
                  ✕
                </button>
              </div>
              <CourseStatusControl
                currentStatus={statusTargetCourse.status}
                onStatusChange={handleExecuteStatusUpdate}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

