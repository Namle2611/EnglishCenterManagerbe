import React, { useEffect, useRef, useState } from 'react';
import { classService } from '../../services/class.service';
import { roomService } from '../../services/room.service';
import type { ClassListItem } from '../../types/class.types';
import type { RoomListItem } from '../../types/room.types';
import type {
  CreateSchedulePayload,
  ScheduleDetail,
  UpdateSchedulePayload
} from '../../types/schedule.types';
import {
  DAY_OF_WEEK_OPTIONS,
  formatClassDate,
  formatTimeForInput,
  formatTimeForPayload
} from '../../utils/scheduleHelper';

type ScheduleFormProps =
  | {
      mode: 'create';
      initialData?: never;
      onSubmit: (payload: CreateSchedulePayload) => Promise<void>;
      onCancel: () => void;
      isSubmitting?: boolean;
      serverError?: string | null;
    }
  | {
      mode: 'edit';
      initialData: ScheduleDetail;
      onSubmit: (payload: UpdateSchedulePayload) => Promise<void>;
      onCancel: () => void;
      isSubmitting?: boolean;
      serverError?: string | null;
    };

export const ScheduleForm: React.FC<ScheduleFormProps> = (props) => {
  const {
    mode,
    initialData,
    onCancel,
    isSubmitting = false,
    serverError = null
  } = props;

  // Synchronous guard against rapid double-submits
  const isSubmittingRef = useRef<boolean>(false);

  // Form field states
  const [classId, setClassId] = useState<number | ''>(
    mode === 'edit' ? initialData.classId : ''
  );
  const [roomId, setRoomId] = useState<number | ''>(
    mode === 'edit' ? initialData.roomId : ''
  );
  const [dayOfWeek, setDayOfWeek] = useState<number | ''>(
    mode === 'edit' ? initialData.dayOfWeek : ''
  );
  const [startTime, setStartTime] = useState<string>(
    mode === 'edit' ? formatTimeForInput(initialData.startTime) : ''
  );
  const [endTime, setEndTime] = useState<string>(
    mode === 'edit' ? formatTimeForInput(initialData.endTime) : ''
  );

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Class selection state (Create mode)
  const [classOptions, setClassOptions] = useState<ClassListItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassListItem | null>(null);
  const [classSearch, setClassSearch] = useState<string>('');
  const [isLoadingClasses, setIsLoadingClasses] = useState<boolean>(false);
  const classAbortRef = useRef<AbortController | null>(null);

  // Room selection state (Create & Edit mode)
  const [roomOptions, setRoomOptions] = useState<RoomListItem[]>([]);
  const [roomSearch, setRoomSearch] = useState<string>('');
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const roomAbortRef = useRef<AbortController | null>(null);

  // Check if class is non-modifiable in Edit mode
  const isClassLocked =
    mode === 'edit' &&
    (initialData.classStatus === 'Completed' || initialData.classStatus === 'Cancelled');

  // Check if current room in Edit mode is Inactive or Maintenance
  const isCurrentRoomInactive =
    mode === 'edit' && initialData.roomStatus !== 'Active';

  // Fetch Classes with debounced search (Create mode only)
  useEffect(() => {
    if (mode !== 'create') return;

    const timer = setTimeout(async () => {
      if (classAbortRef.current) {
        classAbortRef.current.abort();
      }
      classAbortRef.current = new AbortController();

      setIsLoadingClasses(true);
      try {
        const res = await classService.getClasses(
          {
            page: 1,
            pageSize: 50,
            search: classSearch.trim() || undefined
          },
          classAbortRef.current.signal
        );

        if (res.success && res.data) {
          // Filter to only Planned and Ongoing classes
          const selectable = res.data.items.filter(
            (c) => c.status === 'Planned' || c.status === 'Ongoing'
          );

          setClassOptions((prev) => {
            const map = new Map<number, ClassListItem>();
            prev.forEach((item) => map.set(item.id, item));
            selectable.forEach((c) => map.set(c.id, c));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        if ((err as Error)?.name === 'CanceledError') return;
        console.error('Failed to load classes:', err);
      } finally {
        setIsLoadingClasses(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [classSearch, mode]);

  // Fetch Active Rooms with debounced search
  useEffect(() => {
    if (isClassLocked) return;

    const timer = setTimeout(async () => {
      if (roomAbortRef.current) {
        roomAbortRef.current.abort();
      }
      roomAbortRef.current = new AbortController();

      setIsLoadingRooms(true);
      try {
        const res = await roomService.getRooms(
          {
            page: 1,
            pageSize: 50,
            status: 'Active',
            search: roomSearch.trim() || undefined
          },
          roomAbortRef.current.signal
        );

        if (res.success && res.data) {
          setRoomOptions((prev) => {
            const map = new Map<number, RoomListItem>();
            prev.forEach((item) => map.set(item.id, item));
            res.data.items.forEach((r) => map.set(r.id, r));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        if ((err as Error)?.name === 'CanceledError') return;
        console.error('Failed to load rooms:', err);
      } finally {
        setIsLoadingRooms(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [roomSearch, isClassLocked]);

  // Handle Class Selection
  const handleClassSelect = (idStr: string) => {
    if (!idStr) {
      setClassId('');
      setSelectedClass(null);
      return;
    }

    const idNum = Number(idStr);
    setClassId(idNum);
    const found = classOptions.find((c) => c.id === idNum) || null;
    setSelectedClass(found);
    if (errors.classId) {
      setErrors((prev) => ({ ...prev, classId: '' }));
    }
  };

  // Client Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Class
    if (mode === 'create') {
      if (!classId || Number(classId) <= 0) {
        newErrors.classId = 'Vui lòng chọn lớp học.';
      }
    }

    // 2. Room
    if (!roomId || Number(roomId) <= 0) {
      newErrors.roomId = 'Vui lòng chọn phòng học.';
    } else if (mode === 'edit' && isCurrentRoomInactive && Number(roomId) === initialData.roomId) {
      newErrors.roomId = 'Phòng học hiện tại không còn hoạt động. Vui lòng chọn phòng học đang hoạt động khác.';
    }

    // 3. Day of Week
    if (!dayOfWeek || Number(dayOfWeek) < 1 || Number(dayOfWeek) > 7) {
      newErrors.dayOfWeek = 'Vui lòng chọn thứ trong tuần.';
    }

    // 4. Start Time & End Time
    if (!startTime.trim()) {
      newErrors.startTime = 'Giờ bắt đầu là bắt buộc.';
    }

    if (!endTime.trim()) {
      newErrors.endTime = 'Giờ kết thúc là bắt buộc.';
    }

    if (startTime.trim() && endTime.trim()) {
      if (endTime.trim() <= startTime.trim()) {
        newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler with Synchronous Request Guard
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isClassLocked) return;

    // Drop synchronous duplicate clicks
    if (isSubmittingRef.current || isSubmitting) return;

    if (!validate()) return;

    isSubmittingRef.current = true;

    try {
      if (mode === 'create') {
        const payload: CreateSchedulePayload = {
          classId: Number(classId),
          roomId: Number(roomId),
          dayOfWeek: Number(dayOfWeek),
          startTime: formatTimeForPayload(startTime),
          endTime: formatTimeForPayload(endTime)
        };
        await (props as { onSubmit: (payload: CreateSchedulePayload) => Promise<void> }).onSubmit(payload);
      } else {
        const payload: UpdateSchedulePayload = {
          roomId: Number(roomId),
          dayOfWeek: Number(dayOfWeek),
          startTime: formatTimeForPayload(startTime),
          endTime: formatTimeForPayload(endTime)
        };
        await (props as { onSubmit: (payload: UpdateSchedulePayload) => Promise<void> }).onSubmit(payload);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '680px' }} noValidate>
      {/* Server Error Alert (Retains form values, no redirect) */}
      {serverError && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--status-danger-bg, #fee2e2)',
            color: 'var(--status-danger-text, #b91c1c)',
            border: '1px solid var(--status-danger-border, #fecaca)',
            borderRadius: 'var(--radius-lg, 12px)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            lineHeight: 1.5
          }}
          role="alert"
        >
          <strong>Lỗi xếp lịch:</strong> {serverError}
        </div>
      )}

      {/* Warning Alert: Completed or Cancelled Class in Edit Mode */}
      {isClassLocked && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--status-warning-bg, #fef3c7)',
            color: 'var(--status-warning-text, #b45309)',
            border: '1px solid var(--status-warning-border, #fde68a)',
            borderRadius: 'var(--radius-lg, 12px)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            lineHeight: 1.5
          }}
          role="alert"
        >
          <strong>Không thể chỉnh sửa:</strong> Lớp học này đã ở trạng thái{' '}
          <strong>{initialData.classStatus === 'Completed' ? 'Đã hoàn thành' : 'Đã hủy'}</strong>.
          Lịch học chỉ có thể xem chi tiết hoặc xóa vĩnh viễn.
        </div>
      )}

      {/* Warning Alert: Inactive or Maintenance Room in Edit Mode */}
      {isCurrentRoomInactive && !isClassLocked && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--status-warning-bg, #fef3c7)',
            color: 'var(--status-warning-text, #b45309)',
            border: '1px solid var(--status-warning-border, #fde68a)',
            borderRadius: 'var(--radius-lg, 12px)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            lineHeight: 1.5
          }}
          role="alert"
        >
          <strong>Cảnh báo phòng học:</strong> Phòng học hiện tại (
          <strong>{initialData.roomCode}</strong>) đang ở trạng thái{' '}
          <strong>{initialData.roomStatus === 'Inactive' ? 'Ngừng hoạt động' : 'Đang bảo trì'}</strong>.
          Vui lòng chọn một phòng học đang hoạt động khác để lưu cập nhật.
        </div>
      )}

      <div
        style={{
          backgroundColor: 'var(--color-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {/* Class Section */}
        {mode === 'create' ? (
          <div>
            <label
              htmlFor="schedule-class-select"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #0f172a)',
                marginBottom: '0.375rem'
              }}
            >
              Lớp học <span style={{ color: 'var(--status-danger-text, #b91c1c)' }}>*</span>
            </label>

            {/* Quick search input for class */}
            <input
              type="text"
              placeholder="Tìm theo mã lớp hoặc tên khóa học..."
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8125rem',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--color-border, #cbd5e1)',
                backgroundColor: 'var(--color-canvas, #f8fafc)',
                color: 'var(--color-text-primary, #0f172a)',
                marginBottom: '0.5rem',
                outline: 'none'
              }}
            />

            <select
              id="schedule-class-select"
              value={classId}
              onChange={(e) => handleClassSelect(e.target.value)}
              disabled={isSubmitting || isLoadingClasses}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md, 8px)',
                border: `1px solid ${errors.classId ? 'var(--status-danger-text, #b91c1c)' : 'var(--color-border, #cbd5e1)'}`,
                backgroundColor: 'var(--color-surface, #ffffff)',
                color: 'var(--color-text-primary, #0f172a)',
                outline: 'none'
              }}
            >
              <option value="">-- Chọn lớp học (Chỉ lớp Dự kiến hoặc Đang diễn ra) --</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.classCode} - {c.courseName} ({c.status})
                </option>
              ))}
            </select>
            {errors.classId && (
              <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--status-danger-text, #b91c1c)' }}>
                {errors.classId}
              </p>
            )}

            {/* Context Card upon Class Selection */}
            {selectedClass && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.875rem 1rem',
                  backgroundColor: 'var(--color-canvas, #f8fafc)',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  fontSize: '0.8125rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Khóa học: </span>
                  <strong>{selectedClass.courseName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Giảng viên: </span>
                  <strong>{selectedClass.teacherName || 'Chưa phân công'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Giai đoạn: </span>
                  <strong>
                    {formatClassDate(selectedClass.startDate)} – {formatClassDate(selectedClass.endDate)}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Trạng thái: </span>
                  <strong style={{ color: 'var(--color-primary, #2563eb)' }}>{selectedClass.status}</strong>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Edit Mode: Read-only Class context */
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #0f172a)',
                marginBottom: '0.375rem'
              }}
            >
              Lớp học (Cố định, không thể thay đổi)
            </span>
            <div
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--color-surface-subtle, #f1f5f9)',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--color-border, #cbd5e1)',
                fontSize: '0.875rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.5rem'
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Mã lớp: </span>
                <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{initialData.classCode}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Khóa học: </span>
                <strong>{initialData.courseName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Giảng viên: </span>
                <strong>{initialData.teacherName || 'Chưa phân công'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted, #94a3b8)' }}>Giai đoạn: </span>
                <strong>
                  {formatClassDate(initialData.classStartDate)} – {formatClassDate(initialData.classEndDate)}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Room Section */}
        <div>
          <label
            htmlFor="schedule-room-select"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary, #0f172a)',
              marginBottom: '0.375rem'
            }}
          >
            Phòng học <span style={{ color: 'var(--status-danger-text, #b91c1c)' }}>*</span>
          </label>

          {/* Quick search input for room */}
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên phòng..."
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
            disabled={isSubmitting || isClassLocked}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: 'var(--color-canvas, #f8fafc)',
              color: 'var(--color-text-primary, #0f172a)',
              marginBottom: '0.5rem',
              outline: 'none'
            }}
          />

          <select
            id="schedule-room-select"
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value ? Number(e.target.value) : '');
              if (errors.roomId) setErrors((prev) => ({ ...prev, roomId: '' }));
            }}
            disabled={isSubmitting || isLoadingRooms || isClassLocked}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: `1px solid ${errors.roomId ? 'var(--status-danger-text, #b91c1c)' : 'var(--color-border, #cbd5e1)'}`,
              backgroundColor: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text-primary, #0f172a)',
              outline: 'none'
            }}
          >
            <option value="">-- Chọn phòng học (Đang hoạt động) --</option>

            {/* In Edit mode: preserve current room if inactive/maintenance so it doesn't vanish */}
            {mode === 'edit' && isCurrentRoomInactive && (
              <option value={initialData.roomId} disabled>
                {initialData.roomCode}{' '}
                {initialData.roomName ? `(${initialData.roomName})` : ''} — [
                {initialData.roomStatus === 'Inactive' ? 'Ngừng hoạt động' : 'Bảo trì'}] (Hiện tại)
              </option>
            )}

            {roomOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.roomCode} {r.roomName ? `(${r.roomName})` : ''} - Sức chứa: {r.capacity}
              </option>
            ))}
          </select>
          {errors.roomId && (
            <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--status-danger-text, #b91c1c)' }}>
              {errors.roomId}
            </p>
          )}
        </div>

        {/* Day of Week Section */}
        <div>
          <label
            htmlFor="schedule-day-select"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary, #0f172a)',
              marginBottom: '0.375rem'
            }}
          >
            Thứ trong tuần <span style={{ color: 'var(--status-danger-text, #b91c1c)' }}>*</span>
          </label>
          <select
            id="schedule-day-select"
            value={dayOfWeek}
            onChange={(e) => {
              setDayOfWeek(e.target.value ? Number(e.target.value) : '');
              if (errors.dayOfWeek) setErrors((prev) => ({ ...prev, dayOfWeek: '' }));
            }}
            disabled={isSubmitting || isClassLocked}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: `1px solid ${errors.dayOfWeek ? 'var(--status-danger-text, #b91c1c)' : 'var(--color-border, #cbd5e1)'}`,
              backgroundColor: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text-primary, #0f172a)',
              outline: 'none'
            }}
          >
            <option value="">-- Chọn thứ trong tuần --</option>
            {DAY_OF_WEEK_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          {errors.dayOfWeek && (
            <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--status-danger-text, #b91c1c)' }}>
              {errors.dayOfWeek}
            </p>
          )}
        </div>

        {/* Time Inputs Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Start Time */}
          <div>
            <label
              htmlFor="schedule-start-time"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #0f172a)',
                marginBottom: '0.375rem'
              }}
            >
              Giờ bắt đầu <span style={{ color: 'var(--status-danger-text, #b91c1c)' }}>*</span>
            </label>
            <input
              id="schedule-start-time"
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: '' }));
              }}
              disabled={isSubmitting || isClassLocked}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md, 8px)',
                border: `1px solid ${errors.startTime ? 'var(--status-danger-text, #b91c1c)' : 'var(--color-border, #cbd5e1)'}`,
                backgroundColor: 'var(--color-surface, #ffffff)',
                color: 'var(--color-text-primary, #0f172a)',
                outline: 'none'
              }}
            />
            {errors.startTime && (
              <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--status-danger-text, #b91c1c)' }}>
                {errors.startTime}
              </p>
            )}
          </div>

          {/* End Time */}
          <div>
            <label
              htmlFor="schedule-end-time"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #0f172a)',
                marginBottom: '0.375rem'
              }}
            >
              Giờ kết thúc <span style={{ color: 'var(--status-danger-text, #b91c1c)' }}>*</span>
            </label>
            <input
              id="schedule-end-time"
              type="time"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                if (errors.endTime) setErrors((prev) => ({ ...prev, endTime: '' }));
              }}
              disabled={isSubmitting || isClassLocked}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md, 8px)',
                border: `1px solid ${errors.endTime ? 'var(--status-danger-text, #b91c1c)' : 'var(--color-border, #cbd5e1)'}`,
                backgroundColor: 'var(--color-surface, #ffffff)',
                color: 'var(--color-text-primary, #0f172a)',
                outline: 'none'
              }}
            />
            {errors.endTime && (
              <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--status-danger-text, #b91c1c)' }}>
                {errors.endTime}
              </p>
            )}
          </div>
        </div>

        {/* Informational helper text */}
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary, #475569)' }}>
          * Hệ thống sẽ tự động kiểm tra trùng lặp phòng học, lịch học của lớp và lịch dạy của giảng viên khi lưu.
        </p>

        {/* Actions Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border, #e2e8f0)'
          }}
        >
          <button
            id="schedule-form-cancel-btn"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              backgroundColor: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text-secondary, #475569)',
              border: '1px solid var(--color-border, #cbd5e1)',
              borderRadius: 'var(--radius-md, 8px)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            Hủy
          </button>

          <button
            id="schedule-form-submit-btn"
            type="submit"
            disabled={isSubmitting || isClassLocked}
            style={{
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: 'var(--color-text-inverse, #ffffff)',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              cursor: isSubmitting || isClassLocked ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || isClassLocked ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
            }}
          >
            {isSubmitting ? (
              <>
                <span>⏳</span> Đang lưu...
              </>
            ) : mode === 'create' ? (
              'Lưu lịch học'
            ) : (
              'Cập nhật lịch học'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
