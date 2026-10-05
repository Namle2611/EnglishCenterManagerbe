import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import type { GradeItemResponse, StudentClassGradeDetailResponse } from '../../types/grade.types';
import { gradeService } from '../../services/grade.service';
import { GradeSummaryCards } from '../../components/grades/GradeSummaryCards';
import { GradeItemList } from '../../components/grades/GradeItemList';
import { AssignmentGradeModal } from '../../components/grades/AssignmentGradeModal';
import { getMembershipStatusLabel } from '../../utils/gradeHelper';

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
    // Refresh authoritative backend data
    fetchDetail();
  };

  const backLink = isStudentRoute
    ? '/student/grades'
    : `${roleBaseUrl}/classes/${numericClassId}/grades`;

  const backLinkLabel = isStudentRoute
    ? '← Điểm của tôi'
    : '← Bảng điểm lớp';

  return (
    <div className="student-grade-detail-page" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
        <Link to={backLink} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
          {backLinkLabel}
        </Link>
        <span style={{ color: '#9ca3af' }}>/</span>
        <span style={{ color: '#4b5563' }}>Chi tiết điểm học viên</span>
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

      {/* Header Info */}
      {detail && (
        <>
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 'var(--radius-md, 8px)',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              marginBottom: '1.5rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <h1
                  style={{
                    margin: '0 0 0.35rem 0',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #111827)'
                  }}
                >
                  {detail.studentName} ({detail.studentCode})
                </h1>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #6b7280)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <span>Lớp: <strong>{detail.classCode}</strong></span>
                  <span>Khóa: <strong>{detail.courseName}</strong></span>
                  {detail.teacherName && (
                    <span>Giáo viên: <strong>{detail.teacherName}</strong></span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
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
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  {detail.classStatus}
                </span>
              </div>
            </div>
          </div>

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

      {isLoading && !detail && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Đang tải thông tin điểm...
        </div>
      )}
    </div>
  );
};
