import React from 'react';
import type { AssignmentQueryParams, AssignmentStatus } from '../../types/assignment.types';
import { ClassLookupSelector } from './ClassLookupSelector';

interface AssignmentFiltersProps {
  filters: AssignmentQueryParams;
  onFilterChange: (newFilters: Partial<AssignmentQueryParams>) => void;
  onReset: () => void;
  isStudent?: boolean;
  onClassChange?: (classId: number, classItem?: any) => void;
}

export const AssignmentFilters: React.FC<AssignmentFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  isStudent = false,
  onClassChange
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
        flexDirection: 'column',
        gap: '0.75rem'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isStudent
            ? 'repeat(auto-fit, minmax(220px, 1fr))'
            : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          alignItems: 'end'
        }}
      >
        {/* Search Input */}
        <div>
          <label
            htmlFor="assignment-search"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-secondary, #4b5563)' }}
          >
            Tìm kiếm
          </label>
          <input
            id="assignment-search"
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder={isStudent ? 'Tìm bài tập theo tiêu đề, mô tả...' : 'Tiêu đề, mô tả, mã lớp...'}
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

        {/* Class Lookup Selector - OMITTED FOR STUDENT */}
        {!isStudent && (
          <div>
            <label
              htmlFor="class-lookup-selector"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-secondary, #4b5563)' }}
            >
              Lớp học
            </label>
            <ClassLookupSelector
              value={filters.classId}
              onChange={(classId, classItem) => {
                onFilterChange({ classId: classId || undefined });
                onClassChange?.(classId, classItem);
              }}
              placeholder="-- Tất cả lớp học --"
            />
          </div>
        )}

        {/* Status Filter */}
        <div>
          <label
            htmlFor="assignment-status"
            style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-secondary, #4b5563)' }}
          >
            Trạng thái
          </label>
          <select
            id="assignment-status"
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: (e.target.value as AssignmentStatus) || undefined })}
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
            <option value="">-- Tất cả trạng thái --</option>
            {!isStudent && <option value="Draft">Bản nháp</option>}
            <option value="Published">Đang mở</option>
            <option value="Closed">Đã đóng</option>
          </select>
        </div>

        {/* Due From (Management only) */}
        {!isStudent && (
          <div>
            <label
              htmlFor="assignment-due-from"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-secondary, #4b5563)' }}
            >
              Hạn nộp từ
            </label>
            <input
              id="assignment-due-from"
              type="date"
              value={filters.dueFrom ? filters.dueFrom.substring(0, 10) : ''}
              onChange={(e) => {
                const val = e.target.value;
                onFilterChange({ dueFrom: val ? new Date(val).toISOString() : undefined });
              }}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                fontSize: '0.85rem',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: 'var(--radius-md, 6px)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* Due To (Management only) */}
        {!isStudent && (
          <div>
            <label
              htmlFor="assignment-due-to"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--color-text-secondary, #4b5563)' }}
            >
              Hạn nộp đến
            </label>
            <input
              id="assignment-due-to"
              type="date"
              value={filters.dueTo ? filters.dueTo.substring(0, 10) : ''}
              onChange={(e) => {
                const val = e.target.value;
                onFilterChange({ dueTo: val ? new Date(val + 'T23:59:59.999Z').toISOString() : undefined });
              }}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                fontSize: '0.85rem',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: 'var(--radius-md, 6px)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            padding: '0.4rem 0.85rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--color-text-secondary, #4b5563)',
            backgroundColor: 'var(--color-surface-subtle, #f3f4f6)',
            border: '1px solid var(--color-border, #d1d5db)',
            borderRadius: 'var(--radius-md, 6px)',
            cursor: 'pointer'
          }}
        >
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );
};
