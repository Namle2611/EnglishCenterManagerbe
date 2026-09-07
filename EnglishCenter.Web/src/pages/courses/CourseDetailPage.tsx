import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/common/LoadingState';
import { CourseStatusBadge } from '../../components/courses/CourseStatusBadge';
import { CourseStatusControl } from '../../components/courses/CourseStatusControl';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { courseService } from '../../services/course.service';
import type { CourseDetail, CourseStatus } from '../../types/course.types';
import {
  formatCurrency,
  formatDurationMonths,
  getCourseApiErrorMessage,
  getCourseBasePath
} from '../../utils/courseHelper';

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = getCourseBasePath(location.pathname);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Success message passed via location.state (one-time flash banner)
  const [successBanner, setSuccessBanner] = useState<string | null>(
    (location.state as { successMessage?: string })?.successMessage || null
  );

  useEffect(() => {
    if (successBanner) {
      window.history.replaceState({}, document.title);
    }
  }, [successBanner]);

  useEffect(() => {
    const courseId = parseInt(id || '', 10);
    if (isNaN(courseId) || courseId <= 0) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setIsNotFound(false);

      try {
        const response = await courseService.getCourseById(courseId);
        if (response.success && response.data) {
          setCourse(response.data);
        } else {
          setErrorMessage(response.message || 'Không thể tải thông tin khóa học.');
        }
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          setIsNotFound(true);
        } else {
          setErrorMessage(getCourseApiErrorMessage(err));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleStatusChange = async (newStatus: CourseStatus) => {
    if (!course) return;
    const response = await courseService.updateCourseStatus(course.id, newStatus);
    if (response.success && response.data) {
      // Direct update from backend response
      setCourse(response.data);
      setSuccessBanner(
        `Đã cập nhật trạng thái khóa học thành: ${newStatus === 'Active' ? 'Đang hoạt động' : 'Không hoạt động'}`
      );
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState message="Đang tải thông tin chi tiết khóa học..." />
      </AppShell>
    );
  }

  if (isNotFound) {
    return (
      <AppShell>
        <div
          style={{
            backgroundColor: 'var(--color-surface, #ffffff)',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--color-border, #e2e8f0)',
            padding: '3rem 2rem',
            textAlign: 'center',
            maxWidth: '520px',
            margin: '2rem auto',
            boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text, #0f172a)' }}>
            Không tìm thấy khóa học
          </h2>
          <p
            style={{
              color: 'var(--color-text-muted, #64748b)',
              margin: '0 0 1.5rem 0',
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}
          >
            Khóa học với mã định danh #{id} không tồn tại hoặc đã được chuyển trạng thái.
          </p>
          <button
            type="button"
            onClick={() => navigate(basePath)}
            style={{
              padding: '0.5625rem 1.25rem',
              backgroundColor: 'var(--color-primary, #1e40af)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Quay lại danh sách khóa học
          </button>
        </div>
      </AppShell>
    );
  }

  if (errorMessage || !course) {
    return (
      <AppShell>
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '520px',
            margin: '2rem auto'
          }}
        >
          <p style={{ margin: '0 0 1rem 0', fontWeight: 500, fontSize: '0.9375rem' }}>
            {errorMessage || 'Đã xảy ra lỗi khi tải thông tin khóa học.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5625rem 1.25rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Page Header with Breadcrumbs */}
        <PageHeader
          breadcrumbs={[
            { label: 'Danh sách khóa học', path: basePath },
            { label: course.courseName }
          ]}
          title={course.courseName}
          subtitle={`Mã khóa học: ${course.courseCode} | ID: #${course.id}`}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CourseStatusBadge status={course.status} />
              <Link
                to={`${basePath}/${course.id}/edit`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5625rem 1.125rem',
                  backgroundColor: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-primary, #1e40af)',
                  border: '1px solid var(--color-primary, #1e40af)',
                  borderRadius: 'var(--radius-md, 8px)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Chỉnh sửa
              </Link>
            </div>
          }
        />

        {/* Success Notification Banner */}
        {successBanner && (
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '0.875rem 1.125rem',
              fontSize: '0.875rem'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successBanner}</span>
          </div>
        )}

        {/* Main Grid: Details + Status Management */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            alignItems: 'start'
          }}
        >
          {/* Course Profile Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface, #ffffff)',
              borderRadius: 'var(--radius-lg, 12px)',
              border: '1px solid var(--color-border, #e2e8f0)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
            }}
          >
            <h3
              style={{
                margin: '0 0 1.25rem 0',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text, #0f172a)',
                borderBottom: '1px solid var(--color-border, #f1f5f9)',
                paddingBottom: '0.75rem'
              }}
            >
              Thông tin khóa học
            </h3>

            <div style={{ display: 'grid', gap: '0.875rem' }}>
              <div style={infoRowStyle}>
                <span style={labelStyle}>Mã khóa học:</span>
                <span
                  className="font-mono"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    backgroundColor: 'var(--color-surface-hover, #f1f5f9)',
                    color: 'var(--color-primary, #1e40af)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm, 4px)',
                    border: '1px solid var(--color-border, #e2e8f0)'
                  }}
                >
                  {course.courseCode}
                </span>
              </div>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Tên khóa học:</span>
                <span style={valueStyle}>{course.courseName}</span>
              </div>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Trình độ:</span>
                <span style={valueStyle}>
                  {course.level || (
                    <em style={{ color: 'var(--color-text-muted, #94a3b8)', fontStyle: 'italic' }}>
                      Chưa xác định
                    </em>
                  )}
                </span>
              </div>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Thời lượng:</span>
                <span
                  className="tabular-nums"
                  style={{ ...valueStyle, fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatDurationMonths(course.durationMonths)}
                </span>
              </div>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Học phí:</span>
                <span
                  className="tabular-nums"
                  style={{
                    ...valueStyle,
                    fontWeight: 700,
                    color: 'var(--color-text, #0f172a)',
                    fontSize: '1.0625rem',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {formatCurrency(course.tuitionFee)}
                </span>
              </div>

              <div style={infoRowStyle}>
                <span style={labelStyle}>Trạng thái:</span>
                <span>
                  <CourseStatusBadge status={course.status} />
                </span>
              </div>
            </div>

            {/* Description Section */}
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--color-border, #f1f5f9)'
              }}
            >
              <h4
                style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary, #334155)'
                }}
              >
                Mô tả chi tiết:
              </h4>
              <div
                style={{
                  backgroundColor: 'var(--color-surface-hover, #f8fafc)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--color-border, #e2e8f0)'
                }}
              >
                {course.description ? (
                  <p
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      fontSize: '0.875rem',
                      color: 'var(--color-text, #0f172a)'
                    }}
                  >
                    {course.description}
                  </p>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--color-text-muted, #94a3b8)',
                      fontStyle: 'italic',
                      fontSize: '0.875rem'
                    }}
                  >
                    Chưa có mô tả cho khóa học này.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status Control Card */}
          <div>
            <CourseStatusControl
              currentStatus={course.status}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '0.625rem',
  borderBottom: '1px dashed var(--color-border, #f1f5f9)'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary, #64748b)',
  fontWeight: 500
};

const valueStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text, #0f172a)',
  fontWeight: 600
};

