import React from 'react';
import type { SubmissionQueryParams } from '../../types/assignment.types';

interface SubmissionFilterBarProps {
  filters: SubmissionQueryParams;
  onFilterChange: (newFilters: Partial<SubmissionQueryParams>) => void;
  onReset: () => void;
}

export const SubmissionFilterBar: React.FC<SubmissionFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e5e7eb)',
        borderRadius: 'var(--radius-lg, 8px)',
        padding: '1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'flex-end',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '16rem' }}>
        {/* Search */}
        <div style={{ flex: '1 1 12rem' }}>
          <label
            htmlFor="submission-search"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-secondary, #4b5563)' }}
          >
            Tìm kiếm học viên
          </label>
          <input
            id="submission-search-input"
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Mã học viên hoặc họ tên..."
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              border: '1px solid var(--color-border, #d1d5db)',
              borderRadius: 'var(--radius-md, 6px)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* IsLate Filter */}
        <div style={{ minWidth: '8.5rem' }}>
          <label
            htmlFor="submission-late-select"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-secondary, #4b5563)' }}
          >
            Tiến độ nộp
          </label>
          <select
            id="submission-late-select"
            value={filters.isLate === undefined ? '' : filters.isLate ? 'true' : 'false'}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({
                isLate: val === '' ? undefined : val === 'true'
              });
            }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              border: '1px solid var(--color-border, #d1d5db)',
              borderRadius: 'var(--radius-md, 6px)',
              outline: 'none',
              backgroundColor: 'var(--color-surface, #ffffff)',
              boxSizing: 'border-box'
            }}
          >
            <option value="">-- Tất cả --</option>
            <option value="false">Đúng hạn</option>
            <option value="true">Nộp muộn</option>
          </select>
        </div>

        {/* IsGraded Filter */}
        <div style={{ minWidth: '8.5rem' }}>
          <label
            htmlFor="submission-graded-select"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-secondary, #4b5563)' }}
          >
            Chấm điểm
          </label>
          <select
            id="submission-graded-select"
            value={filters.isGraded === undefined ? '' : filters.isGraded ? 'true' : 'false'}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({
                isGraded: val === '' ? undefined : val === 'true'
              });
            }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              border: '1px solid var(--color-border, #d1d5db)',
              borderRadius: 'var(--radius-md, 6px)',
              outline: 'none',
              backgroundColor: 'var(--color-surface, #ffffff)',
              boxSizing: 'border-box'
            }}
          >
            <option value="">-- Tất cả --</option>
            <option value="true">Đã chấm điểm</option>
            <option value="false">Chưa chấm điểm</option>
          </select>
        </div>
      </div>

      {/* Reset button */}
      <div>
        <button
          type="button"
          onClick={onReset}
          style={{
            padding: '0.45rem 0.85rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--color-text-secondary, #4b5563)',
            backgroundColor: 'var(--color-surface-subtle, #f3f4f6)',
            border: '1px solid var(--color-border, #d1d5db)',
            borderRadius: 'var(--radius-md, 6px)',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );
};
