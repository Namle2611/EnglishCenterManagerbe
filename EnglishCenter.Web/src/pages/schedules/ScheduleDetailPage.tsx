import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ScheduleDeleteDialog } from '../../components/schedules/ScheduleDeleteDialog';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { scheduleService } from '../../services/schedule.service';
import type { ScheduleDetail } from '../../types/schedule.types';
import {
  DAY_OF_WEEK_LABELS,
  formatClassDate,
  formatTimeRange,
  getScheduleApiErrorMessage,
  getScheduleBasePath
} from '../../utils/scheduleHelper';

export const ScheduleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getScheduleBasePath(location.pathname);

  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const [flashMessage, setFlashMessage] = useState<string | null>(
    (location.state as { flashMessage?: string } | null)?.flashMessage || null
  );

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

  const handleDeleteConfirm = async () => {
    if (!schedule) return;

    await scheduleService.deleteSchedule(schedule.id);
    navigate(basePath, {
      state: { flashMessage: 'Đã xóa lịch học thành công.' },
      replace: true
    });
  };

  const dayLabel = schedule ? (DAY_OF_WEEK_LABELS[schedule.dayOfWeek] || `Thứ ${schedule.dayOfWeek}`) : '';
  const timeRange = schedule ? formatTimeRange(schedule.startTime, schedule.endTime) : '';
  const roomDisplay = schedule
    ? schedule.roomName
      ? `${schedule.roomCode} (${schedule.roomName})`
      : `${schedule.roomCode} (Chưa đặt tên)`
    : '';
  const teacherDisplay = schedule?.teacherName || 'Chưa phân công';

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

      {/* Main Content: Loading / 404 / Error / Details */}
      {isLoading ? (
        <LoadingState message="Đang tải chi tiết lịch học..." />
      ) : isNotFound ? (
        <EmptyState
          title="Không tìm thấy lịch học"
          description={`Lịch học với mã định danh #${id} không tồn tại hoặc đã bị gỡ khỏi hệ thống.`}
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
            title={`Lịch học: ${schedule.classCode} – ${dayLabel} (${timeRange})`}
            subtitle={`Phòng ${roomDisplay}`}
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link
                  to={`${basePath}/${schedule.id}/edit`}
                  style={{
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-inverse, #ffffff)',
                    backgroundColor: 'var(--color-primary, #2563eb)',
                    borderRadius: 'var(--radius-md, 8px)',
                    textDecoration: 'none',
                    boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}
                >
                  ✏️ Chỉnh sửa
                </Link>

                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--status-danger-text, #b91c1c)',
                    backgroundColor: 'var(--color-surface, #ffffff)',
                    border: '1px solid var(--status-danger-border, #fecaca)',
                    borderRadius: 'var(--radius-md, 8px)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}
                >
                  🗑️ Xóa
                </button>
              </div>
            }
          />

          {/* Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
              marginTop: '1.25rem'
            }}
          >
            {/* Class Info Card */}
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
                  margin: '0 0 1rem 0',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #0f172a)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🏫 Thông tin lớp học
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Mã lớp:</span>
                  <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{schedule.classCode}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Khóa học:</span>
                  <span style={{ color: 'var(--color-text-primary, #0f172a)' }}>{schedule.courseName}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Trạng thái lớp:</span>
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full, 9999px)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor:
                        schedule.classStatus === 'Planned'
                          ? 'var(--color-primary-subtle, #eff6ff)'
                          : schedule.classStatus === 'Ongoing'
                            ? 'var(--status-active-bg, #dcfce7)'
                            : 'var(--status-inactive-bg, #f1f5f9)',
                      color:
                        schedule.classStatus === 'Planned'
                          ? 'var(--color-primary, #2563eb)'
                          : schedule.classStatus === 'Ongoing'
                            ? 'var(--status-active-text, #15803d)'
                            : 'var(--status-inactive-text, #475569)',
                      border: '1px solid var(--color-border, #e2e8f0)'
                    }}
                  >
                    {schedule.classStatus}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Giảng viên:</span>
                  <span
                    style={{
                      color: schedule.teacherName
                        ? 'var(--color-text-primary, #0f172a)'
                        : 'var(--color-text-muted, #94a3b8)',
                      fontStyle: schedule.teacherName ? 'normal' : 'italic'
                    }}
                  >
                    {teacherDisplay}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Giai đoạn lớp học:</span>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-primary, #0f172a)' }}>
                    {formatClassDate(schedule.classStartDate)} – {formatClassDate(schedule.classEndDate)}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--color-canvas, #f8fafc)',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary, #475569)',
                    lineHeight: 1.4
                  }}
                >
                  ℹ️ Lịch học này lặp lại hàng tuần trong suốt thời gian lớp học diễn ra (từ{' '}
                  {formatClassDate(schedule.classStartDate)} đến {formatClassDate(schedule.classEndDate)}).
                </div>
              </div>
            </div>

            {/* Room & Time Info Card */}
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
                  margin: '0 0 1rem 0',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #0f172a)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                🚪 Phòng học & Khung giờ
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Mã phòng:</span>
                  <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{schedule.roomCode}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Tên phòng:</span>
                  <span style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                    {schedule.roomName || 'Chưa đặt tên'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Trạng thái phòng:</span>
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full, 9999px)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor:
                        schedule.roomStatus === 'Active'
                          ? 'var(--status-active-bg, #dcfce7)'
                          : 'var(--status-warning-bg, #fef3c7)',
                      color:
                        schedule.roomStatus === 'Active'
                          ? 'var(--status-active-text, #15803d)'
                          : 'var(--status-warning-text, #b45309)',
                      border: '1px solid var(--color-border, #e2e8f0)'
                    }}
                  >
                    {schedule.roomStatus === 'Active' ? 'Đang hoạt động' : schedule.roomStatus}
                  </span>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border, #e2e8f0)', margin: '0.25rem 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Thứ trong tuần:</span>
                  <strong style={{ color: 'var(--color-primary, #2563eb)' }}>{dayLabel}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Khung giờ:</span>
                  <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{timeRange}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Giờ bắt đầu:</span>
                  <span>{schedule.startTime}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary, #475569)' }}>Giờ kết thúc:</span>
                  <span>{schedule.endTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Dialog */}
          <ScheduleDeleteDialog
            schedule={schedule}
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDeleteConfirm}
          />
        </>
      ) : null}
    </AppShell>
  );
};
