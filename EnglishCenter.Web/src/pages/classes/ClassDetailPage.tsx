import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ClassStatusBadge } from '../../components/classes/ClassStatusBadge';
import { ClassStatusControl } from '../../components/classes/ClassStatusControl';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { classService } from '../../services/class.service';
import type { ClassDetail, ClassStatus } from '../../types/class.types';
import {
  formatClassDateTime,
  getClassApiErrorMessage,
  getClassBasePath
} from '../../utils/classHelper';

export const ClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getClassBasePath(location.pathname);

  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(
    (location.state as { flashMessage?: string } | null)?.flashMessage || null
  );

  const classId = parseInt(id || '', 10);

  const fetchDetail = useCallback(async () => {
    if (isNaN(classId) || classId <= 0) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);

    try {
      const response = await classService.getClassById(classId);
      if (response.success && response.data) {
        setClassDetail(response.data);
      } else {
        setErrorMessage(response.message || 'Không thể tải thông tin chi tiết lớp học.');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setIsNotFound(true);
      } else {
        setErrorMessage(getClassApiErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleStatusChange = async (newStatus: ClassStatus) => {
    if (!classDetail) return;
    const response = await classService.updateClassStatus(classDetail.id, newStatus);
    if (response.success && response.data) {
      setClassDetail(response.data);
      setSuccessToast(`Đã chuyển trạng thái lớp học sang "${newStatus}".`);
    }
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Page Header */}
        <PageHeader
          title={classDetail ? `Lớp học: ${classDetail.classCode}` : 'Chi tiết lớp học'}
          subtitle="Xem thông tin chi tiết, lịch trình và trạng thái lớp học"
          breadcrumbs={[
            { label: 'Quản lý lớp học', path: basePath },
            { label: classDetail ? classDetail.classCode : 'Chi tiết' }
          ]}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                to={basePath}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  borderRadius: 'var(--radius-md, 8px)',
                  color: 'var(--color-text-secondary, #475569)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none'
                }}
              >
                &larr; Quay lại danh sách
              </Link>
              {classDetail && (
                <Link
                  to={`${basePath}/${classDetail.id}/edit`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--color-primary, #1e40af)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  ✏️ Chỉnh sửa
                </Link>
              )}
            </div>
          }
        />

        {/* Success Toast */}
        {successToast && (
          <div
            style={{
              padding: '0.875rem 1.25rem',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✅</span>
              <span>{successToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#065f46',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <LoadingState message="Đang tải thông tin lớp học..." />}

        {/* 404 Not Found State */}
        {isNotFound && !isLoading && (
          <EmptyState
            title="Không tìm thấy lớp học"
            description="Lớp học bạn đang tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ thống."
            actionText="Quay lại danh sách lớp học"
            onAction={() => navigate(basePath)}
          />
        )}

        {/* General Error State */}
        {errorMessage && !isNotFound && (
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
            <span>⚠️ {errorMessage}</span>
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

        {/* Detail Content */}
        {classDetail && !isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Main Info Card */}
            <div
              style={{
                backgroundColor: 'var(--color-surface, #ffffff)',
                borderRadius: 'var(--radius-xl, 16px)',
                border: '1px solid var(--color-border, #e2e8f0)',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--color-border, #f1f5f9)',
                  paddingBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: 'var(--color-primary, #1e40af)',
                      backgroundColor: 'var(--color-primary-subtle, #eff6ff)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm, 4px)',
                      marginBottom: '0.375rem'
                    }}
                  >
                    {classDetail.classCode}
                  </span>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: 'var(--color-text-primary, #0f172a)'
                    }}
                  >
                    {classDetail.courseName}
                  </h2>
                </div>

                <div>
                  <ClassStatusBadge status={classDetail.status} />
                </div>
              </div>

              {/* Grid of Key Properties */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.5rem'
                }}
              >
                {/* Course Info */}
                <div>
                  <span style={labelStyle}>Khóa học</span>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
                      {classDetail.courseName}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-muted, #64748b)',
                        fontFamily: 'monospace'
                      }}
                    >
                      Mã khóa học: {classDetail.courseCode} (ID: #{classDetail.courseId})
                    </span>
                  </div>
                </div>

                {/* Teacher Info */}
                <div>
                  <span style={labelStyle}>Giáo viên phụ trách</span>
                  <div style={{ marginTop: '0.25rem' }}>
                    {classDetail.teacherName ? (
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #0f172a)' }}>
                          {classDetail.teacherName}
                        </span>
                        {classDetail.teacherCode && (
                          <span
                            style={{
                              display: 'block',
                              fontSize: '0.8125rem',
                              color: 'var(--color-text-muted, #64748b)',
                              fontFamily: 'monospace'
                            }}
                          >
                            Mã giáo viên: {classDetail.teacherCode}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span
                        style={{
                          fontStyle: 'italic',
                          color: 'var(--color-text-muted, #94a3b8)',
                          fontSize: '0.875rem'
                        }}
                      >
                        Chưa phân công giáo viên
                      </span>
                    )}
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <span style={labelStyle}>Thời gian bắt đầu</span>
                  <div
                    style={{
                      marginTop: '0.25rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary, #0f172a)'
                    }}
                  >
                    {formatClassDateTime(classDetail.startDate)}
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <span style={labelStyle}>Thời gian kết thúc</span>
                  <div
                    style={{
                      marginTop: '0.25rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary, #0f172a)'
                    }}
                  >
                    {formatClassDateTime(classDetail.endDate)}
                  </div>
                </div>

                {/* Max Students */}
                <div>
                  <span style={labelStyle}>Sĩ số tối đa</span>
                  <div
                    style={{
                      marginTop: '0.25rem',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: 'var(--color-text-primary, #0f172a)'
                    }}
                  >
                    {classDetail.maxStudents} học viên
                  </div>
                </div>
              </div>
            </div>

            {/* Status Control Card */}
            <div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary, #0f172a)',
                  marginBottom: '0.75rem'
                }}
              >
                Quản lý trạng thái lớp học
              </h3>
              <ClassStatusControl
                currentStatus={classDetail.status}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted, #64748b)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};
