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

  return (
    <div
      className="grade-roster-filters"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.75rem',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e5e7eb)',
        borderRadius: 'var(--radius-md, 8px)',
        marginBottom: '1rem'
      }}
    >
      {/* Search Input */}
      <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
        <input
          type="text"
          id="roster-search-input"
          placeholder="Tìm theo mã học viên, tên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
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

      {/* Membership Status Filter */}
      <div style={{ minWidth: '150px' }}>
        <select
          id="roster-membership-select"
          aria-label="Lọc theo trạng thái học viên"
          value={filters.membershipStatus || ''}
          onChange={handleMembershipChange}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            border: '1px solid var(--color-border, #d1d5db)',
            borderRadius: 'var(--radius-md, 6px)',
            backgroundColor: 'var(--color-surface, #ffffff)',
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
      <div style={{ minWidth: '140px' }}>
        <select
          id="roster-sortby-select"
          aria-label="Sắp xếp theo"
          value={filters.sortBy || 'studentcode'}
          onChange={handleSortByChange}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            border: '1px solid var(--color-border, #d1d5db)',
            borderRadius: 'var(--radius-md, 6px)',
            backgroundColor: 'var(--color-surface, #ffffff)',
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
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            border: '1px solid var(--color-border, #d1d5db)',
            borderRadius: 'var(--radius-md, 6px)',
            backgroundColor: 'var(--color-surface, #ffffff)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <span>{filters.isAscending !== false ? '↑ Tăng dần' : '↓ Giảm dần'}</span>
        </button>
      </div>
    </div>
  );
};
