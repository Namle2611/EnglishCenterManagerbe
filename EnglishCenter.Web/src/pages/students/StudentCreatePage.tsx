import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { StudentForm } from '../../components/students/StudentForm';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/student.service';
import type { CreateStudentPayload } from '../../types/student.types';
import { getRoleHomeRoute } from '../../utils/roleHelper';
import { getApiErrorMessage, getStudentBasePath } from '../../utils/studentHelper';

export const StudentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const basePath = getStudentBasePath(location.pathname, user?.roles);
  const homeRoute = user ? getRoleHomeRoute(user.roles) : '/login';

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (payload: unknown) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await studentService.createStudent(payload as CreateStudentPayload);

      if (response.success && response.data) {
        navigate(`${basePath}/${response.data.id}`, {
          state: { successMessage: `Tạo mới học viên ${response.data.fullName} thành công.` }
        });
      } else {
        const errorMsg = response.message || 'Không thể tạo mới học viên.';
        setServerError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: unknown) {
      setServerError(getApiErrorMessage(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Thêm mới học viên"
        subtitle="Tạo tài khoản và hồ sơ học viên mới trong trung tâm."
        breadcrumbs={[
          { label: 'Trang chủ', path: homeRoute },
          { label: 'Quản lý học viên', path: basePath },
          { label: 'Thêm mới' }
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate(basePath)}
            style={backButtonStyle}
            title="Quay lại danh sách học viên"
          >
            &larr; Quay lại danh sách
          </button>
        }
      />

      <div style={{ maxWidth: '900px' }}>
        <StudentForm
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
