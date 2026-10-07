import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { ClassGradebookResponse, GradeQueryParams } from '../../types/grade.types';
import { gradeService } from '../../services/grade.service';
import { GradeRosterFilters } from '../../components/grades/GradeRosterFilters';
import { GradeRosterTable } from '../../components/grades/GradeRosterTable';
import type { ClassStudentStatus } from '../../types/assignment.types';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { ClassStatusBadge } from '../../components/classes/ClassStatusBadge';

export const ClassGradebookPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const getRoleBaseUrl = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
  };
  const roleBaseUrl = getRoleBaseUrl();

  const numericClassId = classId ? parseInt(classId, 10) : NaN;

  // Gradebook state
  const [gradebook, setGradebook] = useState<ClassGradebookResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Parse filters from URL search params
  const currentFilters: GradeQueryParams = {
    search: searchParams.get('search') || undefined,
    membershipStatus: (searchParams.get('membershipStatus') as ClassStudentStatus) || undefined,
    sortBy: searchParams.get('sortBy') || 'studentcode',
    isAscending: searchParams.get('isAscending') !== 'false',
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '10', 10)
  };

  const fetchGradebook = useCallback(
    async (params: GradeQueryParams) => {
      if (Number.isNaN(numericClassId)) {
        setErrorMessage('Mã lớp học không hợp lệ.');
        setIsLoading(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await gradeService.getClassGradebook(
          numericClassId,
          params,
          controller.signal
        );

        if (res.success && res.data) {
          setGradebook(res.data);
        } else {
          setErrorMessage(res.message || 'Không thể tải bảng điểm của lớp học.');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'CanceledError') {
          return;
        }
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
          if (axiosErr.response?.status === 403) {
            setErrorMessage('Bạn không có quyền truy cập bảng điểm của lớp học này.');
          } else if (axiosErr.response?.status === 404) {
            setErrorMessage('Không tìm thấy lớp học yêu cầu.');
          } else {
            setErrorMessage(axiosErr.response?.data?.message || 'Lỗi khi tải bảng điểm.');
          }
        } else {
          setErrorMessage('Không thể kết nối tới máy chủ.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [numericClassId]
  );

  useEffect(() => {
    const filters: GradeQueryParams = {
      search: searchParams.get('search') || undefined,
      membershipStatus: (searchParams.get('membershipStatus') as ClassStudentStatus) || undefined,
      sortBy: searchParams.get('sortBy') || 'studentcode',
      isAscending: searchParams.get('isAscending') !== 'false',
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '10', 10)
    };

    void Promise.resolve().then(() => {
      fetchGradebook(filters);
    });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchGradebook, searchParams]);

  const handleFilterChange = (updatedFilters: GradeQueryParams) => {
    const params = new URLSearchParams();
    if (updatedFilters.search) params.set('search', updatedFilters.search);
    if (updatedFilters.membershipStatus) params.set('membershipStatus', updatedFilters.membershipStatus);
    if (updatedFilters.sortBy) params.set('sortBy', updatedFilters.sortBy);
    if (updatedFilters.isAscending !== undefined) params.set('isAscending', String(updatedFilters.isAscending));
    if (updatedFilters.page && updatedFilters.page > 1) params.set('page', String(updatedFilters.page));
    if (updatedFilters.pageSize && updatedFilters.pageSize !== 10) {
      params.set('pageSize', String(updatedFilters.pageSize));
    }
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    handleFilterChange({ ...currentFilters, page: newPage });
  };

  const handleSelectStudent = (studentId: number) => {
    navigate(`${roleBaseUrl}/classes/${numericClassId}/grades/students/${studentId}`);
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Page Header */}
        <PageHeader
          title={`Bảng điểm lớp ${gradebook?.classCode || ''}`}
          subtitle={
            gradebook
              ? `Khóa học: ${gradebook.courseName || '—'}${
                  gradebook.teacherName ? ` • Giáo viên: ${gradebook.teacherName}` : ''
                }`
              : 'Xem và quản lý bảng điểm học viên của lớp học'
          }
          breadcrumbs={[
            { label: 'Quản lý bảng điểm', path: `${roleBaseUrl}/grades` },
            { label: gradebook?.classCode ? `Lớp ${gradebook.classCode}` : `Lớp #${classId}` }
          ]}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {gradebook?.classStatus && (
                <ClassStatusBadge status={gradebook.classStatus} />
              )}
              <Link
                to={`${roleBaseUrl}/grades`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text-secondary, #475569)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))',
                  transition: 'all 0.15s ease'
                }}
              >
                ← Danh sách lớp
              </Link>
            </div>
          }
        />

        {/* Error message */}
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
              onClick={() => fetchGradebook(currentFilters)}
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

        {/* Filters */}
        <GradeRosterFilters
          filters={currentFilters}
          onChange={handleFilterChange}
          disabled={isLoading && !gradebook}
        />

        {/* Loading state */}
        {isLoading && !gradebook && (
          <LoadingState message="Đang tải bảng điểm lớp học..." />
        )}

        {/* Roster Table */}
        {gradebook && (
          <GradeRosterTable
            roster={gradebook.roster}
            onSelectStudent={handleSelectStudent}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        )}
      </div>
    </AppShell>
  );
};
