import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ScheduleForm } from '../../components/schedules/ScheduleForm';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { scheduleService } from '../../services/schedule.service';
import type { CreateSchedulePayload } from '../../types/schedule.types';
import { getScheduleApiErrorMessage, getScheduleBasePath } from '../../utils/scheduleHelper';

export const ScheduleCreatePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getScheduleBasePath(location.pathname);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleCreateSubmit = async (payload: CreateSchedulePayload) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await scheduleService.createSchedule(payload);
      if (response.success && response.data) {
        navigate(`${basePath}/${response.data.id}`, {
          state: { flashMessage: 'Xếp lịch học thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể xếp lịch học.');
      }
    } catch (err: unknown) {
      setServerError(getScheduleApiErrorMessage(err));
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
            color: 'var(--color-primary, #2563eb)',
            textDecoration: 'none'
          }}
        >
          &larr; Quay lại danh sách lịch học
        </Link>
      </div>

      <PageHeader
        title="Xếp lịch học mới"
        subtitle="Chọn lớp học, phòng học và thiết lập khung giờ học định kỳ hàng tuần"
      />

      <ScheduleForm
        mode="create"
        onSubmit={handleCreateSubmit}
        onCancel={() => navigate(basePath)}
        isSubmitting={isSubmitting}
        serverError={serverError}
      />
    </AppShell>
  );
};
