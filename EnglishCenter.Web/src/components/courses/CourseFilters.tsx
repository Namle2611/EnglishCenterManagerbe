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
    <div style={filterContainerStyle}>
      {/* Status Filter */}
      <div style={fieldGroupStyle}>
        <label htmlFor="course-status-filter" style={labelStyle}>
          Trạng thái:
        </label>
        <select
          id="course-status-filter"
          value={status || ''}
          onChange={(e) => {
            const val = e.target.value as CourseStatus;
            onStatusChange(val ? val : undefined);
          }}
          disabled={disabled}
          style={selectStyle}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Đang hoạt động</option>
          <option value="Inactive">Không hoạt động</option>
        </select>
      </div>

      {/* Level Filter */}
      <div style={fieldGroupStyle}>
        <label htmlFor="course-level-filter" style={labelStyle}>
          Trình độ:
        </label>
        <input
          id="course-level-filter"
          type="text"
          value={level}
          onChange={(e) => onLevelChange(e.target.value)}
          placeholder="Ví dụ: A1, B2, IELTS..."
          disabled={disabled}
          style={inputStyle}
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={onClearFilters}
            disabled={disabled}
            style={clearButtonStyle}
            title="Xóa tất cả bộ lọc đang chọn"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

const filterContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1rem',
  alignItems: 'flex-end',
  backgroundColor: '#f8fafc',
  padding: '0.875rem 1rem',
  borderRadius: '8px',
  border: '1px solid #e2e8f0'
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  minWidth: '180px'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#475569'
};

const selectStyle: React.CSSProperties = {
  padding: '0.45rem 0.75rem',
  fontSize: '0.875rem',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#1e293b',
  outline: 'none',
  cursor: 'pointer'
};

const inputStyle: React.CSSProperties = {
  padding: '0.45rem 0.75rem',
  fontSize: '0.875rem',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#1e293b',
  outline: 'none'
};

const clearButtonStyle: React.CSSProperties = {
  padding: '0.45rem 0.85rem',
  fontSize: '0.85rem',
  fontWeight: 500,
  color: '#64748b',
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};
