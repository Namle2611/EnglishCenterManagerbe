import React, { useCallback, useEffect, useState } from 'react';
import { studentService } from '../../services/student.service';
import { courseService } from '../../services/course.service';
import { classService } from '../../services/class.service';
import type { PaymentFilterParams, PaymentMethod, PaymentStatus } from '../../types/payment.types';
import type { StudentListItem } from '../../types/student.types';
import type { CourseListItem } from '../../types/course.types';
import type { ClassListItem } from '../../types/class.types';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS
} from '../../utils/paymentHelper';

interface PaymentFiltersProps {
  filters: PaymentFilterParams;
  onFilterChange: (newFilters: Partial<PaymentFilterParams>) => void;
  onReset: () => void;
  disabled?: boolean;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  disabled = false
}) => {
  // Local state for debounced text search
  const [localSearch, setLocalSearch] = useState<string>(filters.search || '');

  // Local state for range validation
  const [dateFrom, setDateFrom] = useState<string>(filters.dateFrom || '');
  const [dateTo, setDateTo] = useState<string>(filters.dateTo || '');
  const [minAmount, setMinAmount] = useState<string>(filters.minAmount !== undefined ? String(filters.minAmount) : '');
  const [maxAmount, setMaxAmount] = useState<string>(filters.maxAmount !== undefined ? String(filters.maxAmount) : '');

  // Validation warnings
  const [dateError, setDateError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Historical Student Lookup (No active-only restriction, pageSize=20, server paginated)
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [studentPage, setStudentPage] = useState<number>(1);
  const [studentTotalPages, setStudentTotalPages] = useState<number>(1);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);

  // Historical Course Lookup (No active-only restriction, pageSize=20, server paginated)
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [coursePage, setCoursePage] = useState<number>(1);
  const [courseTotalPages, setCourseTotalPages] = useState<number>(1);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);

  // Historical Class Lookup (No active-only restriction, pageSize=20, server paginated)
  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [classSearch, setClassSearch] = useState<string>('');
  const [classPage, setClassPage] = useState<number>(1);
  const [classTotalPages, setClassTotalPages] = useState<number>(1);
  const [isLoadingClasses, setIsLoadingClasses] = useState<boolean>(false);

  // Sync incoming props
  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    setDateFrom(filters.dateFrom || '');
    setDateTo(filters.dateTo || '');
  }, [filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    setMinAmount(filters.minAmount !== undefined ? String(filters.minAmount) : '');
    setMaxAmount(filters.maxAmount !== undefined ? String(filters.maxAmount) : '');
  }, [filters.minAmount, filters.maxAmount]);

  // Debounced search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = localSearch.trim();
      if (trimmed !== (filters.search || '')) {
        onFilterChange({ search: trimmed || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, onFilterChange]);

  // Fetch Students (Historical, no active-only constraint)
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
      // Non-blocking lookup
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  // Fetch Courses (Historical, no active-only constraint)
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
      // Non-blocking lookup
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  // Fetch Classes (Historical, no active-only constraint)
  const fetchClasses = useCallback(async (page: number, term: string, append = false) => {
    setIsLoadingClasses(true);
    try {
      const res = await classService.getClasses({
        page,
        pageSize: 20,
        search: term || undefined
      });
      if (res.success && res.data) {
        setClasses((prev) => (append ? [...prev, ...res.data.items] : res.data.items));
        setClassTotalPages(res.data.totalPages || 1);
        setClassPage(page);
      }
    } catch {
      // Non-blocking lookup
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  // Initial lookup loading
  useEffect(() => {
    fetchStudents(1, '');
    fetchCourses(1, '');
    fetchClasses(1, '');
  }, [fetchStudents, fetchCourses, fetchClasses]);

  // Debounced student lookup search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1, studentSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch, fetchStudents]);

  // Debounced course lookup search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses(1, courseSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [courseSearch, fetchCourses]);

  // Debounced class lookup search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses(1, classSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [classSearch, fetchClasses]);

  // Date range dispatch with cross-validation
  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);

    if (from && to && from > to) {
      setDateError('Ngày bắt đầu không thể lớn hơn ngày kết thúc.');
      return;
    }

    setDateError(null);
    onFilterChange({
      dateFrom: from || undefined,
      dateTo: to || undefined,
      page: 1
    });
  };

  // Amount range dispatch with validation
  const handleAmountChange = (min: string, max: string) => {
    setMinAmount(min);
    setMaxAmount(max);

    const parsedMin = min !== '' ? Number(min) : undefined;
    const parsedMax = max !== '' ? Number(max) : undefined;

    if (parsedMin !== undefined && parsedMin < 0) {
      setAmountError('Số tiền tối thiểu không thể âm.');
      return;
    }
    if (parsedMax !== undefined && parsedMax < 0) {
      setAmountError('Số tiền tối đa không thể âm.');
      return;
    }
    if (parsedMin !== undefined && parsedMax !== undefined && parsedMin > parsedMax) {
      setAmountError('Số tiền tối thiểu không thể lớn hơn số tiền tối đa.');
      return;
    }

    setAmountError(null);
    onFilterChange({
      minAmount: parsedMin,
      maxAmount: parsedMax,
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
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      {/* Validation Error Banners */}
      {dateError && (
        <div
          role="alert"
          style={{
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            fontSize: '0.8125rem',
            border: '1px solid var(--status-danger-border)'
          }}
        >
          ⚠️ {dateError}
        </div>
      )}

      {amountError && (
        <div
          role="alert"
          style={{
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger-text)',
            fontSize: '0.8125rem',
            border: '1px solid var(--status-danger-border)'
          }}
        >
          ⚠️ {amountError}
        </div>
      )}

      {/* Row 1: Search & Enums */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Search */}
        <div>
          <label style={labelStyle}>Tìm kiếm</label>
          <input
            id="payment-search-input"
            type="text"
            placeholder="Mã/tên học viên, khóa học, lớp, mã GD, ghi chú..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            disabled={disabled}
            style={inputStyle}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label style={labelStyle}>Trạng thái thanh toán</label>
          <select
            id="payment-status-filter"
            value={filters.status || ''}
            onChange={(e) =>
              onFilterChange({
                status: (e.target.value as PaymentStatus) || undefined,
                page: 1
              })
            }
            disabled={disabled}
            style={inputStyle}
          >
            <option value="">-- Tất cả trạng thái --</option>
            {(['Pending', 'Completed', 'Failed', 'Cancelled'] as PaymentStatus[]).map((st) => (
              <option key={st} value={st}>
                {PAYMENT_STATUS_LABELS[st]} ({st})
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <label style={labelStyle}>Phương thức thanh toán</label>
          <select
            id="payment-method-filter"
            value={filters.paymentMethod || ''}
            onChange={(e) =>
              onFilterChange({
                paymentMethod: (e.target.value as PaymentMethod) || undefined,
                page: 1
              })
            }
            disabled={disabled}
            style={inputStyle}
          >
            <option value="">-- Tất cả phương thức --</option>
            {(['Cash', 'BankTransfer', 'Online'] as PaymentMethod[]).map((pm) => (
              <option key={pm} value={pm}>
                {PAYMENT_METHOD_LABELS[pm]} ({pm})
              </option>
            ))}
          </select>
        </div>

        {/* Enrollment ID Filter */}
        <div>
          <label style={labelStyle}>Mã ghi danh (ID)</label>
          <input
            id="payment-enrollment-id-filter"
            type="number"
            min="1"
            placeholder="Nhập ID đơn ghi danh..."
            value={filters.enrollmentId || ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              onFilterChange({ enrollmentId: val && val > 0 ? val : undefined, page: 1 });
            }}
            disabled={disabled}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Row 2: Lookups (Student, Course, Class) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Student Lookup */}
        <div>
          <label style={labelStyle}>Học viên (Lịch sử & Hiện hành)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <input
              type="text"
              placeholder="Gõ để tìm kiếm học viên..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              disabled={disabled}
              style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}
            />
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <select
                id="payment-student-filter"
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
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentCode} — {s.fullName} ({s.status})
                  </option>
                ))}
              </select>
              {studentPage < studentTotalPages && (
                <button
                  type="button"
                  onClick={() => fetchStudents(studentPage + 1, studentSearch, true)}
                  disabled={isLoadingStudents || disabled}
                  style={loadMoreBtnStyle}
                  title="Tải thêm 20 học viên tiếp theo"
                >
                  {isLoadingStudents ? '...' : '+'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Course Lookup */}
        <div>
          <label style={labelStyle}>Khóa học (Lịch sử & Hiện hành)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <input
              type="text"
              placeholder="Gõ để tìm kiếm khóa học..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              disabled={disabled}
              style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}
            />
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <select
                id="payment-course-filter"
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
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} — {c.courseName} ({c.status})
                  </option>
                ))}
              </select>
              {coursePage < courseTotalPages && (
                <button
                  type="button"
                  onClick={() => fetchCourses(coursePage + 1, courseSearch, true)}
                  disabled={isLoadingCourses || disabled}
                  style={loadMoreBtnStyle}
                  title="Tải thêm 20 khóa học tiếp theo"
                >
                  {isLoadingCourses ? '...' : '+'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Class Lookup */}
        <div>
          <label style={labelStyle}>Lớp học (Lịch sử & Hiện hành)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <input
              type="text"
              placeholder="Gõ để tìm kiếm lớp học..."
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              disabled={disabled}
              style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.375rem 0.625rem' }}
            />
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <select
                id="payment-class-filter"
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
                {classes.map((cl) => (
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
        </div>
      </div>

      {/* Row 3: Ranges & Reset */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '1rem',
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {/* Date Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ ...labelStyle, marginBottom: 0 }}>Từ ngày:</span>
            <input
              id="payment-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateChange(e.target.value, dateTo)}
              disabled={disabled}
              style={{ ...inputStyle, width: '150px' }}
            />
            <span style={{ ...labelStyle, marginBottom: 0 }}>Đến:</span>
            <input
              id="payment-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => handleDateChange(dateFrom, e.target.value)}
              disabled={disabled}
              style={{ ...inputStyle, width: '150px' }}
            />
          </div>

          {/* Amount Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ ...labelStyle, marginBottom: 0 }}>Số tiền từ:</span>
            <input
              id="payment-min-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={minAmount}
              onChange={(e) => handleAmountChange(e.target.value, maxAmount)}
              disabled={disabled}
              style={{ ...inputStyle, width: '130px' }}
            />
            <span style={{ ...labelStyle, marginBottom: 0 }}>Đến:</span>
            <input
              id="payment-max-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Tối đa"
              value={maxAmount}
              onChange={(e) => handleAmountChange(minAmount, e.target.value)}
              disabled={disabled}
              style={{ ...inputStyle, width: '130px' }}
            />
          </div>
        </div>

        {/* Reset Button */}
        <button
          type="button"
          id="payment-filter-reset-btn"
          onClick={() => {
            setDateError(null);
            setAmountError(null);
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
