import React from 'react';
import type { CourseStatus } from '../../types/course.types';

interface CourseFiltersProps {
  status?: CourseStatus;
  level?: string;
  onStatusChange: (status?: CourseStatus) => void;
  onLevelChange: (level?: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  disabled?: boolean;
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({
  status,
  level = '',
  onStatusChange,
  onLevelChange,
  onClearFilters,
  hasActiveFilters,
  disabled = false
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'flex-end',
        backgroundColor: 'var(--color-surface, #ffffff)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--color-border, #e2e8f0)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
      }}
    >
      {/* Status Filter */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
          minWidth: '180px'
        }}
      >
        <label
          htmlFor="course-status-filter"
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary, #475569)'
          }}
        >
          Trạng thái
        </label>
        <select
          id="course-status-filter"
          value={status || ''}
          onChange={(e) => {
            const val = e.target.value as CourseStatus;
            onStatusChange(val ? val : undefined);
          }}
          disabled={disabled}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-surface, #ffffff)',
            color: 'var(--color-text, #0f172a)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Đang hoạt động</option>
          <option value="Inactive">Không hoạt động</option>
        </select>
      </div>

      {/* Level Filter */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.375rem',
          minWidth: '200px'
        }}
      >
        <label
          htmlFor="course-level-filter"
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary, #475569)'
          }}
        >
          Trình độ
        </label>
        <input
          id="course-level-filter"
          type="text"
          value={level}
          onChange={(e) => onLevelChange(e.target.value)}
          placeholder="Ví dụ: A1, B2, IELTS..."
          disabled={disabled}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-surface, #ffffff)',
            color: 'var(--color-text, #0f172a)',
            outline: 'none'
          }}
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={onClearFilters}
            disabled={disabled}
            style={{
              padding: '0.5rem 0.875rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-muted, #64748b)',
              backgroundColor: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #cbd5e1)',
              borderRadius: 'var(--radius-md, 8px)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.15s ease'
            }}
            title="Xóa tất cả bộ lọc đang chọn"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

