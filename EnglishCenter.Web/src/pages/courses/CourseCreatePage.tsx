import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CourseForm } from '../../components/courses/CourseForm';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
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
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Page Header with Breadcrumbs */}
        <PageHeader
          breadcrumbs={[
            { label: 'Danh sách khóa học', path: basePath },
            { label: 'Thêm khóa học mới' }
          ]}
          title="Thêm khóa học mới"
          subtitle="Điền thông tin để tạo khóa học mới trên hệ thống trung tâm Anh ngữ"
        />

        {/* Form Card */}
        <CourseForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          serverError={serverError}
        />
      </div>
    </AppShell>
  );
};

