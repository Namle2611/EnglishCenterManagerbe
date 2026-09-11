import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { RoomForm } from '../../components/rooms/RoomForm';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { roomService } from '../../services/room.service';
import type { CreateRoomPayload } from '../../types/room.types';
import { getRoomApiErrorMessage, getRoomBasePath } from '../../utils/roomHelper';

export const RoomCreatePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getRoomBasePath(location.pathname);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleCreateSubmit = async (payload: CreateRoomPayload) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await roomService.createRoom(payload);
      if (response.success && response.data) {
        navigate(`${basePath}/${response.data.id}`, {
          state: { flashMessage: 'Tạo phòng học thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể tạo phòng học.');
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

      <PageHeader
        title="Thêm phòng học mới"
        subtitle="Khởi tạo mã phòng, đặt tên tùy chọn và cấu hình sức chứa ban đầu"
      />

      <RoomForm
        mode="create"
        onSubmit={handleCreateSubmit}
        onCancel={() => navigate(basePath)}
        isSubmitting={isSubmitting}
        serverError={serverError}
      />
    </AppShell>
  );
};
