import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { ClassGradebookResponse, GradeQueryParams } from '../../types/grade.types';
import { gradeService } from '../../services/grade.service';
import { GradeRosterFilters } from '../../components/grades/GradeRosterFilters';
import { GradeRosterTable } from '../../components/grades/GradeRosterTable';
import type { ClassStudentStatus } from '../../types/assignment.types';

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
    <div className="class-gradebook-page" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
        <Link
          to={`${roleBaseUrl}/grades`}
          style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
        >
          ← Danh sách lớp
        </Link>
        <span style={{ color: '#9ca3af' }}>/</span>
        <span style={{ color: '#4b5563' }}>Bảng điểm lớp</span>
      </div>

      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--color-border, #e5e7eb)'
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 0.35rem 0',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--color-text-primary, #111827)'
            }}
          >
            Bảng điểm lớp {gradebook?.classCode || ''}
          </h1>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #6b7280)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {gradebook?.courseName && (
              <span>Khóa học: <strong>{gradebook.courseName}</strong></span>
            )}
            {gradebook?.teacherName && (
              <span>Giáo viên: <strong>{gradebook.teacherName}</strong></span>
            )}
          </div>
        </div>

        {gradebook?.classStatus && (
          <span
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor:
                gradebook.classStatus === 'Ongoing'
                  ? '#ecfdf5'
                  : gradebook.classStatus === 'Planned'
                  ? '#eff6ff'
                  : '#f3f4f6',
              color:
                gradebook.classStatus === 'Ongoing'
                  ? '#065f46'
                  : gradebook.classStatus === 'Planned'
                  ? '#1e40af'
                  : '#374151',
              border: '1px solid rgba(0,0,0,0.08)'
            }}
          >
            {gradebook.classStatus}
          </span>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md, 8px)',
            color: '#b91c1c'
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Filters */}
      <GradeRosterFilters
        filters={currentFilters}
        onChange={handleFilterChange}
        disabled={isLoading && !gradebook}
      />

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
  );
};
