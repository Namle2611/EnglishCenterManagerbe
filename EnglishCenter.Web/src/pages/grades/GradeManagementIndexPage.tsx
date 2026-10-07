import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { assignmentService } from '../../services/assignment.service';
import type { AssignmentClassLookupItem } from '../../types/assignment.types';
import type { ClassStatus } from '../../types/class.types';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { Pagination } from '../../components/common/Pagination';
import { ClassStatusBadge } from '../../components/classes/ClassStatusBadge';

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
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ClassStatus | ''>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch classes with server-side search, status filter, and pagination
  const fetchClasses = useCallback(
    async (search: string, status: ClassStatus | '', targetPage: number, currentPageSize: number) => {
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
            pageSize: currentPageSize
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
    []
  );

  // Initial and reactive fetch with debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses(searchTerm, statusFilter, page, pageSize);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchTerm, statusFilter, page, pageSize, fetchClasses]);

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

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter);

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Page Header */}
        <PageHeader
          title="Quản lý bảng điểm"
          subtitle="Chọn một lớp học để xem và quản lý bảng điểm của học viên"
          breadcrumbs={[{ label: 'Quản lý bảng điểm' }]}
        />

        {/* Error alert */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-lg, 12px)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchClasses(searchTerm, statusFilter, page, pageSize)}
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: '#ffffff',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md, 8px)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            backgroundColor: 'var(--color-surface, #ffffff)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', flex: '1 1 auto' }}>
            {/* Search Input with Icon & Clear button */}
            <div style={{ flex: '1 1 300px', minWidth: '240px', position: 'relative' }}>
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
                id="class-selector-search-input"
                placeholder="Tìm theo mã lớp, khóa học..."
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={isLoading && classes.length === 0}
                style={{
                  width: '100%',
                  padding: '0.625rem 2.25rem 0.625rem 2.375rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  backgroundColor: 'var(--color-canvas, #f8fafc)',
                  color: 'var(--color-text-primary, #0f172a)',
                  outline: 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  boxSizing: 'border-box'
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
                    setPage(1);
                  }}
                  aria-label="Xóa từ khóa tìm kiếm"
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

            {/* Status Filter */}
            <div style={{ minWidth: '180px' }}>
              <select
                id="class-selector-status-filter"
                aria-label="Lọc theo trạng thái lớp"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                disabled={isLoading && classes.length === 0}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text-primary, #0f172a)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tất cả trạng thái (kể cả lịch sử)</option>
                <option value="Ongoing">Đang diễn ra (Ongoing)</option>
                <option value="Planned">Sắp diễn ra (Planned)</option>
                <option value="Completed">Đã kết thúc (Completed)</option>
                <option value="Cancelled">Đã hủy (Cancelled)</option>
              </select>
            </div>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-text-secondary, #475569)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  borderRadius: 'var(--radius-md, 8px)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, #f8fafc)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>✕</span>
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>

          {/* View Mode Toggle (Table / Grid) */}
          <div
            style={{
              display: 'inline-flex',
              padding: '2px',
              backgroundColor: 'var(--color-surface-subtle, #f1f5f9)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border, #e2e8f0)'
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Xem dạng bảng"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: 'var(--radius-sm, 6px)',
                cursor: 'pointer',
                backgroundColor: viewMode === 'table' ? 'var(--color-surface, #ffffff)' : 'transparent',
                color: viewMode === 'table' ? 'var(--color-primary, #2563eb)' : 'var(--color-text-secondary, #64748b)',
                boxShadow: viewMode === 'table' ? 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>☰</span>
              <span>Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Xem dạng thẻ"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                borderRadius: 'var(--radius-sm, 6px)',
                cursor: 'pointer',
                backgroundColor: viewMode === 'cards' ? 'var(--color-surface, #ffffff)' : 'transparent',
                color: viewMode === 'cards' ? 'var(--color-primary, #2563eb)' : 'var(--color-text-secondary, #64748b)',
                boxShadow: viewMode === 'cards' ? 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>⊞</span>
              <span>Thẻ</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && classes.length === 0 && (
          <LoadingState message="Đang tải danh sách lớp học..." />
        )}

        {/* Empty State */}
        {!isLoading && classes.length === 0 && (
          <EmptyState
            title={hasActiveFilters ? 'Không tìm thấy lớp học phù hợp' : 'Chưa có lớp học nào'}
            description={
              hasActiveFilters
                ? 'Không có lớp học nào khớp với từ khóa tìm kiếm hoặc trạng thái đã chọn.'
                : 'Chưa có lớp học nào được tạo trong hệ thống.'
            }
            actionText={hasActiveFilters ? 'Xóa bộ lọc' : undefined}
            onAction={hasActiveFilters ? handleResetFilters : undefined}
          />
        )}

        {/* Data List Presentation */}
        {classes.length > 0 && (
          <div className="class-selector-container">
            {viewMode === 'table' ? (
              /* Synchronized Standard Table View */
              <div
                style={{
                  overflowX: 'auto',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  borderRadius: 'var(--radius-lg, 12px)',
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.875rem'
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--color-surface-hover, #f8fafc)',
                        borderBottom: '1px solid var(--color-border, #e2e8f0)'
                      }}
                    >
                      <th style={headerCellStyle}>Mã lớp</th>
                      <th style={headerCellStyle}>Khóa học</th>
                      <th style={headerCellStyle}>Thời gian bắt đầu</th>
                      <th style={headerCellStyle}>Trạng thái</th>
                      <th style={{ ...headerCellStyle, textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => {
                      const targetId = cls.classId || cls.id;
                      return (
                        <tr
                          key={targetId}
                          data-testid={`class-selector-card-${targetId}`}
                          onClick={() => handleSelectClass(cls)}
                          style={{
                            borderBottom: '1px solid var(--color-border-subtle, #f1f5f9)',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, #f8fafc)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {/* Mã lớp */}
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: 'var(--color-primary, #2563eb)',
                                fontSize: '0.9rem'
                              }}
                            >
                              {cls.classCode}
                            </span>
                          </td>

                          {/* Khóa học */}
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <span
                              style={{
                                fontWeight: 600,
                                color: 'var(--color-text-primary, #0f172a)'
                              }}
                            >
                              {cls.courseName}
                            </span>
                          </td>

                          {/* Bắt đầu */}
                          <td
                            style={{
                              padding: '0.875rem 1rem',
                              color: 'var(--color-text-secondary, #475569)',
                              fontVariantNumeric: 'tabular-nums'
                            }}
                          >
                            {cls.startDate
                              ? new Date(cls.startDate).toLocaleDateString('vi-VN')
                              : '—'}
                          </td>

                          {/* Trạng thái */}
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <ClassStatusBadge status={cls.status} />
                          </td>

                          {/* Thao tác */}
                          <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectClass(cls);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.4375rem 0.875rem',
                                backgroundColor: 'var(--color-primary-subtle, #eff6ff)',
                                color: 'var(--color-primary, #2563eb)',
                                border: '1px solid var(--color-primary-border, #bfdbfe)',
                                borderRadius: 'var(--radius-md, 6px)',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-primary, #2563eb)';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-primary-subtle, #eff6ff)';
                                e.currentTarget.style.color = 'var(--color-primary, #2563eb)';
                              }}
                            >
                              <span>Xem bảng điểm</span>
                              <span>→</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Synchronized Modern Card Grid View */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.25rem'
                }}
              >
                {classes.map((cls) => {
                  const targetId = cls.classId || cls.id;
                  return (
                    <div
                      key={targetId}
                      data-testid={`class-selector-card-${targetId}`}
                      onClick={() => handleSelectClass(cls)}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--color-surface, #ffffff)',
                        border: '1px solid var(--color-border, #e2e8f0)',
                        borderRadius: 'var(--radius-lg, 12px)',
                        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))';
                        e.currentTarget.style.borderColor = 'var(--color-primary-border, #bfdbfe)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))';
                        e.currentTarget.style.borderColor = 'var(--color-border, #e2e8f0)';
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.625rem'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '1.05rem',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: 'var(--color-primary, #2563eb)'
                            }}
                          >
                            {cls.classCode}
                          </span>
                          <ClassStatusBadge status={cls.status} />
                        </div>

                        <div
                          style={{
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            color: 'var(--color-text-primary, #0f172a)',
                            lineHeight: 1.4
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
                          paddingTop: '0.875rem',
                          borderTop: '1px solid var(--color-border-subtle, #f1f5f9)',
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-secondary, #64748b)'
                        }}
                      >
                        <div>
                          {cls.startDate ? (
                            <span>Từ: {new Date(cls.startDate).toLocaleDateString('vi-VN')}</span>
                          ) : (
                            <span>Chưa có lịch</span>
                          )}
                        </div>
                        <span
                          style={{
                            color: 'var(--color-primary, #2563eb)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          Xem bảng điểm →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            <Pagination
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newPageSize) => {
                setPageSize(newPageSize);
                setPage(1);
              }}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
};

const headerCellStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary, #475569)',
  fontSize: '0.8125rem',
  textTransform: 'uppercase',
  letterSpacing: '0.025em'
};
