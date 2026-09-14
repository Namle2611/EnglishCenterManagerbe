import React, { useEffect, useState } from 'react';
import { classService } from '../../services/class.service';
import { roomService } from '../../services/room.service';
import { DAY_OF_WEEK_OPTIONS } from '../../utils/scheduleHelper';

interface ScheduleFiltersProps {
  search: string;
  classId?: number;
  roomId?: number;
  teacherId?: number;
  dayOfWeek?: number;
  onSearchChange: (search: string) => void;
  onClassChange: (classId?: number) => void;
  onRoomChange: (roomId?: number) => void;
  onTeacherChange: (teacherId?: number) => void;
  onDayChange: (day?: number) => void;
  onReset: () => void;
  disabled?: boolean;
}

interface FilterOption {
  id: number;
  label: string;
}

export const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({
  search,
  classId,
  roomId,
  teacherId,
  dayOfWeek,
  onSearchChange,
  onClassChange,
  onRoomChange,
  onTeacherChange,
  onDayChange,
  onReset,
  disabled = false
}) => {
  const [localSearch, setLocalSearch] = useState<string>(search);

  // Filter option dropdown lists
  const [classOptions, setClassOptions] = useState<FilterOption[]>([]);
  const [roomOptions, setRoomOptions] = useState<FilterOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<FilterOption[]>([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState<boolean>(true);

  // Synchronize local search with parent state
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Single debounce layer for search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  // Load lookup options for filters (Strategy A: Teachers derived from Classes)
  useEffect(() => {
    let isMounted = true;

    const loadFilterLookups = async () => {
      setIsLoadingLookups(true);
      try {
        // 1. Fetch Rooms (all rooms for historical list filtering)
        const roomRes = await roomService.getRooms({ page: 1, pageSize: 100 });
        if (isMounted && roomRes.success && roomRes.data) {
          setRoomOptions(
            roomRes.data.items.map((r) => ({
              id: r.id,
              label: r.roomName ? `${r.roomCode} (${r.roomName})` : r.roomCode
            }))
          );
        }

        // 2. Fetch Classes (all classes for historical list filtering)
        const classRes = await classService.getClasses({ page: 1, pageSize: 100 });
        if (isMounted && classRes.success && classRes.data) {
          const classes = classRes.data.items;
          setClassOptions(
            classes.map((c) => ({
              id: c.id,
              label: `${c.classCode} - ${c.courseName}`
            }))
          );

          // Strategy A: Derive historical & active teachers from classes
          const teacherMap = new Map<number, string>();
          classes.forEach((c) => {
            if (c.teacherId && c.teacherName) {
              teacherMap.set(c.teacherId, c.teacherName);
            }
          });

          // If totalPages > 1, fetch remaining class pages to capture all assigned teachers
          if (classRes.data.totalPages > 1) {
            for (let p = 2; p <= classRes.data.totalPages; p++) {
              const moreClasses = await classService.getClasses({ page: p, pageSize: 100 });
              if (moreClasses.success && moreClasses.data) {
                moreClasses.data.items.forEach((c) => {
                  if (c.teacherId && c.teacherName) {
                    teacherMap.set(c.teacherId, c.teacherName);
                  }
                });
              }
            }
          }

          if (isMounted) {
            const sortedTeachers = Array.from(teacherMap.entries())
              .map(([id, label]) => ({ id, label }))
              .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
            setTeacherOptions(sortedTeachers);
          }
        }
      } catch (err) {
        console.error('Failed to load filter lookup data:', err);
      } finally {
        if (isMounted) {
          setIsLoadingLookups(false);
        }
      }
    };

    loadFilterLookups();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasActiveFilters = Boolean(search || classId || roomId || teacherId || dayOfWeek);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: 'var(--color-surface, #ffffff)',
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--color-border, #e2e8f0)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
        marginBottom: '1.25rem'
      }}
    >
      {/* Search Input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            position: 'absolute',
            left: '0.875rem',
            color: 'var(--color-text-muted, #94a3b8)',
            fontSize: '1rem',
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        >
          🔍
        </span>
        <input
          id="schedule-search-input"
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          disabled={disabled}
          placeholder="Tìm kiếm theo mã lớp, khóa học, phòng học, giáo viên..."
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem 0.625rem 2.5rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-canvas, #f8fafc)',
            color: 'var(--color-text-primary, #0f172a)',
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary, #2563eb)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border, #cbd5e1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => {
              setLocalSearch('');
              onSearchChange('');
            }}
            disabled={disabled}
            style={{
              position: 'absolute',
              right: '0.75rem',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted, #94a3b8)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: '0.25rem',
              lineHeight: 1
            }}
            aria-label="Xóa từ khóa tìm kiếm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Selectors Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          alignItems: 'center'
        }}
      >
        {/* Class Filter */}
        <div>
          <select
            id="schedule-class-filter"
            value={classId || ''}
            onChange={(e) => onClassChange(e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled || isLoadingLookups}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text-primary, #0f172a)',
              outline: 'none',
              cursor: 'pointer'
            }}
            aria-label="Lọc theo lớp học"
          >
            <option value="">Tất cả lớp học</option>
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Room Filter */}
        <div>
          <select
            id="schedule-room-filter"
            value={roomId || ''}
            onChange={(e) => onRoomChange(e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled || isLoadingLookups}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text-primary, #0f172a)',
              outline: 'none',
              cursor: 'pointer'
            }}
            aria-label="Lọc theo phòng học"
          >
            <option value="">Tất cả phòng học</option>
            {roomOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Teacher Filter */}
        <div>
          <select
            id="schedule-teacher-filter"
            value={teacherId || ''}
            onChange={(e) => onTeacherChange(e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled || isLoadingLookups}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text-primary, #0f172a)',
              outline: 'none',
              cursor: 'pointer'
            }}
            aria-label="Lọc theo giảng viên"
          >
            <option value="">Tất cả giảng viên</option>
            {teacherOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Day of Week Filter */}
        <div>
          <select
            id="schedule-day-filter"
            value={dayOfWeek || ''}
            onChange={(e) => onDayChange(e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text-primary, #0f172a)',
              outline: 'none',
              cursor: 'pointer'
            }}
            aria-label="Lọc theo thứ trong tuần"
          >
            <option value="">Tất cả các thứ</option>
            {DAY_OF_WEEK_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <div>
            <button
              id="schedule-filter-reset-btn"
              type="button"
              onClick={onReset}
              disabled={disabled}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: 'var(--color-surface-subtle, #f1f5f9)',
                color: 'var(--color-text-secondary, #475569)',
                border: '1px solid var(--color-border, #cbd5e1)',
                borderRadius: 'var(--radius-md, 8px)',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                width: '100%'
              }}
            >
              ✕ Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
