import React, { useEffect, useState } from 'react';
import type { ClassStudentStatus } from '../../types/assignment.types';
import type { GradeQueryParams } from '../../types/grade.types';
import { MEMBERSHIP_STATUS_LABELS } from '../../utils/gradeHelper';

interface GradeRosterFiltersProps {
  filters: GradeQueryParams;
  onChange: (updatedFilters: GradeQueryParams) => void;
  disabled?: boolean;
}

export const GradeRosterFilters: React.FC<GradeRosterFiltersProps> = ({
  filters,
  onChange,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Synchronize incoming search prop
  useEffect(() => {
    void Promise.resolve().then(() => {
      setSearchTerm(filters.search || '');
    });
  }, [filters.search]);

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search || '') !== searchTerm.trim()) {
        onChange({
          ...filters,
          search: searchTerm.trim() || undefined,
          page: 1
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, filters, onChange]);

  const handleMembershipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ClassStudentStatus | '';
    onChange({
      ...filters,
      membershipStatus: value ? value : undefined,
      page: 1
    });
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      sortBy: e.target.value,
      page: 1
    });
  };

  const handleToggleSortDirection = () => {
    onChange({
      ...filters,
      isAscending: !filters.isAscending,
      page: 1
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    onChange({
      ...filters,
      search: undefined,
      membershipStatus: undefined,
      page: 1
    });
  };

  const hasActiveFilters = Boolean(searchTerm.trim() || filters.membershipStatus);

  return (
    <div
      className="grade-roster-filters"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
        marginBottom: '1.25rem'
      }}
    >
      {/* Search Input with Icon */}
      <div style={{ flex: '1 1 240px', minWidth: '200px', position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '0.875rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted, #94a3b8)',
            fontSize: '0.95rem',
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        >
          🔍
        </span>
        <input
          type="text"
          id="roster-search-input"
          placeholder="Tìm theo mã học viên, họ tên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.625rem 2.25rem 0.625rem 2.375rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-canvas, #f8fafc)',
            color: 'var(--color-text-primary, #0f172a)',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary, #2563eb)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border, #cbd5e1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              onChange({ ...filters, search: undefined, page: 1 });
            }}
            aria-label="Xóa tìm kiếm"
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted, #94a3b8)',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.2rem'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Membership Status Filter */}
      <div style={{ minWidth: '170px' }}>
        <select
          id="roster-membership-select"
          aria-label="Lọc theo trạng thái học viên"
          value={filters.membershipStatus || ''}
          onChange={handleMembershipChange}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-surface, #ffffff)',
            color: 'var(--color-text-primary, #0f172a)',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">{MEMBERSHIP_STATUS_LABELS.Active}</option>
          <option value="Completed">{MEMBERSHIP_STATUS_LABELS.Completed}</option>
          <option value="Withdrawn">{MEMBERSHIP_STATUS_LABELS.Withdrawn}</option>
        </select>
      </div>

      {/* Sort By Filter */}
      <div style={{ minWidth: '150px' }}>
        <select
          id="roster-sortby-select"
          aria-label="Sắp xếp theo"
          value={filters.sortBy || 'studentcode'}
          onChange={handleSortByChange}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-surface, #ffffff)',
            color: 'var(--color-text-primary, #0f172a)',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="studentcode">Mã học viên</option>
          <option value="studentname">Tên học viên</option>
          <option value="id">ID</option>
        </select>
      </div>

      {/* Sort Direction Toggle */}
      <div>
        <button
          type="button"
          id="roster-sort-dir-button"
          onClick={handleToggleSortDirection}
          disabled={disabled}
          title={filters.isAscending !== false ? 'Đang tăng dần (A-Z)' : 'Đang giảm dần (Z-A)'}
          style={{
            padding: '0.625rem 0.875rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            border: '1px solid var(--color-border, #cbd5e1)',
            borderRadius: 'var(--radius-md, 8px)',
            backgroundColor: 'var(--color-surface, #ffffff)',
            color: 'var(--color-text-secondary, #475569)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, #f8fafc)';
          }}
          onMouseLeave={(e) => {
            if (!disabled) e.currentTarget.style.backgroundColor = 'var(--color-surface, #ffffff)';
          }}
        >
          <span>{filters.isAscending !== false ? '↑ Tăng dần' : '↓ Giảm dần'}</span>
        </button>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleResetFilters}
          disabled={disabled}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--color-text-secondary, #475569)',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border, #cbd5e1)',
            borderRadius: 'var(--radius-md, 8px)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!disabled) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, #f8fafc)';
          }}
          onMouseLeave={(e) => {
            if (!disabled) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>✕</span>
          <span>Xóa bộ lọc</span>
        </button>
      )}
    </div>
  );
};
