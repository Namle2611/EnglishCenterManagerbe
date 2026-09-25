import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { AttendanceTable } from '../../components/attendances/AttendanceTable';
import { AttendanceFilters } from '../../components/attendances/AttendanceFilters';
import { attendanceService } from '../../services/attendance.service';
import type { AttendanceListItem, AttendanceQueryParams } from '../../types/attendance.types';
import {
  buildAttendanceQueryParams,
  extractAttendanceErrorMessage,
  getAttendanceBasePath,
  normalizeAttendanceQueryParams,
  VALID_PAGE_SIZES
} from '../../utils/attendanceHelper';

export const AttendanceListPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = getAttendanceBasePath(location.pathname);

  // Parse & normalize URL parameters defensively
  const queryParams = normalizeAttendanceQueryParams(searchParams);

  const [attendances, setAttendances] = useState<AttendanceListItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch attendances from API
  const fetchAttendances = useCallback(async (params: AttendanceQueryParams) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await attendanceService.getAttendances(params, controller.signal);
      if (response.success && response.data) {
        setAttendances(response.data.items);
        setTotalItems(response.data.totalItems);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setErrorMessage(response.message || 'Không thể tải lịch sử điểm danh.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return; // Request was aborted by newer request, silently ignore
      }
      setErrorMessage(extractAttendanceErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync fetch on searchParams change
  useEffect(() => {
    const params = normalizeAttendanceQueryParams(searchParams);
    const timer = setTimeout(() => {
      fetchAttendances(params);
    }, 0);
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchParams, fetchAttendances]);

  // Update URL search parameters
  const updateUrlParams = (newParams: Partial<AttendanceQueryParams>) => {
    const merged: AttendanceQueryParams = {
      ...queryParams,
      ...newParams
    };

    const nextParams = buildAttendanceQueryParams(merged);
    setSearchParams(nextParams as Record<string, string>);
  };

  // Sort change: resets page to 1
  const handleSortChange = (column: string) => {
    const isCurrent = queryParams.sortBy?.toLowerCase() === column.toLowerCase();
    const newDirection = isCurrent && queryParams.sortDirection === 'asc' ? 'desc' : 'asc';
    updateUrlParams({
      sortBy: column,
      sortDirection: newDirection,
      page: 1
    });
  };

  // Filter change: resets page to 1
  const handleFilterChange = (partial: Partial<AttendanceQueryParams>) => {
    updateUrlParams({
      ...partial,
      page: 1
    });
  };

  // Page size change: resets page to 1
  const handlePageSizeChange = (newSize: number) => {
    updateUrlParams({
      pageSize: newSize,
      page: 1
    });
  };

  // Direct page navigation: does NOT reset page
  const handlePageChange = (newPage: number) => {
    updateUrlParams({
      page: newPage
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchParams({ page: '1', pageSize: String(queryParams.pageSize || 10) });
  };

  const currentPage = queryParams.page || 1;
  const currentPageSize = queryParams.pageSize || 10;

  return (
    <AppShell>
      <PageHeader
        title="Quản lý điểm danh"
        subtitle="Theo dõi và ghi nhận lịch sử chuyên cần của học viên"
        breadcrumbs={[
          { label: 'Trang chủ', path: basePath.startsWith('/admin') ? '/admin' : basePath.startsWith('/staff') ? '/staff' : '/teacher' },
          { label: 'Điểm danh' }
        ]}
        actions={
          <button
            id="attendance-goto-session-btn"
            type="button"
            onClick={() => navigate(`${basePath}/session`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span>📋</span> Điểm danh theo buổi
          </button>
        }
      />

      {/* Filters */}
      <AttendanceFilters
        filters={queryParams}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        disabled={isLoading}
      />

      {/* Content Area */}
      {isLoading ? (
        <LoadingState message="Đang tải lịch sử điểm danh..." />
      ) : errorMessage ? (
        <div
          role="alert"
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            border: '1px solid var(--status-danger-border)',
            textAlign: 'center',
            fontSize: '0.9375rem'
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Không thể tải dữ liệu điểm danh</div>
          <div>{errorMessage}</div>
          <button
            type="button"
            onClick={() => fetchAttendances(queryParams)}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-surface)',
              color: 'var(--status-danger-text)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      ) : attendances.length === 0 ? (
        <EmptyState
          title="Không tìm thấy bản ghi điểm danh"
          description={
            Object.keys(queryParams).length > 2
              ? 'Không có bản ghi điểm danh nào khớp với bộ lọc. Hãy thử tìm kiếm với điều kiện khác.'
              : 'Chưa có bản ghi điểm danh nào trong hệ thống.'
          }
          actionText="Điểm danh buổi học ngay"
          onAction={() => navigate(`${basePath}/session`)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Table */}
          <AttendanceTable
            attendances={attendances}
            basePath={basePath}
            sortBy={queryParams.sortBy}
            sortDirection={queryParams.sortDirection}
            onSortChange={handleSortChange}
            disabled={isLoading}
          />

          {/* Pagination Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '0.75rem 0.25rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)'
            }}
          >
            <div>
              Hiển thị <strong>{(currentPage - 1) * currentPageSize + 1}</strong> -{' '}
              <strong>{Math.min(currentPage * currentPageSize, totalItems)}</strong> trong tổng số{' '}
              <strong>{totalItems}</strong> bản ghi
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Page Size Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Hiển thị:</span>
                <select
                  id="page-size-selector"
                  value={currentPageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  style={{
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.8125rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    outline: 'none'
                  }}
                >
                  {VALID_PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span>dòng / trang</span>
              </div>

              {/* Page Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <button
                  type="button"
                  id="prev-page-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)',
                    cursor: currentPage <= 1 || isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  &larr; Trước
                </button>

                <span style={{ padding: '0 0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  id="next-page-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-secondary)',
                    cursor: currentPage >= totalPages || isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Sau &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};
