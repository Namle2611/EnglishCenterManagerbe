import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { attendanceService } from '../../services/attendance.service';
import { classService } from '../../services/class.service';
import { courseService } from '../../services/course.service';
import { studentService } from '../../services/student.service';
import { teacherService } from '../../services/teacher.service';
import type {
  AttendanceQueryParams,
  AttendanceStatus,
  TeacherClassLookupItem
} from '../../types/attendance.types';
import type { ClassListItem } from '../../types/class.types';
import type { CourseListItem } from '../../types/course.types';
import type { StudentListItem } from '../../types/student.types';
import type { TeacherListItem } from '../../types/teacher.types';
import { ATTENDANCE_STATUS_OPTIONS, isValidCalendarDate } from '../../utils/attendanceHelper';

interface AttendanceFiltersProps {
  filters: AttendanceQueryParams;
  onFilterChange: (newFilters: Partial<AttendanceQueryParams>) => void;
  onReset: () => void;
  disabled?: boolean;
}

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  disabled = false
}) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r.toUpperCase() === 'ADMIN') ?? false;
  const isStaff = user?.roles?.some((r) => r.toUpperCase() === 'STAFF') ?? false;
  const isTeacher = user?.roles?.some((r) => r.toUpperCase() === 'TEACHER') ?? false;

  // Local state for debounced search
  const [localSearch, setLocalSearch] = useState<string>(filters.search || '');

  // Local state for date range
  const [dateFrom, setDateFrom] = useState<string>(filters.dateFrom || '');
  const [dateTo, setDateTo] = useState<string>(filters.dateTo || '');
  const [dateError, setDateError] = useState<string | null>(null);

  // Class lookup states
  const [adminClasses, setAdminClasses] = useState<ClassListItem[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassLookupItem[]>([]);
  const [classSearch, setClassSearch] = useState<string>('');
  const [classPage, setClassPage] = useState<number>(1);
  const [classTotalPages, setClassTotalPages] = useState<number>(1);
  const [isLoadingClasses, setIsLoadingClasses] = useState<boolean>(false);

  // Student lookup states (Admin/Staff only)
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [studentPage, setStudentPage] = useState<number>(1);
  const [studentTotalPages, setStudentTotalPages] = useState<number>(1);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);

  // Course lookup states (Admin/Staff only)
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [coursePage, setCoursePage] = useState<number>(1);
  const [courseTotalPages, setCourseTotalPages] = useState<number>(1);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);

  // Teacher lookup states (Admin only)
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [teacherPage, setTeacherPage] = useState<number>(1);
  const [teacherTotalPages, setTeacherTotalPages] = useState<number>(1);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState<boolean>(false);

  // Sync incoming props
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalSearch(filters.search || '');
    }, 0);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDateFrom(filters.dateFrom || '');
      setDateTo(filters.dateTo || '');
    }, 0);
    return () => clearTimeout(timer);
  }, [filters.dateFrom, filters.dateTo]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = localSearch.trim();
      if (trimmed !== (filters.search || '')) {
        onFilterChange({ search: trimmed || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, onFilterChange]);

  // Fetch classes by role
  const fetchClasses = useCallback(
    async (page: number, term: string, append = false) => {
      setIsLoadingClasses(true);
      try {
        if (isTeacher) {
          const res = await attendanceService.getTeacherClassesLookup({
            page,
            pageSize: 20,
            search: term || undefined
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
            search: term || undefined
          });
          if (res.success && res.data) {
            setAdminClasses((prev) => (append ? [...prev, ...res.data.items] : res.data.items));
            setClassTotalPages(res.data.totalPages || 1);
            setClassPage(page);
          }
        }
      } catch {
        // Silently handle lookup error
      } finally {
        setIsLoadingClasses(false);
      }
    },
    [isAdmin, isStaff, isTeacher]
  );

  // Fetch Students (Admin/Staff only)
  const fetchStudents = useCallback(async (page: number, term: string, append = false) => {
    setIsLoadingStudents(true);
    try {
      const res = await studentService.getStudents({
        page,
        pageSize: 20,
        search: term || undefined
      });
      if (res.success && res.data) {
        setStudents((prev) => (append ? [...prev, ...res.data.items] : res.data.items));
        setStudentTotalPages(res.data.totalPages || 1);
        setStudentPage(page);
      }
    } catch {
      // Silently handle lookup error
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  // Fetch Courses (Admin/Staff only)
  const fetchCourses = useCallback(async (page: number, term: string, append = false) => {
    setIsLoadingCourses(true);
    try {
      const res = await courseService.getCourses({
        page,
        pageSize: 20,
        search: term || undefined
      });
      if (res.success && res.data) {
        setCourses((prev) => (append ? [...prev, ...res.data.items] : res.data.items));
        setCourseTotalPages(res.data.totalPages || 1);
        setCoursePage(page);
      }
    } catch {
      // Silently handle lookup error
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  // Fetch Teachers (Admin only)
  const fetchTeachers = useCallback(async (page: number, term: string, append = false) => {
    setIsLoadingTeachers(true);
    try {
      const res = await teacherService.getTeachers({
        page,
        pageSize: 20,
        search: term || undefined
      });
      if (res.success && res.data) {
        setTeachers((prev) => (append ? [...prev, ...res.data.items] : res.data.items));
        setTeacherTotalPages(res.data.totalPages || 1);
        setTeacherPage(page);
      }
    } catch {
      // Silently handle lookup error
    } finally {
      setIsLoadingTeachers(false);
    }
  }, []);

  // Initial class lookup
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses(1, '');
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchClasses]);

  // Initial student & course lookup for Admin/Staff
  useEffect(() => {
    if (isAdmin || isStaff) {
      const timer = setTimeout(() => {
        fetchStudents(1, '');
        fetchCourses(1, '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isStaff, fetchStudents, fetchCourses]);

  // Initial teacher lookup for Admin only
  useEffect(() => {
    if (isAdmin) {
      const timer = setTimeout(() => {
        fetchTeachers(1, '');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, fetchTeachers]);

  // Date range validation and apply
  const handleApplyDateRange = (fromVal: string, toVal: string) => {
    setDateError(null);

    const validFrom = fromVal ? isValidCalendarDate(fromVal) : true;
    const validTo = toVal ? isValidCalendarDate(toVal) : true;

    if (!validFrom || !validTo) {
      setDateError('Định dạng ngày không hợp lệ (YYYY-MM-DD).');
      return;
    }

    if (fromVal && toVal && fromVal > toVal) {
      setDateError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }

    onFilterChange({
      dateFrom: fromVal || undefined,
      dateTo: toVal || undefined,
      page: 1
    });
  };

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
      {/* Row 1: Search & Status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}
      >
        {/* Search */}
        <div>
          <label style={labelStyle}>Tìm kiếm</label>
          <input
            id="attendance-search-input"
            type="text"
            placeholder="Mã/Tên HV, Mã lớp, Tên khóa học..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            disabled={disabled}
            style={inputStyle}
          />
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>Trạng thái điểm danh</label>
          <select
            id="attendance-status-filter"
            value={filters.status || ''}
            onChange={(e) =>
              onFilterChange({
                status: (e.target.value as AttendanceStatus) || undefined,
                page: 1
              })
            }
            disabled={disabled}
            style={inputStyle}
          >
            <option value="">-- Tất cả trạng thái --</option>
            {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label style={labelStyle}>Từ ngày</label>
          <input
            id="attendance-datefrom-filter"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              const val = e.target.value;
              setDateFrom(val);
              handleApplyDateRange(val, dateTo);
            }}
            disabled={disabled}
            style={inputStyle}
          />
        </div>

        {/* Date To */}
        <div>
          <label style={labelStyle}>Đến ngày</label>
          <input
            id="attendance-dateto-filter"
            type="date"
            value={dateTo}
            onChange={(e) => {
              const val = e.target.value;
              setDateTo(val);
              handleApplyDateRange(dateFrom, val);
            }}
            disabled={disabled}
            style={inputStyle}
          />
        </div>
      </div>

      {dateError && (
        <div
          style={{
            color: 'var(--status-danger-text)',
            fontSize: '0.75rem',
            marginBottom: '0.75rem'
          }}
        >
          ⚠️ {dateError}
        </div>
      )}

      {/* Row 2: Lookups based on Role */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}
      >
        {/* Class Filter */}
        <div>
          <label style={labelStyle}>Lớp học</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <input
              type="text"
              placeholder="Gõ để tìm lớp..."
              value={classSearch}
              onChange={(e) => {
                setClassSearch(e.target.value);
                fetchClasses(1, e.target.value);
              }}
              disabled={disabled}
              style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}
            />
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <select
                id="attendance-class-filter"
                value={filters.classId || ''}
                onChange={(e) =>
                  onFilterChange({
                    classId: e.target.value ? Number(e.target.value) : undefined,
                    page: 1
                  })
                }
                disabled={disabled || isLoadingClasses}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="">-- Tất cả lớp học --</option>
                {isTeacher
                  ? teacherClasses.map((cl) => (
                      <option key={cl.classId} value={cl.classId}>
                        {cl.classCode} ({cl.courseCode})
                      </option>
                    ))
                  : adminClasses.map((cl) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.classCode} ({cl.courseCode})
                      </option>
                    ))}
              </select>
              {classPage < classTotalPages && (
                <button
                  type="button"
                  onClick={() => fetchClasses(classPage + 1, classSearch, true)}
                  disabled={isLoadingClasses || disabled}
                  style={loadMoreBtnStyle}
                  title="Tải thêm lớp học"
                >
                  {isLoadingClasses ? '...' : '+'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student Filter (Admin & Staff only) */}
        {(isAdmin || isStaff) && (
          <div>
            <label style={labelStyle}>Học viên</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <input
                type="text"
                placeholder="Gõ để tìm học viên..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  fetchStudents(1, e.target.value);
                }}
                disabled={disabled}
                style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}
              />
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <select
                  id="attendance-student-filter"
                  value={filters.studentId || ''}
                  onChange={(e) =>
                    onFilterChange({
                      studentId: e.target.value ? Number(e.target.value) : undefined,
                      page: 1
                    })
                  }
                  disabled={disabled || isLoadingStudents}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  <option value="">-- Tất cả học viên --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.studentCode} - {st.fullName}
                    </option>
                  ))}
                </select>
                {studentPage < studentTotalPages && (
                  <button
                    type="button"
                    onClick={() => fetchStudents(studentPage + 1, studentSearch, true)}
                    disabled={isLoadingStudents || disabled}
                    style={loadMoreBtnStyle}
                    title="Tải thêm học viên"
                  >
                    {isLoadingStudents ? '...' : '+'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Course Filter (Admin & Staff only) */}
        {(isAdmin || isStaff) && (
          <div>
            <label style={labelStyle}>Khóa học</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <input
                type="text"
                placeholder="Gõ để tìm khóa học..."
                value={courseSearch}
                onChange={(e) => {
                  setCourseSearch(e.target.value);
                  fetchCourses(1, e.target.value);
                }}
                disabled={disabled}
                style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}
              />
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <select
                  id="attendance-course-filter"
                  value={filters.courseId || ''}
                  onChange={(e) =>
                    onFilterChange({
                      courseId: e.target.value ? Number(e.target.value) : undefined,
                      page: 1
                    })
                  }
                  disabled={disabled || isLoadingCourses}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  <option value="">-- Tất cả khóa học --</option>
                  {courses.map((co) => (
                    <option key={co.id} value={co.id}>
                      {co.courseCode} - {co.courseName}
                    </option>
                  ))}
                </select>
                {coursePage < courseTotalPages && (
                  <button
                    type="button"
                    onClick={() => fetchCourses(coursePage + 1, courseSearch, true)}
                    disabled={isLoadingCourses || disabled}
                    style={loadMoreBtnStyle}
                    title="Tải thêm khóa học"
                  >
                    {isLoadingCourses ? '...' : '+'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Teacher Filter (Admin only) */}
        {isAdmin && (
          <div>
            <label style={labelStyle}>Giáo viên</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <input
                type="text"
                placeholder="Gõ để tìm giáo viên..."
                value={teacherSearch}
                onChange={(e) => {
                  setTeacherSearch(e.target.value);
                  fetchTeachers(1, e.target.value);
                }}
                disabled={disabled}
                style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}
              />
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <select
                  id="attendance-teacher-filter"
                  value={filters.teacherId || ''}
                  onChange={(e) =>
                    onFilterChange({
                      teacherId: e.target.value ? Number(e.target.value) : undefined,
                      page: 1
                    })
                  }
                  disabled={disabled || isLoadingTeachers}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  <option value="">-- Tất cả giáo viên --</option>
                  {teachers.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {tc.teacherCode} - {tc.fullName}
                    </option>
                  ))}
                </select>
                {teacherPage < teacherTotalPages && (
                  <button
                    type="button"
                    onClick={() => fetchTeachers(teacherPage + 1, teacherSearch, true)}
                    disabled={isLoadingTeachers || disabled}
                    style={loadMoreBtnStyle}
                    title="Tải thêm giáo viên"
                  >
                    {isLoadingTeachers ? '...' : '+'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button
          id="attendance-reset-filters-btn"
          type="button"
          onClick={() => {
            setLocalSearch('');
            setDateFrom('');
            setDateTo('');
            setDateError(null);
            setClassSearch('');
            setStudentSearch('');
            setCourseSearch('');
            setTeacherSearch('');
            onReset();
          }}
          disabled={disabled}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 500,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-subtle)',
            color: 'var(--color-text-secondary)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          🔄 Đặt lại bộ lọc
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
