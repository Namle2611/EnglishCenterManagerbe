import React from 'react';
import type { StudentStatus } from '../../types/student.types';

interface StudentFiltersProps {
  status?: StudentStatus;
  currentLevel?: string;
  onStatusChange: (status?: StudentStatus) => void;
  onCurrentLevelChange: (level?: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  disabled?: boolean;
}

export const StudentFilters: React.FC<StudentFiltersProps> = ({
  status,
  currentLevel = '',
  onStatusChange,
  onCurrentLevelChange,
  onClearFilters,
  hasActiveFilters,
  disabled = false
}) => {
  return (
    <div style={filterContainerStyle}>
      {/* Status Filter */}
      <div style={fieldGroupStyle}>
        <label htmlFor="student-status-filter" style={labelStyle}>
          Trạng thái:
        </label>
        <select
          id="student-status-filter"
          value={status || ''}
          onChange={(e) => {
            const val = e.target.value as StudentStatus;
            onStatusChange(val ? val : undefined);
          }}
          disabled={disabled}
          style={selectStyle}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Đang hoạt động</option>
          <option value="Inactive">Không hoạt động</option>
          <option value="Graduated">Đã tốt nghiệp</option>
          <option value="Suspended">Tạm khóa</option>
        </select>
      </div>

      {/* Current Level Filter */}
      <div style={fieldGroupStyle}>
        <label htmlFor="student-level-filter" style={labelStyle}>
          Trình độ:
        </label>
        <input
          id="student-level-filter"
          type="text"
          value={currentLevel}
          onChange={(e) => onCurrentLevelChange(e.target.value)}
          placeholder="A1, B2..."
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
          title="Xóa tất cả các bộ lọc hiện tại"
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
  width: '120px'
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
