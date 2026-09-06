import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CourseForm } from '../../components/courses/CourseForm';
import { courseService } from '../../services/course.service';
import type { CreateCoursePayload } from '../../types/course.types';
import { getCourseApiErrorMessage, getCourseBasePath } from '../../utils/courseHelper';

export const CourseCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = getCourseBasePath(location.pathname);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (payload: CreateCoursePayload) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await courseService.createCourse(payload);
      if (response.success && response.data) {
        navigate(`${basePath}/${response.data.id}`, {
          state: { successMessage: 'Tạo khóa học thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể tạo khóa học. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      setServerError(getCourseApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(basePath);
  };

  return (
    <div style={pageContainerStyle}>
      {/* Navigation Breadcrumb */}
      <div style={breadcrumbStyle}>
        <Link to={basePath} style={breadcrumbLinkStyle}>
          ← Danh sách khóa học
        </Link>
        <span style={{ color: '#cbd5e1' }}>/</span>
        <span style={{ color: '#64748b' }}>Thêm khóa học mới</span>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={titleStyle}>Thêm khóa học mới</h1>
        <p style={subtitleStyle}>
          Điền thông tin để tạo khóa học mới trên hệ thống trung tâm Anh ngữ
        </p>
      </div>

      {/* Form Card */}
      <CourseForm
        mode="create"
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
