import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { RoomForm } from '../../components/rooms/RoomForm';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { roomService } from '../../services/room.service';
import type { RoomDetail, UpdateRoomPayload } from '../../types/room.types';
import { getRoomApiErrorMessage, getRoomBasePath } from '../../utils/roomHelper';

export const RoomEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getRoomBasePath(location.pathname);

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

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

  const handleEditSubmit = async (payload: UpdateRoomPayload) => {
    if (!room) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await roomService.updateRoom(room.id, payload);
      if (response.success && response.data) {
        navigate(`${basePath}/${room.id}`, {
          state: { flashMessage: 'Cập nhật phòng học thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể cập nhật phòng học.');
      }
    } catch (err: unknown) {
      setServerError(getRoomApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      {/* Breadcrumb / Back Navigation */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to={room ? `${basePath}/${room.id}` : basePath}
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
          &larr; {room ? `Quay lại chi tiết phòng ${room.roomCode}` : 'Quay lại danh sách'}
        </Link>
      </div>

      {isLoading ? (
        <LoadingState message="Đang tải dữ liệu phòng học..." />
      ) : isNotFound ? (
        <EmptyState
          title="Không tìm thấy phòng học"
          description={`Phòng học với mã định danh #${id} không tồn tại để chỉnh sửa.`}
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
            title={`Chỉnh sửa phòng: ${room.roomCode}`}
            subtitle="Cập nhật tên phòng hoặc điều chỉnh sức chứa thiết kế"
          />

          <RoomForm
            mode="edit"
            initialData={room}
            onSubmit={handleEditSubmit}
            onCancel={() => navigate(`${basePath}/${room.id}`)}
            isSubmitting={isSubmitting}
            serverError={serverError}
          />
        </>
      ) : null}
    </AppShell>
  );
};
