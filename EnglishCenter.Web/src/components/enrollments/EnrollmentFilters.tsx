import React, { useEffect, useState } from 'react';
import { classService } from '../../services/class.service';
import { courseService } from '../../services/course.service';
import { studentService } from '../../services/student.service';
import type { EnrollmentStatus } from '../../types/enrollment.types';
import { ENROLLMENT_STATUS_LABELS } from '../../utils/enrollmentHelper';

interface EnrollmentFiltersProps {
  search: string;
  studentId?: number;
  courseId?: number;
  classId?: number;
  status?: EnrollmentStatus;
  dateFrom?: string;
  dateTo?: string;
  onSearchChange: (search: string) => void;
  onStudentChange: (studentId?: number) => void;
  onCourseChange: (courseId?: number) => void;
  onClassChange: (classId?: number) => void;
  onStatusChange: (status?: EnrollmentStatus) => void;
  onDateFromChange: (dateFrom?: string) => void;
  onDateToChange: (dateTo?: string) => void;
  onReset: () => void;
  disabled?: boolean;
}

interface FilterOption {
  id: number;
  label: string;
}

export const EnrollmentFilters: React.FC<EnrollmentFiltersProps> = ({
  search,
  studentId,
  courseId,
  classId,
  status,
  dateFrom,
  dateTo,
  onSearchChange,
  onStudentChange,
  onCourseChange,
  onClassChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onReset,
  disabled = false
}) => {
  const [localSearch, setLocalSearch] = useState<string>(search);

  // Filter option lists with pagination / load-more support
  const [studentOptions, setStudentOptions] = useState<FilterOption[]>([]);
  const [studentPage, setStudentPage] = useState<number>(1);
  const [studentTotalPages, setStudentTotalPages] = useState<number>(1);
  const studentSearchTerm = '';
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);

  const [courseOptions, setCourseOptions] = useState<FilterOption[]>([]);
  const [coursePage, setCoursePage] = useState<number>(1);
  const [courseTotalPages, setCourseTotalPages] = useState<number>(1);
  const courseSearchTerm = '';
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);

  const [classOptions, setClassOptions] = useState<FilterOption[]>([]);
  const [classPage, setClassPage] = useState<number>(1);
  const [classTotalPages, setClassTotalPages] = useState<number>(1);
  const classSearchTerm = '';
  const [isLoadingClasses, setIsLoadingClasses] = useState<boolean>(false);

  // Synchronize local search with prop
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Search input debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  // Load students (server-side searchable & paginated)
  const fetchStudents = async (page: number, term: string, append = false) => {
    setIsLoadingStudents(true);
    try {
      const res = await studentService.getStudents({
        page,
        pageSize: 20,
        search: term || undefined
      });
      if (res.success && res.data) {
        const newOpts = res.data.items.map((s) => ({
          id: s.id,
          label: `${s.studentCode} — ${s.fullName}`
        }));
        setStudentOptions((prev) => (append ? [...prev, ...newOpts] : newOpts));
        setStudentTotalPages(res.data.totalPages || 1);
        setStudentPage(page);
      }
    } catch {
      // Non-blocking lookup fallback
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Load courses (server-side searchable & paginated)
  const fetchCourses = async (page: number, term: string, append = false) => {
    setIsLoadingCourses(true);
    try {
      const res = await courseService.getCourses({
        page,
        pageSize: 20,
        search: term || undefined
      });
      if (res.success && res.data) {
        const newOpts = res.data.items.map((c) => ({
          id: c.id,
          label: `${c.courseCode} — ${c.courseName}`
        }));
        setCourseOptions((prev) => (append ? [...prev, ...newOpts] : newOpts));
        setCourseTotalPages(res.data.totalPages || 1);
        setCoursePage(page);
      }
    } catch {
      // Non-blocking lookup fallback
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // Load classes (server-side searchable & paginated)
  const fetchClasses = async (page: number, term: string, append = false) => {
    setIsLoadingClasses(true);
    try {
      const res = await classService.getClasses({
        page,
        pageSize: 20,
        search: term || undefined
      });
      if (res.success && res.data) {
        const newOpts = res.data.items.map((c) => ({
          id: c.id,
          label: `${c.classCode} — ${c.courseName}`
        }));
        setClassOptions((prev) => (append ? [...prev, ...newOpts] : newOpts));
        setClassTotalPages(res.data.totalPages || 1);
        setClassPage(page);
      }
    } catch {
      // Non-blocking lookup fallback
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Initial load of lookups
  useEffect(() => {
    fetchStudents(1, '');
    fetchCourses(1, '');
    fetchClasses(1, '');
  }, []);

  // Ensure currently selected student/course/class is present in options even if on later pages
  useEffect(() => {
    if (studentId && !studentOptions.some((o) => o.id === studentId)) {
      studentService.getStudentById(studentId).then((res) => {
        if (res.success && res.data) {
          setStudentOptions((prev) => [
            { id: res.data.id, label: `${res.data.studentCode} — ${res.data.fullName}` },
            ...prev
          ]);
        }
      });
    }
  }, [studentId, studentOptions]);

  useEffect(() => {
    if (courseId && !courseOptions.some((o) => o.id === courseId)) {
      courseService.getCourseById(courseId).then((res) => {
        if (res.success && res.data) {
          setCourseOptions((prev) => [
            { id: res.data.id, label: `${res.data.courseCode} — ${res.data.courseName}` },
            ...prev
          ]);
        }
      });
    }
  }, [courseId, courseOptions]);

  useEffect(() => {
    if (classId && !classOptions.some((o) => o.id === classId)) {
      classService.getClassById(classId).then((res) => {
        if (res.success && res.data) {
          setClassOptions((prev) => [
            { id: res.data.id, label: `${res.data.classCode} — ${res.data.courseName}` },
            ...prev
          ]);
        }
      });
    }
  }, [classId, classOptions]);

  // Date range validation
  const isDateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      {/* Date Range Error Alert */}
      {isDateRangeInvalid && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            border: '1px solid var(--status-danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>⚠️</span>
          <span>Ngày bắt đầu không được lớn hơn ngày kết thúc.</span>
        </div>
      )}

      {/* Row 1: Search & Status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Search input */}
        <div>
          <label
            htmlFor="enrollment-search"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Tìm kiếm chung
          </label>
          <input
            id="enrollment-search"
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Mã/Tên HV, Khóa, Lớp..."
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="enrollment-status-filter"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Trạng thái ghi danh
          </label>
          <select
            id="enrollment-status-filter"
            value={status || ''}
            onChange={(e) => onStatusChange(e.target.value ? (e.target.value as EnrollmentStatus) : undefined)}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              outline: 'none'
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">{ENROLLMENT_STATUS_LABELS.Pending}</option>
            <option value="Confirmed">{ENROLLMENT_STATUS_LABELS.Confirmed}</option>
            <option value="Paid">{ENROLLMENT_STATUS_LABELS.Paid}</option>
            <option value="Enrolled">{ENROLLMENT_STATUS_LABELS.Enrolled}</option>
            <option value="Cancelled">{ENROLLMENT_STATUS_LABELS.Cancelled}</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label
            htmlFor="enrollment-date-from"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Từ ngày ghi danh
          </label>
          <input
            id="enrollment-date-from"
            type="date"
            value={dateFrom || ''}
            onChange={(e) => onDateFromChange(e.target.value || undefined)}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${isDateRangeInvalid ? 'var(--status-danger-border)' : 'var(--color-border)'}`,
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Date To */}
        <div>
          <label
            htmlFor="enrollment-date-to"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Đến ngày ghi danh
          </label>
          <input
            id="enrollment-date-to"
            type="date"
            value={dateTo || ''}
            onChange={(e) => onDateToChange(e.target.value || undefined)}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${isDateRangeInvalid ? 'var(--status-danger-border)' : 'var(--color-border)'}`,
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Row 2: Lookups (Student, Course, Class) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Student Filter */}
        <div>
          <label
            htmlFor="enrollment-student-filter"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Học viên (Lịch sử)
          </label>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <select
              id="enrollment-student-filter"
              value={studentId || ''}
              onChange={(e) => onStudentChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              disabled={disabled}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                outline: 'none'
              }}
            >
              <option value="">Tất cả học viên</option>
              {studentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            {studentPage < studentTotalPages && (
              <button
                type="button"
                onClick={() => fetchStudents(studentPage + 1, studentSearchTerm, true)}
                disabled={isLoadingStudents || disabled}
                title="Tải thêm học viên"
                style={{
                  padding: '0.5rem 0.625rem',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {isLoadingStudents ? '...' : '+ Thêm'}
              </button>
            )}
          </div>
        </div>

        {/* Course Filter */}
        <div>
          <label
            htmlFor="enrollment-course-filter"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Khóa học (Lịch sử)
          </label>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <select
              id="enrollment-course-filter"
              value={courseId || ''}
              onChange={(e) => onCourseChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              disabled={disabled}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                outline: 'none'
              }}
            >
              <option value="">Tất cả khóa học</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {coursePage < courseTotalPages && (
              <button
                type="button"
                onClick={() => fetchCourses(coursePage + 1, courseSearchTerm, true)}
                disabled={isLoadingCourses || disabled}
                title="Tải thêm khóa học"
                style={{
                  padding: '0.5rem 0.625rem',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {isLoadingCourses ? '...' : '+ Thêm'}
              </button>
            )}
          </div>
        </div>

        {/* Class Filter */}
        <div>
          <label
            htmlFor="enrollment-class-filter"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Lớp học (Lịch sử)
          </label>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <select
              id="enrollment-class-filter"
              value={classId || ''}
              onChange={(e) => onClassChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              disabled={disabled}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                outline: 'none'
              }}
            >
              <option value="">Tất cả lớp học</option>
              {classOptions.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.label}
                </option>
              ))}
            </select>
            {classPage < classTotalPages && (
              <button
                type="button"
                onClick={() => fetchClasses(classPage + 1, classSearchTerm, true)}
                disabled={isLoadingClasses || disabled}
                title="Tải thêm lớp học"
                style={{
                  padding: '0.5rem 0.625rem',
                  fontSize: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {isLoadingClasses ? '...' : '+ Thêm'}
              </button>
            )}
          </div>
        </div>

        {/* Reset Button */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-subtle)',
              color: 'var(--color-text-primary)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem'
            }}
          >
            <span>🔄</span> Đặt lại bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
};
