import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/common/LoadingState';
import { CourseStatusBadge } from '../../components/courses/CourseStatusBadge';
import { CourseStatusControl } from '../../components/courses/CourseStatusControl';
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
      <div style={pageContainerStyle}>
        <LoadingState message="Đang tải thông tin chi tiết khóa học..." />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div style={pageContainerStyle}>
        <div style={notFoundCardStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔍</div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Không tìm thấy khóa học</h2>
          <p style={{ color: '#64748b', margin: '0 0 1.5rem 0' }}>
            Khóa học với mã định danh #{id} không tồn tại hoặc đã được chuyển trạng thái.
          </p>
          <button
            type="button"
            onClick={() => navigate(basePath)}
            style={primaryButtonStyle}
          >
            Quay lại danh sách khóa học
          </button>
        </div>
      </div>
    );
  }

  if (errorMessage || !course) {
    return (
      <div style={pageContainerStyle}>
        <div style={errorCardStyle}>
          <p style={{ margin: '0 0 1rem 0', fontWeight: 500 }}>
            {errorMessage || 'Đã xảy ra lỗi khi tải thông tin khóa học.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={primaryButtonStyle}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      {/* Navigation Breadcrumb */}
      <div style={breadcrumbStyle}>
        <Link to={basePath} style={breadcrumbLinkStyle}>
          ← Danh sách khóa học
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span style={{ color: '#64748b' }}>Chi tiết khóa học</span>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div style={successBannerStyle} role="status">
          <span>✓</span>
          <span>{successBanner}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={headerStyle}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={titleStyle}>{course.courseName}</h1>
            <CourseStatusBadge status={course.status} />
          </div>
          <p style={subtitleStyle}>
            Mã khóa học: <strong>{course.courseCode}</strong> | ID: #{course.id}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`${basePath}/${course.id}/edit`} style={editButtonStyle}>
            ✏️ Chỉnh sửa
          </Link>
        </div>
      </div>

      {/* Main Grid: Details + Status Management */}
      <div style={detailGridStyle}>
        {/* Course Profile Card */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Thông tin khóa học</h3>
          <div style={infoGridStyle}>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Mã khóa học:</span>
              <span style={valueStyle}>{course.courseCode}</span>
            </div>

            <div style={infoRowStyle}>
              <span style={labelStyle}>Tên khóa học:</span>
              <span style={valueStyle}>{course.courseName}</span>
            </div>

            <div style={infoRowStyle}>
              <span style={labelStyle}>Trình độ:</span>
              <span style={valueStyle}>
                {course.level || <em style={{ color: '#94a3b8' }}>Chưa xác định</em>}
              </span>
            </div>

            <div style={infoRowStyle}>
              <span style={labelStyle}>Thời lượng:</span>
              <span style={valueStyle}>{formatDurationMonths(course.durationMonths)}</span>
            </div>

            <div style={infoRowStyle}>
              <span style={labelStyle}>Học phí:</span>
              <span style={{ ...valueStyle, fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>
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
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#334155' }}>
              Mô tả chi tiết:
            </h4>
            <div style={descriptionBoxStyle}>
              {course.description ? (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#334155' }}>
                  {course.description}
                </p>
              ) : (
                <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic' }}>
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
  );
};

const pageContainerStyle: React.CSSProperties = {
  padding: '1.5rem 2rem',
  maxWidth: '1000px',
  margin: '0 auto',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
};

const breadcrumbStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.85rem',
  marginBottom: '1rem'
};

const breadcrumbLinkStyle: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
  gap: '1rem'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#0f172a'
};

const subtitleStyle: React.CSSProperties = {
  margin: '0.25rem 0 0 0',
  fontSize: '0.875rem',
  color: '#64748b'
};

const editButtonStyle: React.CSSProperties = {
  padding: '0.55rem 1.1rem',
  backgroundColor: '#ffffff',
  color: '#2563eb',
  border: '1px solid #2563eb',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.875rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem'
};

const detailGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.5rem'
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
};

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 1.25rem 0',
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#1e293b',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '0.75rem'
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: '0.875rem'
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '0.5rem',
  borderBottom: '1px dashed #f1f5f9'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#64748b',
  fontWeight: 500
};

const valueStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#1e293b',
  fontWeight: 600
};

const descriptionBoxStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  padding: '1rem',
  borderRadius: '6px',
  border: '1px solid #e2e8f0'
};

const successBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  backgroundColor: '#ecfdf5',
  color: '#065f46',
  border: '1px solid #a7f3d0',
  borderRadius: '6px',
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  marginBottom: '1.25rem'
};

const notFoundCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  padding: '3rem 2rem',
  textAlign: 'center',
  maxWidth: '500px',
  margin: '2rem auto'
};

const errorCardStyle: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: '8px',
  padding: '2rem',
  textAlign: 'center',
  maxWidth: '500px',
  margin: '2rem auto'
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.55rem 1.25rem',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer'
};
