import React from 'react';
import type { QuizQueryParams, QuizStatus, TeacherQuizClassLookupItemResponse } from '../../types/quiz.types';

interface QuizFiltersProps {
  filters: QuizQueryParams;
  classes: TeacherQuizClassLookupItemResponse[];
  isLoadingClasses: boolean;
  onFilterChange: (newFilters: Partial<QuizQueryParams>) => void;
  onReset: () => void;
}

export const QuizFilters: React.FC<QuizFiltersProps> = ({
  filters,
  classes,
  isLoadingClasses,
  onFilterChange,
  onReset
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'flex-end'
        }}
      >
        {/* Search */}
        <div>
          <label
            htmlFor="quiz-search-input"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Tìm kiếm tiêu đề
          </label>
          <input
            id="quiz-search-input"
            type="text"
            placeholder="Nhập tiêu đề bài kiểm tra..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {/* Class Filter */}
        <div>
          <label
            htmlFor="quiz-class-select"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Lớp học
          </label>
          <select
            id="quiz-class-select"
            value={filters.classId || ''}
            onChange={(e) =>
              onFilterChange({
                classId: e.target.value ? parseInt(e.target.value, 10) : undefined,
                page: 1
              })
            }
            disabled={isLoadingClasses}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Tất cả lớp học</option>
            {classes.map((c) => (
              <option key={c.classId} value={c.classId}>
                {c.classCode} - {c.courseName}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="quiz-status-select"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Trạng thái
          </label>
          <select
            id="quiz-status-select"
            value={filters.status || ''}
            onChange={(e) =>
              onFilterChange({
                status: (e.target.value as QuizStatus) || undefined,
                page: 1
              })
            }
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem'
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Draft">Bản nháp (Draft)</option>
            <option value="Published">Đang mở (Published)</option>
            <option value="Closed">Đã đóng (Closed)</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label
            htmlFor="quiz-fromdate-input"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Từ ngày
          </label>
          <input
            id="quiz-fromdate-input"
            type="date"
            value={filters.fromDate || ''}
            onChange={(e) => onFilterChange({ fromDate: e.target.value || undefined, page: 1 })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {/* Date To */}
        <div>
          <label
            htmlFor="quiz-todate-input"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Đến ngày
          </label>
          <input
            id="quiz-todate-input"
            type="date"
            value={filters.toDate || ''}
            onChange={(e) => onFilterChange({ toDate: e.target.value || undefined, page: 1 })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {/* Sort By & Direction */}
        <div>
          <label
            htmlFor="quiz-sort-select"
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.375rem'
            }}
          >
            Sắp xếp
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              id="quiz-sort-select"
              value={filters.sortBy || ''}
              onChange={(e) => onFilterChange({ sortBy: e.target.value || undefined, page: 1 })}
              style={{
                flex: 1,
                padding: '0.5rem 0.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Mặc định</option>
              <option value="title">Tiêu đề</option>
              <option value="startat">Ngày mở</option>
              <option value="endat">Ngày kết thúc</option>
              <option value="createdat">Ngày tạo</option>
            </select>
            <select
              aria-label="Thứ tự sắp xếp"
              value={filters.sortDirection || 'desc'}
              onChange={(e) =>
                onFilterChange({
                  sortDirection: e.target.value as 'asc' | 'desc',
                  page: 1
                })
              }
              style={{
                width: '80px',
                padding: '0.5rem 0.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem'
              }}
            >
              <option value="desc">Giảm</option>
              <option value="asc">Tăng</option>
            </select>
          </div>
        </div>

        {/* Reset Button */}
        <div>
          <button
            type="button"
            onClick={onReset}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-subtle)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Đặt lại bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
};
