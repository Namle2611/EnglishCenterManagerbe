import React, { useEffect, useRef, useState } from 'react';
import { classService } from '../../services/class.service';
import { courseService } from '../../services/course.service';
import type {
  ClassDetail,
  CreateClassPayload,
  TeacherLookupItem,
  UpdateClassPayload
} from '../../types/class.types';
import type { CourseListItem } from '../../types/course.types';
import {
  CLASS_STATUS_LABELS,
  formatDateTimeInput,
  normalizeDateTimePayload,
  validateClassCode,
  validateDates,
  validateMaxStudents
} from '../../utils/classHelper';

type ClassFormProps =
  | {
      mode: 'create';
      initialData?: never;
      onSubmit: (payload: CreateClassPayload) => Promise<void>;
      onCancel: () => void;
      isSubmitting?: boolean;
      serverError?: string | null;
    }
  | {
      mode: 'edit';
      initialData?: ClassDetail | null;
      onSubmit: (payload: UpdateClassPayload) => Promise<void>;
      onCancel: () => void;
      isSubmitting?: boolean;
      serverError?: string | null;
    };

export const ClassForm: React.FC<ClassFormProps> = (props) => {
  const {
    mode,
    initialData,
    onCancel,
    isSubmitting = false,
    serverError = null
  } = props;

  // Form field states
  const [classCode, setClassCode] = useState<string>(initialData?.classCode || '');
  const [courseId, setCourseId] = useState<number | ''>(initialData?.courseId ?? '');
  const [teacherId, setTeacherId] = useState<number | null>(initialData?.teacherId ?? null);
  const [startDate, setStartDate] = useState<string>(
    initialData?.startDate ? formatDateTimeInput(initialData.startDate) : ''
  );
  const [endDate, setEndDate] = useState<string>(
    initialData?.endDate ? formatDateTimeInput(initialData.endDate) : ''
  );
  const [maxStudents, setMaxStudents] = useState<string>(
    initialData?.maxStudents !== undefined ? String(initialData.maxStudents) : '25'
  );

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Searchable Course selector state
  const [courseOptions, setCourseOptions] = useState<Array<{ id: number; courseCode: string; courseName: string; status?: string }>>([]);
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);
  const [courseLookupError, setCourseLookupError] = useState<string | null>(null);

  // Searchable Teacher selector state
  const [teacherOptions, setTeacherOptions] = useState<Array<{ id: number; teacherCode: string; fullName: string; specialization?: string; status?: string }>>([]);
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [isLoadingTeachers, setIsLoadingTeachers] = useState<boolean>(false);
  const [teacherLookupError, setTeacherLookupError] = useState<string | null>(null);

  const courseAbortRef = useRef<AbortController | null>(null);
  const teacherAbortRef = useRef<AbortController | null>(null);

  // Seed initial Course & Teacher from initialData in edit mode so they are always visible
  useEffect(() => {
    if (initialData) {
      if (initialData.courseId) {
        setCourseOptions([
          {
            id: initialData.courseId,
            courseCode: initialData.courseCode,
            courseName: initialData.courseName
          }
        ]);
        setCourseId(initialData.courseId);
      }
      if (initialData.teacherId && initialData.teacherCode && initialData.teacherName) {
        setTeacherOptions([
          {
            id: initialData.teacherId,
            teacherCode: initialData.teacherCode,
            fullName: initialData.teacherName
          }
        ]);
        setTeacherId(initialData.teacherId);
      }
    }
  }, [initialData]);

  // Fetch Courses with search & debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (courseAbortRef.current) {
        courseAbortRef.current.abort();
      }
      courseAbortRef.current = new AbortController();

      setIsLoadingCourses(true);
      setCourseLookupError(null);

      try {
        const res = await courseService.getCourses(
          {
            page: 1,
            pageSize: 20,
            search: courseSearch.trim() || undefined,
            sortBy: 'courseName',
            sortDirection: 'asc'
          },
          courseAbortRef.current.signal
        );

        const fetched: CourseListItem[] = res.data.items;

        setCourseOptions((prev) => {
          // Merge and deduplicate by id, preserving currently selected course if not in fetched list
          const map = new Map<number, { id: number; courseCode: string; courseName: string; status?: string }>();
          prev.forEach((item) => map.set(item.id, item));
          fetched.forEach((c) =>
            map.set(c.id, {
              id: c.id,
              courseCode: c.courseCode,
              courseName: c.courseName,
              status: c.status
            })
          );
          return Array.from(map.values());
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'CanceledError') {
          return;
        }
        setCourseLookupError('Không thể tải danh sách khóa học.');
      } finally {
        setIsLoadingCourses(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [courseSearch]);

  // Fetch Teachers with search & debounce (using dedicated Class lookup endpoint for both ADMIN & STAFF)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (teacherAbortRef.current) {
        teacherAbortRef.current.abort();
      }
      teacherAbortRef.current = new AbortController();

      setIsLoadingTeachers(true);
      setTeacherLookupError(null);

      try {
        const res = await classService.getTeacherLookup(
          {
            page: 1,
            pageSize: 20,
            search: teacherSearch.trim() || undefined
          },
          teacherAbortRef.current.signal
        );

        const fetched: TeacherLookupItem[] = res.data.items;

        setTeacherOptions((prev) => {
          // Merge and deduplicate by id, preserving currently selected teacher if not in fetched list
          const map = new Map<number, { id: number; teacherCode: string; fullName: string; specialization?: string; status?: string }>();
          prev.forEach((item) => map.set(item.id, item));
          fetched.forEach((t) =>
            map.set(t.id, {
              id: t.id,
              teacherCode: t.teacherCode,
              fullName: t.fullName,
              specialization: t.specialization,
              status: t.status
            })
          );
          return Array.from(map.values());
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'CanceledError') {
          return;
        }
        setTeacherLookupError('Không thể tải danh sách giáo viên.');
      } finally {
        setIsLoadingTeachers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [teacherSearch]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. ClassCode (only in create mode)
    if (mode === 'create') {
      const codeValidation = validateClassCode(classCode);
      if (!codeValidation.isValid) {
        newErrors.classCode = codeValidation.error || 'Mã lớp học không hợp lệ.';
      }
    }

    // 2. Course
    if (courseId === '' || Number(courseId) <= 0) {
      newErrors.courseId = 'Vui lòng chọn khóa học cho lớp.';
    }

    // 3. StartDate & EndDate
    const dateValidation = validateDates(startDate, endDate);
    if (!dateValidation.isValid) {
      if (dateValidation.startError) newErrors.startDate = dateValidation.startError;
      if (dateValidation.endError) newErrors.endDate = dateValidation.endError;
    }

    // 4. MaxStudents
    const maxStudentsValidation = validateMaxStudents(maxStudents);
    if (!maxStudentsValidation.isValid) {
      newErrors.maxStudents = maxStudentsValidation.error || 'Sĩ số không hợp lệ.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const normStart = normalizeDateTimePayload(startDate);
    const normEnd = normalizeDateTimePayload(endDate);
    const numStudents = validateMaxStudents(maxStudents).value!;
    const cId = Number(courseId);
    const tId = teacherId !== null && Number(teacherId) > 0 ? Number(teacherId) : null;

    if (mode === 'create') {
      const payload: CreateClassPayload = {
        classCode: classCode.trim(),
        courseId: cId,
        teacherId: tId,
        startDate: normStart,
        endDate: normEnd,
        maxStudents: numStudents
      };
      await (props as { onSubmit: (p: CreateClassPayload) => Promise<void> }).onSubmit(payload);
    } else {
      const payload: UpdateClassPayload = {
        courseId: cId,
        teacherId: tId,
        startDate: normStart,
        endDate: normEnd,
        maxStudents: numStudents
      };
      await (props as { onSubmit: (p: UpdateClassPayload) => Promise<void> }).onSubmit(payload);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        backgroundColor: 'var(--color-surface, #ffffff)',
        padding: '2rem',
        borderRadius: 'var(--radius-xl, 16px)',
        border: '1px solid var(--color-border, #e2e8f0)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
      }}
    >
      {/* Top Banner Error Notification */}
      {serverError && (
        <div
          role="alert"
          style={{
            padding: '0.875rem 1.25rem',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '1.125rem' }}>⚠️</span>
          <span>{serverError}</span>
        </div>
      )}

      {/* ClassCode Field */}
      <div>
        <label
          htmlFor="classCode"
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text-primary, #0f172a)',
            marginBottom: '0.5rem'
          }}
        >
          Mã lớp học {mode === 'create' && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        <input
          id="classCode"
          type="text"
          value={classCode}
          onChange={(e) => setClassCode(e.target.value)}
          disabled={mode === 'edit' || isSubmitting}
          maxLength={30}
          placeholder={mode === 'create' ? 'Ví dụ: ENG_BASIC_01' : ''}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            borderRadius: 'var(--radius-md, 8px)',
            border: errors.classCode
              ? '1px solid #ef4444'
              : '1px solid var(--color-border, #cbd5e1)',
            backgroundColor:
              mode === 'edit'
                ? 'var(--color-surface-subtle, #f1f5f9)'
                : 'var(--color-canvas, #ffffff)',
            color:
              mode === 'edit'
                ? 'var(--color-text-secondary, #64748b)'
                : 'var(--color-text-primary, #0f172a)',
            cursor: mode === 'edit' ? 'not-allowed' : 'text',
            outline: 'none'
          }}
        />
        {mode === 'edit' && (
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted, #94a3b8)',
              marginTop: '0.25rem'
            }}
          >
            Mã lớp học là định danh cố định không thể thay đổi sau khi tạo.
          </span>
        )}
        {errors.classCode && (
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: '#ef4444',
              marginTop: '0.25rem'
            }}
          >
            {errors.classCode}
          </span>
        )}
      </div>

      {/* Read-only Status display on Edit mode */}
      {mode === 'edit' && initialData && (
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary, #0f172a)',
              marginBottom: '0.5rem'
            }}
          >
            Trạng thái hiện tại
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary, #0f172a)'
              }}
            >
              {CLASS_STATUS_LABELS[initialData.status] || initialData.status}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted, #94a3b8)'
              }}
            >
              (Trạng thái lớp được cập nhật riêng qua chức năng Đổi trạng thái)
            </span>
          </div>
        </div>
      )}

      {/* Course Selection Field */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label
            htmlFor="courseSelect"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary, #0f172a)'
            }}
          >
            Khóa học <span style={{ color: '#ef4444' }}>*</span>
          </label>
          {isLoadingCourses && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)' }}>
              Đang tải khóa học...
            </span>
          )}
        </div>

        {/* Quick search input to filter courses if needed */}
        <input
          type="text"
          value={courseSearch}
          onChange={(e) => setCourseSearch(e.target.value)}
          disabled={isSubmitting}
          placeholder="Gõ để tìm kiếm khóa học..."
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--color-border, #e2e8f0)',
            backgroundColor: 'var(--color-surface-subtle, #f8fafc)',
            marginBottom: '0.5rem',
            outline: 'none'
          }}
        />

        <select
          id="courseSelect"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: errors.courseId
              ? '1px solid #ef4444'
              : '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-canvas, #ffffff)',
            color: 'var(--color-text-primary, #0f172a)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">-- Chọn khóa học --</option>
          {courseOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.courseCode} — {c.courseName} {c.status ? `(${c.status})` : ''}
            </option>
          ))}
        </select>
        {courseLookupError && (
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
            {courseLookupError}
          </span>
        )}
        {errors.courseId && (
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
            {errors.courseId}
          </span>
        )}
      </div>

      {/* Teacher Selection Field (Optional, TeacherId is nullable) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label
            htmlFor="teacherSelect"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary, #0f172a)'
            }}
          >
            Giáo viên phụ trách <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted, #94a3b8)' }}>(Không bắt buộc)</span>
          </label>
          {isLoadingTeachers && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #94a3b8)' }}>
              Đang tải danh sách giáo viên...
            </span>
          )}
        </div>

        {/* Quick search input to filter teachers */}
        <input
          type="text"
          value={teacherSearch}
          onChange={(e) => setTeacherSearch(e.target.value)}
          disabled={isSubmitting}
          placeholder="Gõ mã hoặc họ tên giáo viên để tra cứu..."
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--color-border, #e2e8f0)',
            backgroundColor: 'var(--color-surface-subtle, #f8fafc)',
            marginBottom: '0.5rem',
            outline: 'none'
          }}
        />

        <select
          id="teacherSelect"
          value={teacherId ?? ''}
          onChange={(e) => setTeacherId(e.target.value === '' ? null : Number(e.target.value))}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-canvas, #ffffff)',
            color: 'var(--color-text-primary, #0f172a)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">Chưa phân công giáo viên</option>
          {teacherOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.teacherCode} — {t.fullName} {t.status ? (t.status === 'Active' ? '(Đang hoạt động)' : '(Không hoạt động)') : ''}
            </option>
          ))}
        </select>
        {teacherLookupError && (
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
            {teacherLookupError}
          </span>
        )}
      </div>

      {/* Date Range: StartDate and EndDate Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* StartDate */}
        <div>
          <label
            htmlFor="startDate"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary, #0f172a)',
              marginBottom: '0.5rem'
            }}
          >
            Thời gian bắt đầu <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="startDate"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: errors.startDate
                ? '1px solid #ef4444'
                : '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: 'var(--color-canvas, #ffffff)',
              color: 'var(--color-text-primary, #0f172a)',
              outline: 'none'
            }}
          />
          {errors.startDate && (
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#ef4444',
                marginTop: '0.25rem'
              }}
            >
              {errors.startDate}
            </span>
          )}
        </div>

        {/* EndDate */}
        <div>
          <label
            htmlFor="endDate"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary, #0f172a)',
              marginBottom: '0.5rem'
            }}
          >
            Thời gian kết thúc <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="endDate"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: errors.endDate
                ? '1px solid #ef4444'
                : '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: 'var(--color-canvas, #ffffff)',
              color: 'var(--color-text-primary, #0f172a)',
              outline: 'none'
            }}
          />
          {errors.endDate && (
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#ef4444',
                marginTop: '0.25rem'
              }}
            >
              {errors.endDate}
            </span>
          )}
        </div>
      </div>

      {/* MaxStudents */}
      <div>
        <label
          htmlFor="maxStudents"
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text-primary, #0f172a)',
            marginBottom: '0.5rem'
          }}
        >
          Sĩ số tối đa <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          id="maxStudents"
          type="number"
          min={1}
          step={1}
          value={maxStudents}
          onChange={(e) => setMaxStudents(e.target.value)}
          disabled={isSubmitting}
          placeholder="Ví dụ: 25"
          style={{
            width: '100%',
            maxWidth: '240px',
            padding: '0.625rem 0.875rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: errors.maxStudents
              ? '1px solid #ef4444'
              : '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-canvas, #ffffff)',
            color: 'var(--color-text-primary, #0f172a)',
            outline: 'none'
          }}
        />
        {errors.maxStudents && (
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: '#ef4444',
              marginTop: '0.25rem'
            }}
          >
            {errors.maxStudents}
          </span>
        )}
      </div>

      {/* Form Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '1rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--color-border, #e2e8f0)'
        }}
      >
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '0.625rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md, 8px)',
            backgroundColor: 'var(--color-primary, #1e40af)',
            color: '#ffffff',
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            transition: 'background-color 0.15s ease'
          }}
        >
          {isSubmitting
            ? 'Đang xử lý...'
            : mode === 'create'
            ? 'Tạo lớp học'
            : 'Lưu thay đổi'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: 'var(--radius-md, 8px)',
            backgroundColor: 'transparent',
            color: 'var(--color-text-secondary, #475569)',
            border: '1px solid var(--color-border, #cbd5e1)',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          Hủy
        </button>
      </div>
    </form>
  );
};
