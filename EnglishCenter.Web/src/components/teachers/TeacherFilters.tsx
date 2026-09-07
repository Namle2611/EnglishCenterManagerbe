import React from 'react';
import type { TeacherStatus } from '../../types/teacher.types';

interface TeacherFiltersProps {
  status?: TeacherStatus;
  specialization?: string;
  onStatusChange: (status?: TeacherStatus) => void;
  onSpecializationChange: (specialization?: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  disabled?: boolean;
}

export const TeacherFilters: React.FC<TeacherFiltersProps> = ({
  status,
  specialization = '',
  onStatusChange,
  onSpecializationChange,
  onClearFilters,
  hasActiveFilters,
  disabled = false
}) => {
  return (
    <div style={filterContainerStyle}>
      {/* Status Filter */}
      <div style={fieldGroupStyle}>
        <label htmlFor="teacher-status-filter" style={labelStyle}>
          Trạng thái:
        </label>
        <select
          id="teacher-status-filter"
          value={status || ''}
          onChange={(e) => {
            const val = e.target.value as TeacherStatus;
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

      {/* Specialization Filter */}
      <div style={fieldGroupStyle}>
        <label htmlFor="teacher-spec-filter" style={labelStyle}>
          Chuyên môn:
        </label>
        <input
          id="teacher-spec-filter"
          type="text"
          value={specialization}
          onChange={(e) => onSpecializationChange(e.target.value)}
          placeholder="IELTS, TOEIC, Ngữ pháp..."
          disabled={disabled}
          style={inputStyle}
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          disabled={disabled}
          style={clearButtonStyle}
          title="Xóa tất cả bộ lọc đang chọn"
        >
          ✕ Xóa bộ lọc
        </button>
      )}
    </div>
  );
};

const filterContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.875rem'
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap'
};

const selectStyle: React.CSSProperties = {
  padding: '0.45rem 0.75rem',
  fontSize: '0.8125rem',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer'
};

const inputStyle: React.CSSProperties = {
  padding: '0.45rem 0.75rem',
  fontSize: '0.8125rem',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  width: '140px'
};

const clearButtonStyle: React.CSSProperties = {
  padding: '0.45rem 0.75rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--status-danger-text)',
  backgroundColor: 'var(--status-danger-bg)',
  border: '1px solid var(--status-danger-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease'
};
