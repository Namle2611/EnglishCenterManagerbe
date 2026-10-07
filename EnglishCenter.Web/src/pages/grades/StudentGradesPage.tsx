import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StudentGradeSummaryResponse } from '../../types/grade.types';
import { gradeService } from '../../services/grade.service';
import { formatPercentage, getMembershipStatusLabel } from '../../utils/gradeHelper';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentGradesPage: React.FC = () => {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<StudentGradeSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

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

  useEffect(() => {
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
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Page Header */}
        <PageHeader
          title="Điểm của tôi"
          subtitle="Tổng quan kết quả điểm theo từng lớp học mà bạn đang tham gia"
          breadcrumbs={[{ label: 'Điểm của tôi' }]}
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
              onClick={fetchMyGrades}
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

        {/* Loading State */}
        {isLoading && classes.length === 0 && (
          <LoadingState message="Đang tải thông tin điểm các lớp học..." />
        )}

        {/* Empty State */}
        {!isLoading && classes.length === 0 && (
          <EmptyState
            title="Chưa có bảng điểm"
            description="Bạn chưa tham gia lớp học nào hoặc chưa có bảng điểm được công bố."
          />
        )}

        {/* Classes Card Grid */}
        {classes.length > 0 && (
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
                    border: '1px solid var(--color-border, #e2e8f0)',
                    borderRadius: 'var(--radius-lg, 12px)',
                    boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))';
                    e.currentTarget.style.borderColor = 'var(--color-primary-border, #bfdbfe)';
                  }}
                  onMouseLeave={(e) => {
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
                        marginBottom: '0.5rem'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '1.1rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--color-primary, #2563eb)'
                        }}
                      >
                        {cls.classCode}
                      </span>
                      <span
                        style={{
                          padding: '0.2rem 0.625rem',
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
                        color: 'var(--color-text-primary, #0f172a)'
                      }}
                    >
                      {cls.courseName}
                    </h3>

                    {cls.teacherName && (
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--color-text-secondary, #475569)',
                          marginBottom: '0.75rem'
                        }}
                      >
                        Giáo viên: <strong>{cls.teacherName}</strong>
                      </div>
                    )}

                    {/* Summary preview */}
                    <div
                      style={{
                        backgroundColor: 'var(--color-surface-subtle, #f8fafc)',
                        padding: '0.875rem',
                        borderRadius: 'var(--radius-md, 8px)',
                        border: '1px solid var(--color-border-subtle, #f1f5f9)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.625rem',
                        fontSize: '0.8125rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--color-text-secondary, #64748b)' }}>Đã có điểm:</div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
                          {cls.summary.visibleGradedItemCount} mục
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-text-secondary, #64748b)' }}>Chờ xử lý:</div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: cls.summary.pendingItemCount > 0 ? '#d97706' : 'var(--color-text-primary, #0f172a)'
                          }}
                        >
                          {cls.summary.pendingItemCount} mục
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-text-secondary, #64748b)' }}>Điểm đạt được:</div>
                        <div style={{ fontWeight: 600, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                          {cls.summary.visibleEarnedPoints} / {cls.summary.visiblePossiblePoints}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-text-secondary, #64748b)' }}>Tỷ lệ điểm hiện có:</div>
                        <div style={{ fontWeight: 700, color: '#1d4ed8', fontVariantNumeric: 'tabular-nums' }}>
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
                      padding: '0.625rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      backgroundColor: 'var(--color-primary, #2563eb)',
                      border: 'none',
                      borderRadius: 'var(--radius-md, 8px)',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-hover, #1d4ed8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary, #2563eb)';
                    }}
                  >
                    Xem bảng điểm chi tiết →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};
