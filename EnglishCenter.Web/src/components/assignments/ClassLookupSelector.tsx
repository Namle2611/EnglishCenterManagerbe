import React, { useCallback, useEffect, useRef, useState } from 'react';
import { assignmentService } from '../../services/assignment.service';
import type { AssignmentClassLookupItem } from '../../types/assignment.types';
import { CLASS_STATUS_LABELS } from '../../utils/assignmentHelper';

interface ClassLookupSelectorProps {
  value: number | undefined;
  onChange: (classId: number, classItem?: AssignmentClassLookupItem) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  filterPlannedOngoingOnly?: boolean;
  id?: string;
}

export const ClassLookupSelector: React.FC<ClassLookupSelectorProps> = ({
  value,
  onChange,
  placeholder = '-- Chọn lớp học --',
  disabled = false,
  required = false,
  filterPlannedOngoingOnly = false,
  id = 'class-lookup-selector'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState<AssignmentClassLookupItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<AssignmentClassLookupItem | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch classes with server-side search and pagination
  const fetchClasses = useCallback(async (search: string, targetPage: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await assignmentService.getClassLookup(
        {
          search: search.trim() || undefined,
          page: targetPage,
          pageSize: 20
        },
        controller.signal
      );

      if (res.success && res.data) {
        setClasses(res.data.items || []);
        setTotalItems(res.data.totalItems || 0);

        // If we have a value and haven't loaded selectedClass yet
        if (value && !selectedClass) {
          const matched = res.data.items?.find((c) => (c.classId || c.id) === value);
          if (matched) {
            setSelectedClass(matched);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'CanceledError') {
        // Aborted - do nothing
        return;
      }
      setError('Không thể tải danh sách lớp học');
    } finally {
      setIsLoading(false);
    }
  }, [value, selectedClass]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // When value changes from outside
  useEffect(() => {
    if (value && classes.length > 0) {
      const matched = classes.find((c) => (c.classId || c.id) === value);
      if (matched) {
        const t = setTimeout(() => setSelectedClass(matched), 0);
        return () => clearTimeout(t);
      }
    } else if (!value) {
      const t = setTimeout(() => setSelectedClass(null), 0);
      return () => clearTimeout(t);
    }
  }, [value, classes]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses(searchTerm, 1);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchClasses]);

  const handleSelect = (item: AssignmentClassLookupItem) => {
    if (filterPlannedOngoingOnly && (item.status === 'Completed' || item.status === 'Cancelled')) {
      return; // Disabled for selection
    }
    setSelectedClass(item);
    onChange(item.classId || item.id || 0, item);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClass(null);
    onChange(0, undefined);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger button / input */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.55rem 0.75rem',
          backgroundColor: disabled ? 'var(--color-surface-subtle, #f3f4f6)' : 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #d1d5db)',
          borderRadius: 'var(--radius-md, 6px)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '2.5rem',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          {selectedClass ? (
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>
              <strong>{selectedClass.classCode}</strong>{selectedClass.courseName ? ` - ${selectedClass.courseName}` : ''}
            </span>
          ) : (
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #9ca3af)' }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {selectedClass && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Xóa lựa chọn"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary, #9ca3af)',
                fontSize: '0.875rem',
                padding: '0.1rem 0.25rem'
              }}
            >
              ✕
            </button>
          )}
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #9ca3af)' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Dropdown content */}
      {isOpen && !disabled && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #d1d5db)',
            borderRadius: 'var(--radius-md, 6px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 50,
            maxHeight: '18rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Search box inside dropdown */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
            <input
              type="text"
              className="class-lookup-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã lớp, tên lớp, khóa học..."
              autoFocus
              style={{
                width: '100%',
                padding: '0.4rem 0.6rem',
                fontSize: '0.85rem',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: 'var(--radius-sm, 4px)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* List items */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.25rem 0' }}>
            {isLoading ? (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary, #6b7280)' }}>
                Đang tìm lớp học...
              </div>
            ) : error ? (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#dc2626' }}>
                {error}
              </div>
            ) : classes.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary, #6b7280)' }}>
                Không tìm thấy lớp học nào
              </div>
            ) : (
              classes.map((cls) => {
                const isSelected = (selectedClass?.classId || selectedClass?.id) === (cls.classId || cls.id);
                const isStatusDisabled =
                  filterPlannedOngoingOnly && (cls.status === 'Completed' || cls.status === 'Cancelled');

                return (
                  <div
                    key={cls.classId || cls.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(cls)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: isStatusDisabled ? 'not-allowed' : 'pointer',
                      opacity: isStatusDisabled ? 0.5 : 1,
                      backgroundColor: isSelected
                        ? 'rgba(37, 99, 235, 0.08)'
                        : 'transparent',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
                        {cls.classCode}{cls.courseName ? ` - ${cls.courseName}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '9999px',
                          fontWeight: 500,
                          backgroundColor:
                            cls.status === 'Ongoing'
                              ? 'rgba(16, 185, 129, 0.1)'
                              : cls.status === 'Planned'
                              ? 'rgba(59, 130, 246, 0.1)'
                              : 'rgba(107, 114, 128, 0.1)',
                          color:
                            cls.status === 'Ongoing'
                              ? '#059669'
                              : cls.status === 'Planned'
                              ? '#2563eb'
                              : '#4b5563'
                        }}
                      >
                        {CLASS_STATUS_LABELS[cls.status] || cls.status}
                      </span>
                      {isSelected && <span style={{ color: '#2563eb', fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination summary / footer */}
          {totalItems > 20 && (
            <div
              style={{
                padding: '0.35rem 0.75rem',
                borderTop: '1px solid var(--color-border, #e5e7eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary, #6b7280)',
                backgroundColor: 'var(--color-surface-subtle, #f9fafb)'
              }}
            >
              <span>Tổng: {totalItems} lớp</span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => {
                    const prev = page - 1;
                    setPage(prev);
                    fetchClasses(searchTerm, prev);
                  }}
                  style={{
                    padding: '0.1rem 0.4rem',
                    fontSize: '0.7rem',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ◀
                </button>
                <span>Trang {page}</span>
                <button
                  type="button"
                  disabled={page * 20 >= totalItems || isLoading}
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    fetchClasses(searchTerm, next);
                  }}
                  style={{
                    padding: '0.1rem 0.4rem',
                    fontSize: '0.7rem',
                    cursor: page * 20 >= totalItems ? 'not-allowed' : 'pointer'
                  }}
                >
                  ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
