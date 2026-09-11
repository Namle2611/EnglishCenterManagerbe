import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Pagination } from '../../components/common/Pagination';
import { RoomFilters } from '../../components/rooms/RoomFilters';
import { RoomStatusControl } from '../../components/rooms/RoomStatusControl';
import { RoomTable } from '../../components/rooms/RoomTable';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { roomService } from '../../services/room.service';
import type { PagedResult } from '../../types/common.types';
import type { RoomFilterParams, RoomListItem, RoomStatus } from '../../types/room.types';
import {
  getRoomApiErrorMessage,
  getRoomBasePath,
  normalizeRoomQueryParams
} from '../../utils/roomHelper';

export const RoomListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getRoomBasePath(location.pathname);

  // Normalize parameters from URL
  const queryParams = normalizeRoomQueryParams(searchParams);

  // Local data state
  const [data, setData] = useState<PagedResult<RoomListItem> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick status modal state
  const [statusTargetRoom, setStatusTargetRoom] = useState<RoomListItem | null>(null);

  // Stale request protection
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchRooms = useCallback(async (params: RoomFilterParams) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await roomService.getRooms(params, controller.signal);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setErrorMessage(response.message || 'Không thể tải danh sách phòng học.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      setErrorMessage(getRoomApiErrorMessage(err));
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch when URL params change
  useEffect(() => {
    const params = normalizeRoomQueryParams(searchParams);
    fetchRooms(params);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRooms, searchParams]);

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

  // Search change -> reset page = 1
  const handleSearchChange = (newSearch: string) => {
    updateSearchParams({
      search: newSearch.trim() ? newSearch.trim() : undefined,
      page: 1
    });
  };

  // Status change -> reset page = 1
  const handleStatusChange = (newStatus: RoomStatus | '') => {
    updateSearchParams({
      status: newStatus || undefined,
      page: 1
    });
  };

  // Sort change -> reset page = 1
  const handleSortChange = (column: string) => {
    const currentSortBy = queryParams.sortBy || 'id';
    const currentDirection = queryParams.sortDirection || 'desc';

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

  // Page size change -> reset page = 1
  const handlePageSizeChange = (newSize: number) => {
    updateSearchParams({
      pageSize: newSize,
      page: 1
    });
  };

  // Page navigation click -> only updates page
  const handlePageChange = (newPage: number) => {
    updateSearchParams({ page: newPage });
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Handle quick status update: on success, close modal and refetch server GET /rooms
  const handleQuickStatusUpdate = async (newStatus: RoomStatus) => {
    if (!statusTargetRoom) return;

    await roomService.updateRoomStatus(statusTargetRoom.id, newStatus);
    setStatusTargetRoom(null);

    // Refetch server with current URL state so items and pagination are 100% accurate
    const currentParams = normalizeRoomQueryParams(searchParams);
    await fetchRooms(currentParams);
  };

  const hasActiveFilters = Boolean(queryParams.search || queryParams.status);
  const totalItems = data?.totalItems ?? 0;
  const items = data?.items ?? [];

  return (
    <AppShell>
      <PageHeader
        title="Quản lý phòng học"
        subtitle="Tra cứu danh sách phòng học, theo dõi sức chứa và quản lý trạng thái hoạt động"
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
              color: '#ffffff',
              backgroundColor: 'var(--color-primary, #1e40af)',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
              transition: 'background-color 0.15s ease'
            }}
          >
            + Thêm phòng học
          </Link>
        }
      />

      {/* Filters bar */}
      <RoomFilters
        search={queryParams.search || ''}
        status={queryParams.status || ''}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onReset={handleResetFilters}
        disabled={isLoading}
      />

      {/* Error alert with retry button */}
      {errorMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
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
            onClick={() => fetchRooms(queryParams)}
            style={{
              padding: '0.375rem 0.875rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: '#991b1b',
              border: '1px solid #fca5a5',
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
        <LoadingState message="Đang tải danh sách phòng học..." />
      ) : items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy phòng học phù hợp"
            description="Không có phòng học nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại."
            actionText="Xóa bộ lọc"
            onAction={handleResetFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có phòng học"
            description="Hệ thống chưa có dữ liệu phòng học nào. Hãy bắt đầu bằng cách tạo mới phòng học đầu tiên."
            actionText="+ Thêm phòng học"
            onAction={() => navigate(`${basePath}/new`)}
          />
        )
      ) : (
        <>
          <RoomTable
            rooms={items}
            basePath={basePath}
            sortBy={queryParams.sortBy}
            sortDirection={queryParams.sortDirection}
            onSortChange={handleSortChange}
            onQuickStatusChange={(room) => setStatusTargetRoom(room)}
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

      {/* Quick Status Modal */}
      {statusTargetRoom && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setStatusTargetRoom(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-status-title"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl, 16px)',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--color-border, #e2e8f0)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--color-border, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h2
                  id="quick-status-title"
                  style={{
                    margin: 0,
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary, #0f172a)'
                  }}
                >
                  Đổi trạng thái phòng học
                </h2>
                <p
                  style={{
                    margin: '0.25rem 0 0',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary, #475569)'
                  }}
                >
                  Phòng:{' '}
                  <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                    {statusTargetRoom.roomCode}
                  </strong>{' '}
                  {statusTargetRoom.roomName ? `(${statusTargetRoom.roomName})` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStatusTargetRoom(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: 'var(--color-text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  lineHeight: 1
                }}
                aria-label="Đóng hộp thoại"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              <RoomStatusControl
                currentStatus={statusTargetRoom.status}
                onStatusChange={handleQuickStatusUpdate}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};
