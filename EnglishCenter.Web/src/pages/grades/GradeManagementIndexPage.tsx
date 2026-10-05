import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { assignmentService } from '../../services/assignment.service';
import type { AssignmentClassLookupItem } from '../../types/assignment.types';
import type { ClassStatus } from '../../types/class.types';

export const GradeManagementIndexPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getRoleBaseUrl = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
  };
  const roleBaseUrl = getRoleBaseUrl();

  const [classes, setClasses] = useState<AssignmentClassLookupItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ClassStatus | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch classes with server-side search, status filter, and pagination
  const fetchClasses = useCallback(
    async (search: string, status: ClassStatus | '', targetPage: number) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await assignmentService.getClassLookup(
          {
            search: search.trim() || undefined,
            status: status || undefined,
            page: targetPage,
            pageSize
          },
          controller.signal
        );

        if (res.success && res.data) {
          setClasses(res.data.items || []);
          setTotalItems(res.data.totalItems || 0);
          setTotalPages(res.data.totalPages || 1);
        } else {
          setErrorMessage(res.message || 'Không thể tải danh sách lớp học.');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'CanceledError') {
          return;
        }
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'CanceledError') {
          return;
        }
        setErrorMessage('Không thể tải danh sách lớp học.');
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize]
  );

  // Initial and reactive fetch with debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses(searchTerm, statusFilter, page);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchTerm, statusFilter, page, fetchClasses]);

  const handleSelectClass = (cls: AssignmentClassLookupItem) => {
    const targetClassId = cls.classId || cls.id;
    if (targetClassId) {
      navigate(`${roleBaseUrl}/classes/${targetClassId}/grades`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as ClassStatus | '');
    setPage(1);
  };

  return (
    <div
      className="grade-management-index-page"
      style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}
    >
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.65rem',
            fontWeight: 700,
            color: 'var(--color-text-primary, #111827)'
          }}
        >
          Quản lý bảng điểm
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary, #6b7280)', fontSize: '0.9rem' }}>
          Chọn một lớp học để xem và quản lý bảng điểm của học viên.
        </p>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md, 8px)',
            color: '#b91c1c',
            fontSize: '0.875rem'
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          padding: '0.75rem',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: 'var(--radius-md, 8px)',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
          <input
            type="text"
            id="class-selector-search-input"
            placeholder="Tìm theo mã lớp, khóa học..."
            value={searchTerm}
            onChange={handleSearchChange}
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

        <div style={{ minWidth: '160px' }}>
          <select
            id="class-selector-status-filter"
            aria-label="Lọc theo trạng thái lớp"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              border: '1px solid var(--color-border, #d1d5db)',
              borderRadius: 'var(--radius-md, 6px)',
              backgroundColor: 'var(--color-surface, #ffffff)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Tất cả trạng thái (kể cả lịch sử)</option>
            <option value="Ongoing">Đang diễn ra</option>
            <option value="Planned">Sắp diễn ra</option>
            <option value="Completed">Đã kết thúc</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Class Selector List / Cards */}
      <div className="class-selector-container">
        {isLoading && classes.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 'var(--radius-md, 8px)',
              color: 'var(--color-text-secondary, #6b7280)'
            }}
          >
            Đang tìm kiếm lớp học...
          </div>
        ) : classes.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 'var(--radius-md, 8px)',
              color: 'var(--color-text-secondary, #6b7280)'
            }}
          >
            Không tìm thấy lớp học nào phù hợp.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1rem'
            }}
          >
            {classes.map((cls) => {
              const targetId = cls.classId || cls.id;
              const isOngoing = cls.status === 'Ongoing';
              const isPlanned = cls.status === 'Planned';
              const isCompleted = cls.status === 'Completed';

              return (
                <div
                  key={targetId}
                  data-testid={`class-selector-card-${targetId}`}
                  onClick={() => handleSelectClass(cls)}
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--color-surface, #ffffff)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: 'var(--radius-md, 8px)',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          color: '#2563eb'
                        }}
                      >
                        {cls.classCode}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          backgroundColor: isOngoing
                            ? '#ecfdf5'
                            : isPlanned
                            ? '#eff6ff'
                            : isCompleted
                            ? '#f3f4f6'
                            : '#fef2f2',
                          color: isOngoing
                            ? '#065f46'
                            : isPlanned
                            ? '#1e40af'
                            : isCompleted
                            ? '#4b5563'
                            : '#991b1b',
                          border: '1px solid rgba(0,0,0,0.08)'
                        }}
                      >
                        {cls.status}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--color-text-primary, #111827)',
                        marginBottom: '0.75rem'
                      }}
                    >
                      {cls.courseName}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--color-border, #f3f4f6)',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-secondary, #6b7280)'
                    }}
                  >
                    <div>
                      {cls.startDate && (
                        <span>Từ: {new Date(cls.startDate).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>
                      Xem bảng điểm →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '1.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary, #6b7280)'
            }}
          >
            <div>
              Trang <strong>{page}</strong> / <strong>{totalPages}</strong> ({totalItems} lớp học)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                id="class-selector-prev-btn"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-sm, 4px)',
                  border: '1px solid var(--color-border, #d1d5db)',
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  cursor: page <= 1 || isLoading ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 || isLoading ? 0.5 : 1,
                  minHeight: '36px'
                }}
              >
                ◀ Trang trước
              </button>
              <button
                type="button"
                id="class-selector-next-btn"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-sm, 4px)',
                  border: '1px solid var(--color-border, #d1d5db)',
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  cursor: page >= totalPages || isLoading ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages || isLoading ? 0.5 : 1,
                  minHeight: '36px'
                }}
              >
                Trang sau ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
