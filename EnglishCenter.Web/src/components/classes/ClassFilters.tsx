import React, { useEffect, useState } from 'react';
import type { ClassStatus } from '../../types/class.types';
import { CLASS_STATUS_LABELS, VALID_CLASS_STATUSES } from '../../utils/classHelper';

interface ClassFiltersProps {
  search: string;
  status: ClassStatus | '';
  onSearchChange: (search: string) => void;
  onStatusChange: (status: ClassStatus | '') => void;
  onReset: () => void;
  disabled?: boolean;
}

export const ClassFilters: React.FC<ClassFiltersProps> = ({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onReset,
  disabled = false
}) => {
  const [localSearch, setLocalSearch] = useState<string>(search);

  // Synchronize local search with parent state (e.g. on URL param change / reset)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Single debounce layer for search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  const hasActiveFilters = Boolean(search || status);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '1rem',
        backgroundColor: 'var(--color-surface, #ffffff)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--color-border, #e2e8f0)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
        marginBottom: '1.25rem'
      }}
    >
      {/* Search Input */}
      <div style={{ flex: '1 1 320px', minWidth: '260px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              position: 'absolute',
              left: '0.875rem',
              color: 'var(--color-text-muted, #94a3b8)',
              fontSize: '1rem',
              pointerEvents: 'none'
            }}
            aria-hidden="true"
          >
            🔍
          </span>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            disabled={disabled}
            placeholder="Tìm theo mã lớp, tên khóa học hoặc tên giáo viên..."
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem 0.625rem 2.5rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: 'var(--color-canvas, #f8fafc)',
              color: 'var(--color-text-primary, #0f172a)',
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary, #1e40af)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border, #cbd5e1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              style={{
                position: 'absolute',
                right: '0.75rem',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted, #94a3b8)',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0.25rem'
              }}
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ flex: '0 1 200px', minWidth: '160px' }}>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as ClassStatus | '')}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-canvas, #f8fafc)',
            color: 'var(--color-text-primary, #0f172a)',
            outline: 'none',
            cursor: 'pointer'
          }}
          aria-label="Lọc theo trạng thái lớp học"
        >
          <option value="">Tất cả trạng thái</option>
          {VALID_CLASS_STATUSES.map((st) => (
            <option key={st} value={st}>
              {CLASS_STATUS_LABELS[st]}
            </option>
          ))}
        </select>
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          style={{
            padding: '0.625rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 500,
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--color-border, #cbd5e1)',
            backgroundColor: 'var(--color-surface-subtle, #f1f5f9)',
            color: 'var(--color-text-secondary, #475569)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          title="Xóa toàn bộ bộ lọc"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
};
