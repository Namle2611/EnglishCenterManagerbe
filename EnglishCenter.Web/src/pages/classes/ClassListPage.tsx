import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Pagination } from '../../components/common/Pagination';
import { ClassFilters } from '../../components/classes/ClassFilters';
import { ClassStatusControl } from '../../components/classes/ClassStatusControl';
import { ClassTable } from '../../components/classes/ClassTable';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { classService } from '../../services/class.service';
import type { PagedResult } from '../../types/common.types';
import type { ClassFilterParams, ClassListItem, ClassStatus } from '../../types/class.types';
import {
  getClassApiErrorMessage,
  getClassBasePath,
  normalizeClassQueryParams
} from '../../utils/classHelper';

export const ClassListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getClassBasePath(location.pathname);

  // Normalize parameters from URL
  const queryParams = normalizeClassQueryParams(searchParams);

  // Local state
  const [data, setData] = useState<PagedResult<ClassListItem> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick status modal state
  const [statusTargetClass, setStatusTargetClass] = useState<ClassListItem | null>(null);

  // Stale request protection
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchClasses = useCallback(async (params: ClassFilterParams) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await classService.getClasses(params, controller.signal);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setErrorMessage(response.message || 'Không thể tải danh sách lớp học.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      setErrorMessage(getClassApiErrorMessage(err));
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch when URL params change
  useEffect(() => {
    const params = normalizeClassQueryParams(searchParams);
    fetchClasses(params);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchClasses, searchParams]);

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
  const handleStatusChange = (status: ClassStatus | '') => {
    updateSearchParams({
      status: status || undefined,
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
  const handleQuickStatusChange = (cls: ClassListItem) => {
    setStatusTargetClass(cls);
  };

  const handleExecuteStatusUpdate = async (newStatus: ClassStatus) => {
    if (!statusTargetClass) return;
    const response = await classService.updateClassStatus(statusTargetClass.id, newStatus);
    if (response.success) {
      setStatusTargetClass(null);
      // Refetch current list so filtered lists immediately update
      fetchClasses(normalizeClassQueryParams(searchParams));
    }
  };

  const hasActiveFilters = Boolean(queryParams.status || queryParams.search);

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Page Header */}
        <PageHeader
          title="Quản lý lớp học"
          subtitle="Xem danh sách, tìm kiếm, lọc và quản lý các lớp học trên hệ thống"
          breadcrumbs={[
            { label: 'Quản lý lớp học' }
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
              + Thêm lớp học
            </Link>
          }
        />

        {/* Filters bar */}
        <ClassFilters
          search={queryParams.search || ''}
          status={queryParams.status || ''}
          onSearchChange={handleSearch}
          onStatusChange={handleStatusChange}
          onReset={handleClearFilters}
          disabled={isLoading}
        />

        {/* Error notification */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-lg, 12px)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchClasses(queryParams)}
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: '#ffffff',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md, 8px)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !data && (
          <LoadingState message="Đang tải danh sách lớp học..." />
        )}

        {/* Empty State */}
        {!isLoading && data && data.items.length === 0 && (
          <EmptyState
            title={hasActiveFilters ? 'Không tìm thấy lớp học phù hợp' : 'Chưa có lớp học'}
            description={
              hasActiveFilters
                ? 'Không có lớp học nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.'
                : 'Hệ thống chưa có lớp học nào. Hãy bắt đầu bằng cách tạo lớp học mới.'
            }
            actionText={hasActiveFilters ? 'Xóa bộ lọc' : '+ Thêm lớp học'}
            onAction={hasActiveFilters ? handleClearFilters : () => navigate(`${basePath}/new`)}
          />
        )}

        {/* Data Table & Pagination */}
        {data && data.items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ClassTable
              classes={data.items}
              basePath={basePath}
              sortBy={queryParams.sortBy}
              sortDirection={queryParams.sortDirection}
              onSortChange={handleSortChange}
              onQuickStatusChange={handleQuickStatusChange}
              disabled={isLoading}
            />

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              pageSize={data.pageSize}
              totalItems={data.totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}

        {/* Quick Status Modal Overlay */}
        {statusTargetClass && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '1rem'
            }}
            onClick={() => setStatusTargetClass(null)}
          >
            <div
              style={{
                backgroundColor: 'var(--color-surface, #ffffff)',
                borderRadius: 'var(--radius-xl, 16px)',
                boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
                width: '100%',
                maxWidth: '480px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
                  Đổi trạng thái lớp học
                </h3>
                <button
                  type="button"
                  onClick={() => setStatusTargetClass(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted, #94a3b8)'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #475569)' }}>
                Lớp: <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{statusTargetClass.classCode}</strong> ({statusTargetClass.courseName})
              </div>

              <ClassStatusControl
                currentStatus={statusTargetClass.status}
                onStatusChange={handleExecuteStatusUpdate}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
