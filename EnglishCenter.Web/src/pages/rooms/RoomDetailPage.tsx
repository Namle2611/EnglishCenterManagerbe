import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { RoomStatusBadge } from '../../components/rooms/RoomStatusBadge';
import { RoomStatusControl } from '../../components/rooms/RoomStatusControl';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { roomService } from '../../services/room.service';
import type { RoomDetail, RoomStatus } from '../../types/room.types';
import { getRoomApiErrorMessage, getRoomBasePath } from '../../utils/roomHelper';

export const RoomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getRoomBasePath(location.pathname);

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(
    (location.state as { flashMessage?: string } | null)?.flashMessage || null
  );

  const roomId = parseInt(id || '', 10);

  const fetchDetail = useCallback(async (signal?: AbortSignal) => {
    if (isNaN(roomId) || roomId <= 0) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);

    try {
      const response = await roomService.getRoomById(roomId, signal);
      if (response.success && response.data) {
        setRoom(response.data);
      } else {
        setErrorMessage(response.message || 'Không thể tải thông tin phòng học.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setIsNotFound(true);
      } else {
        setErrorMessage(getRoomApiErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetail(controller.signal);
    return () => controller.abort();
  }, [fetchDetail]);

  // Handle status update via RoomStatusControl
  const handleStatusChange = async (newStatus: RoomStatus) => {
    if (!room) return;

    const response = await roomService.updateRoomStatus(room.id, newStatus);
    if (response.success && response.data) {
      setRoom(response.data);
      setFlashMessage(`Trạng thái phòng học đã được chuyển sang "${newStatus}".`);
    }
  };

  return (
    <AppShell>
      {/* Breadcrumb / Back Navigation */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to={basePath}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--color-primary, #1e40af)',
            textDecoration: 'none'
          }}
        >
          &larr; Quay lại danh sách phòng học
        </Link>
      </div>

      {/* Flash Success Notification */}
      {flashMessage && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            backgroundColor: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-lg, 12px)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{flashMessage}</span>
          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#166534',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Loading / 404 / Error / View */}
      {isLoading ? (
        <LoadingState message="Đang tải chi tiết phòng học..." />
      ) : isNotFound ? (
        <EmptyState
          title="Không tìm thấy phòng học"
          description={`Phòng học với mã định danh #${id} không tồn tại hoặc đã bị gỡ khỏi hệ thống.`}
          actionText="Quay lại danh sách phòng học"
          onAction={() => navigate(basePath)}
        />
      ) : errorMessage ? (
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
        >
          <div>
            <strong>Lỗi:</strong> {errorMessage}
          </div>
          <button
            type="button"
            onClick={() => fetchDetail()}
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
      ) : room ? (
        <>
          <PageHeader
            title={`Phòng: ${room.roomCode}`}
            subtitle={room.roomName ? room.roomName : 'Chưa đặt tên riêng cho phòng học'}
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link
                  to={`${basePath}/${room.id}/edit`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: 'var(--color-primary, #1e40af)',
                    border: 'none',
                    borderRadius: 'var(--radius-md, 8px)',
                    textDecoration: 'none',
                    boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
                  }}
                >
                  Chỉnh sửa
                </Link>
              </div>
            }
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* General Info Card */}
            <div
              style={{
                backgroundColor: 'var(--color-surface, #ffffff)',
                borderRadius: 'var(--radius-lg, 12px)',
                border: '1px solid var(--color-border, #e2e8f0)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
              }}
            >
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #0f172a)',
                  margin: '0 0 1.25rem 0'
                }}
              >
                Thông tin phòng học
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={labelStyle}>Mã định danh hệ thống</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #0f172a)', fontFamily: 'monospace' }}>
                    #{room.id}
                  </div>
                </div>

                <div>
                  <span style={labelStyle}>Mã phòng học</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #0f172a)', fontFamily: 'monospace', fontSize: '1rem' }}>
                    {room.roomCode}
                  </div>
                </div>

                <div>
                  <span style={labelStyle}>Tên phòng học</span>
                  <div>
                    {room.roomName ? (
                      <span style={{ fontWeight: 500, color: 'var(--color-text-primary, #0f172a)' }}>{room.roomName}</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted, #94a3b8)', fontStyle: 'italic' }}>Chưa đặt tên</span>
                    )}
                  </div>
                </div>

                <div>
                  <span style={labelStyle}>Sức chứa thiết kế</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
                    {room.capacity} chỗ ngồi
                  </div>
                </div>

                <div>
                  <span style={labelStyle}>Trạng thái hoạt động</span>
                  <div style={{ marginTop: '0.25rem' }}>
                    <RoomStatusBadge status={room.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Control Card */}
            <div>
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #0f172a)',
                  margin: '0 0 0.75rem 0'
                }}
              >
                Quản lý trạng thái
              </h2>
              <RoomStatusControl
                currentStatus={room.status}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        </>
      ) : null}
    </AppShell>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted, #64748b)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '0.25rem'
};
