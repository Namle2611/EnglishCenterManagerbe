import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { GradeItemResponse, StudentClassGradeDetailResponse } from '../../types/grade.types';
import { gradeService } from '../../services/grade.service';
import { GradeSummaryCards } from '../../components/grades/GradeSummaryCards';
import { GradeItemList } from '../../components/grades/GradeItemList';
import { AssignmentGradeModal } from '../../components/grades/AssignmentGradeModal';
import { getMembershipStatusLabel } from '../../utils/gradeHelper';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { ClassStatusBadge } from '../../components/classes/ClassStatusBadge';

export const StudentGradeDetailPage: React.FC = () => {
  const { classId, studentId } = useParams<{ classId: string; studentId?: string }>();
  const location = useLocation();

  const isStudentRoute = location.pathname.startsWith('/student');
  const getRoleBaseUrl = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    if (location.pathname.startsWith('/student')) return '/student';
    return '/admin';
  };
  const roleBaseUrl = getRoleBaseUrl();

  const numericClassId = classId ? parseInt(classId, 10) : NaN;
  const numericStudentId = studentId ? parseInt(studentId, 10) : NaN;

  const [detail, setDetail] = useState<StudentClassGradeDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Grading modal state
  const [selectedItemToGrade, setSelectedItemToGrade] = useState<GradeItemResponse | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDetail = useCallback(async () => {
    if (Number.isNaN(numericClassId)) {
      setErrorMessage('Mã lớp học không hợp lệ.');
      setIsLoading(false);
      return;
    }

    if (!isStudentRoute && Number.isNaN(numericStudentId)) {
      setErrorMessage('Mã học viên không hợp lệ.');
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
      let res;
      if (isStudentRoute) {
        res = await gradeService.getMyClassGradeDetail(numericClassId, controller.signal);
      } else {
        res = await gradeService.getStudentClassGradeDetail(
          numericClassId,
          numericStudentId,
          controller.signal
        );
      }

      if (res.success && res.data) {
        setDetail(res.data);
      } else {
        setErrorMessage(res.message || 'Không thể tải chi tiết bảng điểm học viên.');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'CanceledError') {
        return;
      }
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosErr.response?.status === 403) {
          setErrorMessage('Bạn không có quyền truy cập bảng điểm này.');
        } else if (axiosErr.response?.status === 404) {
          setErrorMessage('Không tìm thấy thông tin điểm học viên.');
        } else {
          setErrorMessage(axiosErr.response?.data?.message || 'Lỗi khi tải bảng điểm.');
        }
      } else {
        setErrorMessage('Không thể kết nối tới máy chủ.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [numericClassId, numericStudentId, isStudentRoute]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchDetail();
    });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDetail]);

  const handleOpenGradeModal = (item: GradeItemResponse) => {
    setSelectedItemToGrade(item);
    setIsGradeModalOpen(true);
  };

  const handleCloseGradeModal = () => {
    setIsGradeModalOpen(false);
    setSelectedItemToGrade(null);
  };

  const handleGradedSuccess = () => {
    fetchDetail();
  };

  const backLink = isStudentRoute
    ? '/student/grades'
    : `${roleBaseUrl}/classes/${numericClassId}/grades`;

  const backLinkLabel = isStudentRoute
    ? '← Điểm của tôi'
    : '← Bảng điểm lớp';

  const breadcrumbs = isStudentRoute
    ? [
        { label: 'Điểm của tôi', path: '/student/grades' },
        { label: detail?.classCode ? `Lớp ${detail.classCode}` : 'Chi tiết điểm' }
      ]
    : [
        { label: 'Quản lý bảng điểm', path: `${roleBaseUrl}/grades` },
        {
          label: detail?.classCode ? `Lớp ${detail.classCode}` : `Lớp #${classId}`,
          path: `${roleBaseUrl}/classes/${classId}/grades`
        },
        { label: detail?.studentName || 'Chi tiết điểm' }
      ];

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Page Header */}
        <PageHeader
          title={
            detail
              ? `${detail.studentName} (${detail.studentCode})`
              : 'Chi tiết điểm học viên'
          }
          subtitle={
            detail
              ? `Lớp: ${detail.classCode} • Khóa học: ${detail.courseName}${
                  detail.teacherName ? ` • Giáo viên: ${detail.teacherName}` : ''
                }`
              : undefined
          }
          breadcrumbs={breadcrumbs}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {detail && (
                <>
                  <span
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      border: '1px solid #bfdbfe'
                    }}
                  >
                    {getMembershipStatusLabel(detail.membershipStatus)}
                  </span>
                  <ClassStatusBadge status={detail.classStatus} />
                </>
              )}
              <Link
                to={backLink}
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
                {backLinkLabel}
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
              onClick={fetchDetail}
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

        {/* Loading state */}
        {isLoading && !detail && (
          <LoadingState message="Đang tải chi tiết điểm học viên..." />
        )}

        {/* Details & Grade items */}
        {detail && (
          <>
            {/* Reporting Summary Cards */}
            <GradeSummaryCards
              summary={detail.summary}
              title="Tổng hợp kết quả học tập"
            />

            {/* Grade Items List */}
            <GradeItemList
              items={detail.items}
              userRole={isStudentRoute ? 'student' : roleBaseUrl.replace('/', '')}
              onGradeItem={handleOpenGradeModal}
              title="Chi tiết bài tập & bài kiểm tra"
            />

            {/* Modal for Management Direct Grading */}
            {!isStudentRoute && (
              <AssignmentGradeModal
                isOpen={isGradeModalOpen}
                item={selectedItemToGrade}
                studentName={detail.studentName}
                onClose={handleCloseGradeModal}
                onGradedSuccess={handleGradedSuccess}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
};
