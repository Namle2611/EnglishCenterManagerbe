import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StudentGradeSummaryResponse } from '../../types/grade.types';
import { gradeService } from '../../services/grade.service';
import { formatPercentage, getMembershipStatusLabel } from '../../utils/gradeHelper';

export const StudentGradesPage: React.FC = () => {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<StudentGradeSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchMyGrades = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await gradeService.getMyGrades(controller.signal);
        if (res.success && res.data) {
          setClasses(res.data);
        } else {
          setErrorMessage(res.message || 'Không thể tải danh sách điểm cá nhân.');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'CanceledError') {
          return;
        }
        setErrorMessage('Lỗi khi tải thông tin bảng điểm.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyGrades();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleViewClassGradeDetail = (classId: number) => {
    navigate(`/student/grades/${classId}`);
  };

  return (
    <div className="student-grades-page" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.65rem',
            fontWeight: 700,
            color: 'var(--color-text-primary, #111827)'
          }}
        >
          Điểm của tôi
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary, #6b7280)', fontSize: '0.9rem' }}>
          Tổng quan kết quả điểm theo từng lớp học mà bạn đang tham gia.
        </p>
      </div>

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
          Đang tải thông tin điểm các lớp học...
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
          Bạn chưa tham gia lớp học nào hoặc chưa có bảng điểm.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {classes.map((cls) => {
            return (
              <div
                key={cls.classId}
                data-testid={`student-grade-class-card-${cls.classId}`}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: 'var(--radius-md, 8px)',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
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
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        border: '1px solid #bfdbfe'
                      }}
                    >
                      {getMembershipStatusLabel(cls.membershipStatus)}
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary, #111827)'
                    }}
                  >
                    {cls.courseName}
                  </h3>

                  {cls.teacherName && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #6b7280)', marginBottom: '0.75rem' }}>
                      Giáo viên: <strong>{cls.teacherName}</strong>
                    </div>
                  )}

                  {/* Summary preview */}
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface-subtle, #f9fafb)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm, 6px)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ color: '#6b7280' }}>Đã có điểm:</div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>
                        {cls.summary.visibleGradedItemCount} mục
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280' }}>Chờ xử lý:</div>
                      <div style={{ fontWeight: 600, color: cls.summary.pendingItemCount > 0 ? '#d97706' : '#111827' }}>
                        {cls.summary.pendingItemCount} mục
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280' }}>Điểm đạt được:</div>
                      <div style={{ fontWeight: 600, color: '#059669' }}>
                        {cls.summary.visibleEarnedPoints} / {cls.summary.visiblePossiblePoints}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280' }}>Tỷ lệ điểm hiện có:</div>
                      <div style={{ fontWeight: 700, color: '#1d4ed8' }}>
                        {formatPercentage(cls.summary.visiblePercentage)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Detail Action */}
                <button
                  type="button"
                  id={`btn-view-class-grades-${cls.classId}`}
                  onClick={() => handleViewClassGradeDetail(cls.classId)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    borderRadius: 'var(--radius-md, 6px)',
                    cursor: 'pointer',
                    minHeight: '40px'
                  }}
                >
                  Xem bảng điểm chi tiết
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
