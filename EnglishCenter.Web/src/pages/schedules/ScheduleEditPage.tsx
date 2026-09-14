import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ScheduleForm } from '../../components/schedules/ScheduleForm';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { scheduleService } from '../../services/schedule.service';
import type { ScheduleDetail, UpdateSchedulePayload } from '../../types/schedule.types';
import { getScheduleApiErrorMessage, getScheduleBasePath } from '../../utils/scheduleHelper';

export const ScheduleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getScheduleBasePath(location.pathname);

  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const scheduleId = parseInt(id || '', 10);

  const fetchDetail = useCallback(async (signal?: AbortSignal) => {
    if (isNaN(scheduleId) || scheduleId <= 0) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);

    try {
      const response = await scheduleService.getScheduleById(scheduleId, signal);
      if (response.success && response.data) {
        setSchedule(response.data);
      } else {
        setErrorMessage(response.message || 'Không thể tải thông tin lịch học.');
      }
    } catch (err: unknown) {
      if (axios.isCancel(err) || (err as Error)?.name === 'CanceledError') {
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setIsNotFound(true);
      } else {
        setErrorMessage(getScheduleApiErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetail(controller.signal);
    return () => controller.abort();
  }, [fetchDetail]);

  const handleEditSubmit = async (payload: UpdateSchedulePayload) => {
    if (!schedule) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await scheduleService.updateSchedule(schedule.id, payload);
      if (response.success && response.data) {
        navigate(`${basePath}/${schedule.id}`, {
          state: { flashMessage: 'Cập nhật lịch học thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể cập nhật lịch học.');
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
          to={schedule ? `${basePath}/${schedule.id}` : basePath}
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
          &larr; {schedule ? `Quay lại chi tiết lịch học ${schedule.classCode}` : 'Quay lại danh sách'}
        </Link>
      </div>

      {isLoading ? (
        <LoadingState message="Đang tải dữ liệu lịch học..." />
      ) : isNotFound ? (
        <EmptyState
          title="Không tìm thấy lịch học"
          description={`Lịch học với mã định danh #${id} không tồn tại để chỉnh sửa.`}
          actionText="Quay lại danh sách lịch học"
          onAction={() => navigate(basePath)}
        />
      ) : errorMessage ? (
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
            <strong>Lỗi:</strong> {errorMessage}
          </div>
          <button
            type="button"
            onClick={() => fetchDetail()}
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
      ) : schedule ? (
        <>
          <PageHeader
            title={`Chỉnh sửa lịch học: ${schedule.classCode}`}
            subtitle="Điều chỉnh phòng học, thứ hoặc khung giờ học hàng tuần (Mã lớp là cố định)"
          />

          <ScheduleForm
            mode="edit"
            initialData={schedule}
            onSubmit={handleEditSubmit}
            onCancel={() => navigate(`${basePath}/${schedule.id}`)}
            isSubmitting={isSubmitting}
            serverError={serverError}
          />
        </>
      ) : null}
    </AppShell>
  );
};
