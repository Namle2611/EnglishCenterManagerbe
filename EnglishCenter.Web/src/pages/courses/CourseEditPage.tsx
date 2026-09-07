import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/common/LoadingState';
import { CourseForm } from '../../components/courses/CourseForm';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
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
      <AppShell>
        <LoadingState message="Đang tải dữ liệu khóa học..." />
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
              fontSize: '0.875rem'
            }}
          >
            Khóa học với mã định danh #{id} không tồn tại để chỉnh sửa.
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
            { label: course.courseCode, path: `${basePath}/${course.id}` },
            { label: 'Chỉnh sửa' }
          ]}
          title={`Chỉnh sửa khóa học: ${course.courseCode}`}
          subtitle="Cập nhật thông tin chi tiết của khóa học (Mã khóa học là trường bất biến không thể chỉnh sửa)"
        />

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
    </AppShell>
  );
};

