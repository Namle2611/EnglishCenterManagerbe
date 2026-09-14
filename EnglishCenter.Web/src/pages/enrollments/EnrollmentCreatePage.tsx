import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { studentService } from '../../services/student.service';
import { courseService } from '../../services/course.service';
import { enrollmentService } from '../../services/enrollment.service';
import type { CreateEnrollmentPayload } from '../../types/enrollment.types';
import type { StudentListItem } from '../../types/student.types';
import type { CourseListItem } from '../../types/course.types';
import {
  formatVND,
  getEnrollmentApiErrorMessage,
  getEnrollmentBasePath,
  isValidCalendarDate
} from '../../utils/enrollmentHelper';

export const EnrollmentCreatePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getEnrollmentBasePath(location.pathname);

  // Form states
  const [studentId, setStudentId] = useState<number | ''>('');
  const [courseId, setCourseId] = useState<number | ''>('');
  const [tuitionAmount, setTuitionAmount] = useState<string>('');
  const [enrollmentDate, setEnrollmentDate] = useState<string>('');

  // Active Student Lookup (server-side searchable & paginated)
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [studentPage, setStudentPage] = useState<number>(1);
  const [studentTotalPages, setStudentTotalPages] = useState<number>(1);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);

  // Active Course Lookup (server-side searchable & paginated)
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [coursePage, setCoursePage] = useState<number>(1);
  const [courseTotalPages, setCourseTotalPages] = useState<number>(1);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);

  // Selected Course details for helper text
  const selectedCourse = courses.find((c) => c.id === courseId);

  // Submission & Error handling
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch Active Students
  const fetchStudents = useCallback(async (page: number, term: string, append = false) => {
    setIsLoadingStudents(true);
    try {
      const res = await studentService.getStudents({
        status: 'Active',
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

  // Fetch Active Courses
  const fetchCourses = useCallback(async (page: number, term: string, append = false) => {
    setIsLoadingCourses(true);
    try {
      const res = await courseService.getCourses({
        status: 'Active',
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

  // Initial load
  useEffect(() => {
    fetchStudents(1, '');
    fetchCourses(1, '');
  }, [fetchStudents, fetchCourses]);

  // Debounced student search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1, studentSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch, fetchStudents]);

  // Debounced course search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses(1, courseSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [courseSearch, fetchCourses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Synchronous anti-double submit ref guard
    if (isSubmittingRef.current) return;

    setServerError(null);
    setValidationError(null);

    if (!studentId || typeof studentId !== 'number' || studentId <= 0) {
      setValidationError('Vui lòng chọn học viên.');
      return;
    }

    if (!courseId || typeof courseId !== 'number' || courseId <= 0) {
      setValidationError('Vui lòng chọn khóa học.');
      return;
    }

    // Build strict payload according to Section 4:
    // Only studentId, courseId, tuitionAmount?, enrollmentDate?
    // Blank values omitted completely.
    const payload: CreateEnrollmentPayload = {
      studentId,
      courseId
    };

    if (tuitionAmount.trim() !== '') {
      const parsedTuition = Number(tuitionAmount);
      if (isNaN(parsedTuition) || parsedTuition < 0) {
        setValidationError('Học phí phải là một số không âm.');
        return;
      }
      payload.tuitionAmount = parsedTuition;
    }

    if (enrollmentDate.trim() !== '') {
      if (!isValidCalendarDate(enrollmentDate.trim())) {
        setValidationError('Ngày ghi danh không hợp lệ. Vui lòng nhập theo định dạng YYYY-MM-DD.');
        return;
      }
      payload.enrollmentDate = enrollmentDate.trim();
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await enrollmentService.createEnrollment(payload);
      if (response.success && response.data) {
        navigate(`${basePath}/${response.data.id}`, {
          state: { flashMessage: 'Tạo đơn ghi danh mới thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể tạo đơn ghi danh.');
      }
    } catch (err: unknown) {
      setServerError(getEnrollmentApiErrorMessage(err));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      {/* Breadcrumb / Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to={basePath}
          id="back-to-enrollments-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--color-primary)',
            textDecoration: 'none'
          }}
        >
          &larr; Quay lại danh sách ghi danh
        </Link>
      </div>

      <PageHeader
        title="Tạo đơn ghi danh mới"
        subtitle="Chọn học viên đang hoạt động, khóa học và thiết lập thông tin ghi danh"
      />

      {/* Error Banners */}
      {validationError && (
        <div
          id="create-validation-error"
          role="alert"
          style={{
            padding: '0.875rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            color: 'var(--status-danger-text)',
            fontSize: '0.875rem'
          }}
        >
          ⚠️ {validationError}
        </div>
      )}

      {serverError && (
        <div
          id="create-server-error"
          role="alert"
          style={{
            padding: '0.875rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--status-danger-bg)',
            border: '1px solid var(--status-danger-border)',
            color: 'var(--status-danger-text)',
            fontSize: '0.875rem'
          }}
        >
          ❌ {serverError}
        </div>
      )}

      <form
        id="enrollment-create-form"
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.5rem',
          maxWidth: '720px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Section 1: Student Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="student-select"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.5rem'
            }}
          >
            Học viên <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>

          <div style={{ marginBottom: '0.5rem' }}>
            <input
              id="student-search-input"
              type="text"
              placeholder="Tìm kiếm học viên theo mã hoặc tên..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                marginBottom: '0.5rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              id="student-select"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : '')}
              disabled={isSubmitting || isLoadingStudents}
              required
              style={{
                flex: 1,
                padding: '0.625rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                outline: 'none'
              }}
            >
              <option value="">-- Chọn học viên (chỉ hiển thị Active) --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentCode} — {s.fullName} ({s.email})
                </option>
              ))}
            </select>

            {studentPage < studentTotalPages && (
              <button
                type="button"
                id="load-more-students-btn"
                onClick={() => fetchStudents(studentPage + 1, studentSearch, true)}
                disabled={isLoadingStudents || isSubmitting}
                style={{
                  padding: '0.625rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {isLoadingStudents ? 'Đang tải...' : 'Tải thêm'}
              </button>
            )}
          </div>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.375rem'
            }}
          >
            Chỉ những học viên có trạng thái hoạt động (Active) mới được phép tạo đơn ghi danh mới.
          </p>
        </div>

        {/* Section 2: Course Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="course-select"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.5rem'
            }}
          >
            Khóa học <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>

          <div style={{ marginBottom: '0.5rem' }}>
            <input
              id="course-search-input"
              type="text"
              placeholder="Tìm kiếm khóa học theo mã hoặc tên..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                marginBottom: '0.5rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              id="course-select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : '')}
              disabled={isSubmitting || isLoadingCourses}
              required
              style={{
                flex: 1,
                padding: '0.625rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                outline: 'none'
              }}
            >
              <option value="">-- Chọn khóa học (chỉ hiển thị Active) --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} — {c.courseName} ({formatVND(c.tuitionFee)})
                </option>
              ))}
            </select>

            {coursePage < courseTotalPages && (
              <button
                type="button"
                id="load-more-courses-btn"
                onClick={() => fetchCourses(coursePage + 1, courseSearch, true)}
                disabled={isLoadingCourses || isSubmitting}
                style={{
                  padding: '0.625rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {isLoadingCourses ? 'Đang tải...' : 'Tải thêm'}
              </button>
            )}
          </div>

          {selectedCourse && (
            <div
              id="course-tuition-helper"
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-subtle)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)'
              }}
            >
              💡 Học phí gốc của khóa học: <strong style={{ color: 'var(--color-primary)' }}>{formatVND(selectedCourse.tuitionFee)}</strong>.
              Nếu để trống ô học phí bên dưới, hệ thống sẽ tự động áp dụng mức học phí gốc này.
            </div>
          )}
        </div>

        {/* Section 3: Tuition Amount (Optional) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="tuition-amount-input"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.5rem'
            }}
          >
            Học phí áp dụng (VNĐ) <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>(Tùy chọn)</span>
          </label>
          <input
            id="tuition-amount-input"
            type="number"
            min="0"
            step="10000"
            placeholder="Để trống để áp dụng học phí gốc của khóa học"
            value={tuitionAmount}
            onChange={(e) => setTuitionAmount(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              outline: 'none'
            }}
          />
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.375rem'
            }}
          >
            Nhập số tiền nếu có học bổng, ưu đãi hoặc giảm giá đặc biệt. Để trống hệ thống sẽ áp dụng học phí gốc.
          </p>
        </div>

        {/* Section 4: Enrollment Date (Optional) */}
        <div style={{ marginBottom: '2rem' }}>
          <label
            htmlFor="enrollment-date-input"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.5rem'
            }}
          >
            Ngày ghi danh <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>(Tùy chọn)</span>
          </label>
          <input
            id="enrollment-date-input"
            type="date"
            value={enrollmentDate}
            onChange={(e) => setEnrollmentDate(e.target.value)}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              outline: 'none'
            }}
          />
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.375rem'
            }}
          >
            Để trống hệ thống sẽ tự động gán ngày hôm nay (UTC).
          </p>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border)'
          }}
        >
          <button
            type="button"
            id="cancel-create-btn"
            onClick={() => navigate(basePath)}
            disabled={isSubmitting}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            id="submit-create-btn"
            disabled={isSubmitting}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo đơn ghi danh'}
          </button>
        </div>
      </form>
    </AppShell>
  );
};
