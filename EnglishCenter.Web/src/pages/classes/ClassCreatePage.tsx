import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClassForm } from '../../components/classes/ClassForm';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { classService } from '../../services/class.service';
import type { CreateClassPayload } from '../../types/class.types';
import { getClassApiErrorMessage, getClassBasePath } from '../../utils/classHelper';

export const ClassCreatePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getClassBasePath(location.pathname);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleCreate = async (payload: CreateClassPayload) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await classService.createClass(payload);
      if (response.success && response.data) {
        navigate(`${basePath}/${response.data.id}`, {
          replace: true,
          state: { flashMessage: 'Tạo lớp học thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể tạo lớp học.');
      }
    } catch (err: unknown) {
      setServerError(getClassApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          title="Thêm lớp học mới"
          subtitle="Nhập thông tin khóa học, giáo viên, thời gian và sĩ số để tạo lớp học mới"
          breadcrumbs={[
            { label: 'Quản lý lớp học', path: basePath },
            { label: 'Thêm mới' }
          ]}
        />

        <ClassForm
          mode="create"
          onSubmit={handleCreate}
          onCancel={() => navigate(basePath)}
          isSubmitting={isSubmitting}
          serverError={serverError}
        />
      </div>
    </AppShell>
  );
};
