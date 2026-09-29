import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CourseSelectorItem } from '../../types/learningContent.types';
import { learningContentService } from '../../services/learningContent.service';
import { extractErrorMessage } from '../../utils/learningContentHelper';

interface CourseSelectorProps {
  userRole: 'ADMIN' | 'STAFF' | 'TEACHER';
  selectedCourseId: number | null;
  onSelectCourse: (course: CourseSelectorItem) => void;
}

export const CourseSelector: React.FC<CourseSelectorProps> = ({
  userRole,
  selectedCourseId,
  onSelectCourse
}) => {
  const [courses, setCourses] = useState<CourseSelectorItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCourses = useCallback(async (searchQuery: string, pageNum: number, append: boolean = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    await Promise.resolve();
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      if (userRole === 'TEACHER') {
        // Teacher MUST use GET /api/sections/lookups/courses
        const res = await learningContentService.getTeacherCoursesLookup(
          {
            search: searchQuery.trim() || undefined,
            page: pageNum,
            pageSize: 15
          },
          controller.signal
        );

        if (res.success && res.data) {
          const mapped: CourseSelectorItem[] = res.data.items.map((item) => ({
            id: item.courseId,
            code: item.courseCode,
            name: item.courseName,
            level: item.level
          }));

          setCourses((prev) => (append ? [...prev, ...mapped] : mapped));
          setTotalPages(res.data.totalPages || 1);
          setPage(pageNum);

          // If current selectedCourseId exists and isn't yet selected, notify parent
          if (!selectedCourseId && mapped.length > 0 && !append && !searchQuery) {
            // Auto selection can be handled by parent or page route
          }
        }
      } else {
        // Admin / Staff use GET /api/courses with pagination
        const res = await learningContentService.getAdminStaffCourses(
          {
            search: searchQuery.trim() || undefined,
            page: pageNum,
            pageSize: 15
          },
          controller.signal
        );

        if (res.success && res.data) {
          const mapped: CourseSelectorItem[] = res.data.items.map((item) => ({
            id: item.id,
            code: item.courseCode,
            name: item.courseName,
            level: item.level
          }));

          setCourses((prev) => (append ? [...prev, ...mapped] : mapped));
          setTotalPages(res.data.totalPages || 1);
          setPage(pageNum);
        }
      }
    } catch (err: unknown) {
      // Ignore aborted requests
      if (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')) {
        return;
      }
      const msg = extractErrorMessage(err, 'Không thể tải danh sách khóa học.');
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [userRole, selectedCourseId]);

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses('', 1, false);
    }, 0);
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCourses]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses(searchTerm, 1, false);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      fetchCourses(searchTerm, page + 1, true);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: '1.25rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          📚 Chọn khóa học
        </h2>
        {userRole === 'TEACHER' && (
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--role-teacher-text)',
              backgroundColor: 'var(--role-teacher-bg)',
              padding: '0.15rem 0.4rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600
            }}
          >
            Lớp giảng dạy
          </span>
        )}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Tìm theo tên hoặc mã khóa học..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-subtle)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-primary)'
          }}
          aria-label="Tìm kiếm khóa học"
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          Tìm
        </button>
      </form>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '0.625rem 0.75rem',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem'
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Courses List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
          maxHeight: '320px',
          overflowY: 'auto',
          paddingRight: '0.25rem'
        }}
        role="listbox"
        aria-label="Danh sách khóa học"
      >
        {isLoading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Đang tải khóa học...
          </div>
        ) : courses.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
            {userRole === 'TEACHER'
              ? 'Thầy/cô chưa được phân công lớp học nào hoặc không tìm thấy khóa học.'
              : 'Không tìm thấy khóa học nào phù hợp.'}
          </div>
        ) : (
          courses.map((course) => {
            const isSelected = selectedCourseId === course.id;
            return (
              <button
                key={course.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectCourse(course)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-lg)',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        backgroundColor: isSelected ? '#ffffff' : 'var(--color-surface-subtle)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      {course.code}
                    </span>
                    {course.level && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                        ({course.level})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: isSelected ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {course.name}
                  </div>
                </div>
                {isSelected && (
                  <span style={{ fontSize: '1rem', color: 'var(--color-primary)', fontWeight: 700 }} aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Load More Button */}
      {page < totalPages && !isLoading && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          style={{
            marginTop: '0.25rem',
            padding: '0.45rem',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-border)',
            backgroundColor: 'var(--color-surface-subtle)',
            color: 'var(--color-text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 500,
            cursor: isLoadingMore ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoadingMore ? 'Đang tải thêm...' : 'Tải thêm khóa học...'}
        </button>
      )}
    </div>
  );
};
