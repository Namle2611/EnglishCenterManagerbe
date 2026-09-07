import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { TeacherForm } from '../../components/teachers/TeacherForm';
import { teacherService } from '../../services/teacher.service';
import type { CreateTeacherPayload } from '../../types/teacher.types';
import { getTeacherApiErrorMessage } from '../../utils/teacherHelper';

export const TeacherCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const basePath = '/admin/teachers';

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (payload: unknown) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await teacherService.createTeacher(payload as CreateTeacherPayload);

      if (response.success && response.data) {
        navigate(`${basePath}/${response.data.id}`, {
          state: { successMessage: `Tạo mới giáo viên ${response.data.fullName} thành công.` }
        });
      } else {
        const errorMsg = response.message || 'Không thể tạo mới giáo viên.';
        setServerError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: unknown) {
      setServerError(getTeacherApiErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Thêm mới giáo viên"
        subtitle="Tạo tài khoản và hồ sơ giáo viên mới trong trung tâm."
        breadcrumbs={[
          { label: 'Trang chủ', path: '/admin' },
          { label: 'Quản lý giáo viên', path: basePath },
          { label: 'Thêm mới' }
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate(basePath)}
            style={backButtonStyle}
            title="Quay lại danh sách giáo viên"
          >
            &larr; Quay lại danh sách
          </button>
        }
      />

      <div style={{ maxWidth: '900px' }}>
        <TeacherForm
          mode="create"
          onSubmit={handleSubmit}
          isLoading={isLoading}
          serverError={serverError}
          onCancel={() => navigate(basePath)}
        />
      </div>
    </AppShell>
  );
};

const backButtonStyle: React.CSSProperties = {
  padding: '0.45rem 0.85rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
};
