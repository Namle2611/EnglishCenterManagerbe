import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { attendanceService } from '../../services/attendance.service';
import { classService } from '../../services/class.service';
import { scheduleService } from '../../services/schedule.service';
import type { TeacherClassLookupItem, TeacherClassScheduleItem } from '../../types/attendance.types';
import type { ClassListItem } from '../../types/class.types';
import type { ScheduleListItem } from '../../types/schedule.types';
import {
  getDayOfWeekLabel,
  isValidCalendarDate,
  toDisplayTime,
  toWireTime
} from '../../utils/attendanceHelper';

interface CommonSchedule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomInfo: string;
}

interface SessionSelectorProps {
  selectedClassId: number | null;
  selectedSessionDate: string;
  selectedStartTime: string;
  onClassSelect: (classId: number | null) => void;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({
  selectedClassId,
  selectedSessionDate,
  selectedStartTime,
  onClassSelect,
  onDateChange,
  onTimeChange,
  onSubmit,
  isLoading = false,
  disabled = false
}) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r.toUpperCase() === 'ADMIN') ?? false;
  const isStaff = user?.roles?.some((r) => r.toUpperCase() === 'STAFF') ?? false;
  const isTeacher = user?.roles?.some((r) => r.toUpperCase() === 'TEACHER') ?? false;

  // Class list states
  const [adminClasses, setAdminClasses] = useState<ClassListItem[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassLookupItem[]>([]);
  const [classSearch, setClassSearch] = useState<string>('');
  const [classPage, setClassPage] = useState<number>(1);
  const [classTotalPages, setClassTotalPages] = useState<number>(1);
  const [isLoadingClasses, setIsLoadingClasses] = useState<boolean>(false);

  // Schedules loading state
  const [isLoadingSchedules, setIsLoadingSchedules] = useState<boolean>(false);

  // Fetch classes by role
  const fetchClasses = useCallback(
    async (page: number, search: string, append = false) => {
      setIsLoadingClasses(true);
      try {
        if (isTeacher) {
          const res = await attendanceService.getTeacherClassesLookup({
            page,
            pageSize: 20,
            search: search || undefined
          });
          if (res.success && res.data) {
            setTeacherClasses((prev) => (append ? [...prev, ...res.data.items] : res.data.items));
            setClassTotalPages(res.data.totalPages || 1);
            setClassPage(page);
          }
        } else if (isAdmin || isStaff) {
          const res = await classService.getClasses({
            page,
            pageSize: 20,
            search: search || undefined
          });
          if (res.success && res.data) {
            setAdminClasses((prev) => (append ? [...prev, ...res.data.items] : res.data.items));
            setClassTotalPages(res.data.totalPages || 1);
            setClassPage(page);
          }
        }
      } catch {
        // Silently handle error
      } finally {
        setIsLoadingClasses(false);
      }
    },
    [isAdmin, isStaff, isTeacher]
  );

  // Initial class fetch via microtask to avoid synchronous setState in effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses(1, '');
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchClasses]);

  // Admin/Staff schedule list state
  const [adminSchedules, setAdminSchedules] = useState<CommonSchedule[]>([]);

  // Update schedule guidance whenever selectedClassId changes
  useEffect(() => {
    if (!selectedClassId || isTeacher) {
      return;
    }

    if (isAdmin || isStaff) {
      let isSubscribed = true;
      const timer = setTimeout(() => {
        setIsLoadingSchedules(true);
        scheduleService
          .getSchedules({ classId: selectedClassId, pageSize: 50 })
          .then((res) => {
            if (!isSubscribed) return;
            if (res.success && res.data) {
              const mapped: CommonSchedule[] = res.data.items.map((s: ScheduleListItem) => ({
                id: s.id,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                roomInfo: s.roomName ? `${s.roomCode} - ${s.roomName}` : s.roomCode
              }));
              setAdminSchedules(mapped);
            }
          })
          .catch(() => {
            if (isSubscribed) setAdminSchedules([]);
          })
          .finally(() => {
            if (isSubscribed) setIsLoadingSchedules(false);
          });
      }, 0);

      return () => {
        isSubscribed = false;
        clearTimeout(timer);
      };
    }
  }, [selectedClassId, isTeacher, isAdmin, isStaff]);

  // Derive schedules: if teacher, derive directly from teacherClasses; if admin/staff, use adminSchedules
  const schedules: CommonSchedule[] = React.useMemo(() => {
    if (isTeacher && selectedClassId) {
      const found = teacherClasses.find((c) => c.classId === selectedClassId);
      if (found && found.schedules) {
        return found.schedules.map((s: TeacherClassScheduleItem) => ({
          id: s.scheduleId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          roomInfo: s.roomName ? `${s.roomCode} - ${s.roomName}` : s.roomCode
        }));
      }
      return [];
    }
    return adminSchedules;
  }, [isTeacher, selectedClassId, teacherClasses, adminSchedules]);

  const isValidSession =
    Boolean(selectedClassId && selectedClassId > 0) &&
    Boolean(selectedSessionDate && isValidCalendarDate(selectedSessionDate)) &&
    Boolean(selectedStartTime && selectedStartTime.trim().length > 0);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <h3
        style={{
          margin: '0 0 1rem 0',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <span>🎯</span> Chọn thông tin buổi học
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          alignItems: 'flex-start'
        }}
      >
        {/* Class Selection */}
        <div>
          <label style={labelStyle}>
            Lớp học <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <input
            id="session-class-search-input"
            type="text"
            placeholder="Tìm mã hoặc tên lớp..."
            value={classSearch}
            onChange={(e) => {
              setClassSearch(e.target.value);
              fetchClasses(1, e.target.value);
            }}
            disabled={disabled}
            style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.375rem 0.625rem', marginBottom: '0.375rem' }}
          />
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <select
              id="session-class-select"
              value={selectedClassId || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                onClassSelect(val);
              }}
              disabled={disabled || isLoadingClasses}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="">-- Chọn lớp học --</option>
              {isTeacher
                ? teacherClasses.map((cl) => (
                    <option key={cl.classId} value={cl.classId}>
                      {cl.classCode} ({cl.courseCode}) - {cl.status} [{cl.enrolledStudentCount}/{cl.maxStudents} HV]
                    </option>
                  ))
                : adminClasses.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.classCode} ({cl.courseCode}) - {cl.status}
                    </option>
                  ))}
            </select>
            {classPage < classTotalPages && (
              <button
                type="button"
                onClick={() => fetchClasses(classPage + 1, classSearch, true)}
                disabled={isLoadingClasses || disabled}
                style={loadMoreBtnStyle}
                title="Tải thêm 20 lớp học tiếp theo"
              >
                {isLoadingClasses ? '...' : '+'}
              </button>
            )}
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label style={labelStyle}>
            Ngày học (SessionDate) <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <input
            id="session-date-input"
            type="date"
            value={selectedSessionDate}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={disabled}
            style={inputStyle}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
            Định dạng YYYY-MM-DD
          </span>
        </div>

        {/* Start Time Selection */}
        <div>
          <label style={labelStyle}>
            Giờ bắt đầu (StartTime) <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <input
            id="session-time-input"
            type="time"
            step="1"
            value={toDisplayTime(selectedStartTime)}
            onChange={(e) => {
              const val = e.target.value;
              onTimeChange(val ? toWireTime(val) : '');
            }}
            disabled={disabled}
            style={inputStyle}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
            Giờ học (HH:mm hoặc HH:mm:ss)
          </span>
        </div>
      </div>

      {/* Schedule Guidance */}
      {selectedClassId && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            📅 Lịch học quy định của lớp (Gợi ý):
          </div>

          {isLoadingSchedules ? (
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Đang tải lịch học...</div>
          ) : schedules.length === 0 ? (
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              ℹ️ Lớp học này hiện không có lịch học cố định nào được thiết lập. Bạn vẫn có thể nhập giờ bắt đầu thủ công để mở hoặc ghi nhận buổi học lịch sử.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {schedules.map((sch) => {
                const isSelectedTime = toWireTime(selectedStartTime) === toWireTime(sch.startTime);
                return (
                  <button
                    key={sch.id}
                    type="button"
                    onClick={() => {
                      onTimeChange(toWireTime(sch.startTime));
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.375rem 0.625rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      borderRadius: 'var(--radius-md)',
                      border: isSelectedTime
                        ? '1px solid var(--color-primary)'
                        : '1px solid var(--color-border)',
                      backgroundColor: isSelectedTime
                        ? 'var(--color-primary-subtle, #e0f2fe)'
                        : 'var(--color-surface)',
                      color: isSelectedTime ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      cursor: 'pointer'
                    }}
                    title="Nhấn để chọn khung giờ này"
                  >
                    <span>🕒 {getDayOfWeekLabel(sch.dayOfWeek)}:</span>
                    <strong>
                      {toDisplayTime(sch.startTime)} - {toDisplayTime(sch.endTime)}
                    </strong>
                    {sch.roomInfo && <span style={{ opacity: 0.8 }}>({sch.roomInfo})</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          id="session-load-roster-btn"
          type="button"
          onClick={onSubmit}
          disabled={!isValidSession || disabled || isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: isValidSession ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
            color: isValidSession ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            cursor: isValidSession && !disabled && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s ease'
          }}
        >
          {isLoading ? (
            <>
              <span className="spinner" style={{ width: '14px', height: '14px' }} /> Đang tải danh sách...
            </>
          ) : (
            <>
              <span>📋</span> Tải danh sách điểm danh
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '0.375rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.8125rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  outline: 'none'
};

const loadMoreBtnStyle: React.CSSProperties = {
  padding: '0 0.75rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: 'var(--color-surface-subtle)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
