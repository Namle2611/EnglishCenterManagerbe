import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/common/LoadingState';
import { CourseForm } from '../../components/courses/CourseForm';
import { courseService } from '../../services/course.service';
import type { CourseDetail, UpdateCoursePayload } from '../../types/course.types';
import { getCourseApiErrorMessage, getCourseBasePath } from '../../utils/courseHelper';

export const CourseEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = getCourseBasePath(location.pathname);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

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

  const handleSubmit = async (payload: UpdateCoursePayload) => {
    if (!course) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await courseService.updateCourse(course.id, payload);
      if (response.success && response.data) {
        navigate(`${basePath}/${course.id}`, {
          state: { successMessage: 'Cập nhật khóa học thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể cập nhật khóa học. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      setServerError(getCourseApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (course) {
      navigate(`${basePath}/${course.id}`);
    } else {
      navigate(basePath);
    }
  };

  if (isLoading) {
    return (
      <div style={pageContainerStyle}>
        <LoadingState message="Đang tải dữ liệu khóa học..." />
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
            Khóa học với mã định danh #{id} không tồn tại để chỉnh sửa.
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
        <Link to={`${basePath}/${course.id}`} style={breadcrumbLinkStyle}>
          {course.courseCode}
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span style={{ color: '#64748b' }}>Chỉnh sửa</span>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={titleStyle}>Chỉnh sửa khóa học: {course.courseCode}</h1>
        <p style={subtitleStyle}>
          Cập nhật thông tin chi tiết của khóa học (Mã khóa học là trường bất biến không thể chỉnh sửa)
        </p>
      </div>

      {/* Form Card */}
      <CourseForm
        mode="edit"
        initialData={course}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        serverError={serverError}
      />
    </div>
  );
};

const pageContainerStyle: React.CSSProperties = {
  padding: '1.5rem 2rem',
  maxWidth: '900px',
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
