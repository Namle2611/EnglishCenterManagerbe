import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Pagination } from '../../components/common/Pagination';
import { ScheduleDeleteDialog } from '../../components/schedules/ScheduleDeleteDialog';
import { ScheduleFilters } from '../../components/schedules/ScheduleFilters';
import { ScheduleTable } from '../../components/schedules/ScheduleTable';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { scheduleService } from '../../services/schedule.service';
import type { PagedResult } from '../../types/common.types';
import type { ScheduleFilterParams, ScheduleListItem } from '../../types/schedule.types';
import {
  getScheduleApiErrorMessage,
  getScheduleBasePath,
  normalizeScheduleQueryParams
} from '../../utils/scheduleHelper';

export const ScheduleListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getScheduleBasePath(location.pathname);

  // Normalize parameters from URL
  const queryParams = normalizeScheduleQueryParams(searchParams);

  // Data state
  const [data, setData] = useState<PagedResult<ScheduleListItem> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Flash message from navigation state
  const [flashMessage, setFlashMessage] = useState<string | null>(
    (location.state as { flashMessage?: string } | null)?.flashMessage || null
  );

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ScheduleListItem | null>(null);

  // AbortController ref for race condition & stale query protection
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSchedules = useCallback(async (params: ScheduleFilterParams) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await scheduleService.getSchedules(params, controller.signal);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setErrorMessage(response.message || 'Không thể tải danh sách lịch học.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      setErrorMessage(getScheduleApiErrorMessage(err));
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch when URL search params change
  useEffect(() => {
    const params = normalizeScheduleQueryParams(searchParams);
    fetchSchedules(params);

    // If searchParams contain malformed parameters, safely sanitize the URL
    if (searchParams.toString()) {
      const clean = new URLSearchParams();
      // Only keep validated fields
      if (searchParams.has('page')) clean.set('page', String(params.page || 1));
      if (searchParams.has('pageSize')) clean.set('pageSize', String(params.pageSize || 10));
      if (params.search) clean.set('search', params.search);
      if (params.classId) clean.set('classId', String(params.classId));
      if (params.roomId) clean.set('roomId', String(params.roomId));
      if (params.teacherId) clean.set('teacherId', String(params.teacherId));
      if (params.dayOfWeek) clean.set('dayOfWeek', String(params.dayOfWeek));
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
  }, [fetchSchedules, searchParams, setSearchParams]);

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

  // 8-Case Page Reset Handlers: resetting to page = 1 whenever filters or sorting change
  const handleSearchChange = (newSearch: string) => {
    updateSearchParams({
      search: newSearch.trim() ? newSearch.trim() : undefined,
      page: 1
    });
  };

  const handleClassChange = (newClassId?: number) => {
    updateSearchParams({
      classId: newClassId || undefined,
      page: 1
    });
  };

  const handleRoomChange = (newRoomId?: number) => {
    updateSearchParams({
      roomId: newRoomId || undefined,
      page: 1
    });
  };

  const handleTeacherChange = (newTeacherId?: number) => {
    updateSearchParams({
      teacherId: newTeacherId || undefined,
      page: 1
    });
  };

  const handleDayChange = (newDay?: number) => {
    updateSearchParams({
      dayOfWeek: newDay || undefined,
      page: 1
    });
  };

  const handleSortChange = (column: string) => {
    const currentSortBy = queryParams.sortBy;
    const currentDirection = queryParams.sortDirection || 'asc';

    if (currentSortBy === column) {
      const nextDirection = currentDirection === 'asc' ? 'desc' : 'asc';
      updateSearchParams({
        sortBy: column,
        sortDirection: nextDirection,
        page: 1
      });
    } else {
      updateSearchParams({
        sortBy: column,
        sortDirection: 'asc',
        page: 1
      });
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    updateSearchParams({
      pageSize: newSize,
      page: 1
    });
  };

  // Direct pagination interaction: only updates page
  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    const idToDelete = deleteTarget.id;
    await scheduleService.deleteSchedule(idToDelete);
    setDeleteTarget(null);
    setFlashMessage('Đã xóa lịch học thành công.');

    // Last-page edge case: If deleting sole remaining item on page > 1, navigate to previous page
    const currentPage = queryParams.page || 1;
    const currentItemsCount = data?.items?.length || 0;

    if (currentPage > 1 && currentItemsCount <= 1) {
      // Navigate to previous valid page while preserving all other query parameters
      updateSearchParams({ page: currentPage - 1 });
    } else {
      // Refetch current server state
      const currentParams = normalizeScheduleQueryParams(searchParams);
      await fetchSchedules(currentParams);
    }
  };

  const hasActiveFilters = Boolean(
    queryParams.search ||
    queryParams.classId ||
    queryParams.roomId ||
    queryParams.teacherId ||
    queryParams.dayOfWeek
  );
  const totalItems = data?.totalItems ?? 0;
  const items = data?.items ?? [];

  return (
    <AppShell>
      <PageHeader
        title="Quản lý lịch học"
        subtitle="Tra cứu lịch học hàng tuần theo lớp, phòng học, giáo viên và quản lý khung giờ học"
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
              color: 'var(--color-text-inverse, #ffffff)',
              backgroundColor: 'var(--color-primary, #2563eb)',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
              transition: 'background-color 0.15s ease'
            }}
          >
            + Xếp lịch học
          </Link>
        }
      />

      {/* Flash Success Notification */}
      {flashMessage && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            backgroundColor: 'var(--status-active-bg, #dcfce7)',
            color: 'var(--status-active-text, #15803d)',
            border: '1px solid var(--status-active-border, #bbf7d0)',
            borderRadius: 'var(--radius-lg, 12px)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          role="status"
        >
          <span>{flashMessage}</span>
          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--status-active-text, #15803d)',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.25rem',
              lineHeight: 1
            }}
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <ScheduleFilters
        search={queryParams.search || ''}
        classId={queryParams.classId}
        roomId={queryParams.roomId}
        teacherId={queryParams.teacherId}
        dayOfWeek={queryParams.dayOfWeek}
        onSearchChange={handleSearchChange}
        onClassChange={handleClassChange}
        onRoomChange={handleRoomChange}
        onTeacherChange={handleTeacherChange}
        onDayChange={handleDayChange}
        onReset={handleResetFilters}
        disabled={isLoading}
      />

      {/* Error alert with retry button */}
      {errorMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--status-danger-bg, #fee2e2)',
            color: 'var(--status-danger-text, #b91c1c)',
            border: '1px solid var(--status-danger-border, #fecaca)',
            borderRadius: 'var(--radius-lg, 12px)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
          role="alert"
        >
          <div>
            <strong>Lỗi tải dữ liệu:</strong> {errorMessage}
          </div>
          <button
            type="button"
            onClick={() => fetchSchedules(queryParams)}
            style={{
              padding: '0.375rem 0.875rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-surface, #ffffff)',
              color: 'var(--status-danger-text, #b91c1c)',
              border: '1px solid var(--status-danger-border, #fecaca)',
              borderRadius: 'var(--radius-md, 8px)',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Content Section */}
      {isLoading ? (
        <LoadingState message="Đang tải danh sách lịch học..." />
      ) : items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy lịch học phù hợp"
            description="Không có lịch học nào khớp với các điều kiện lọc hoặc từ khóa tìm kiếm hiện tại."
            actionText="Xóa bộ lọc"
            onAction={handleResetFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có lịch học"
            description="Hệ thống chưa có lịch học nào được thiết lập. Hãy bắt đầu bằng cách xếp lịch cho lớp học đầu tiên."
            actionText="+ Xếp lịch học"
            onAction={() => navigate(`${basePath}/new`)}
          />
        )
      ) : (
        <>
          <ScheduleTable
            schedules={items}
            basePath={basePath}
            sortBy={queryParams.sortBy}
            sortDirection={queryParams.sortDirection}
            onSortChange={handleSortChange}
            onDeleteClick={(item) => setDeleteTarget(item)}
            disabled={isLoading}
          />

          {/* Pagination */}
          <div style={{ marginTop: '1.25rem' }}>
            <Pagination
              page={queryParams.page || 1}
              totalPages={data?.totalPages || 1}
              totalItems={totalItems}
              pageSize={queryParams.pageSize || 10}
              pageSizeOptions={[10, 20, 50]}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ScheduleDeleteDialog
        schedule={deleteTarget}
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </AppShell>
  );
};
