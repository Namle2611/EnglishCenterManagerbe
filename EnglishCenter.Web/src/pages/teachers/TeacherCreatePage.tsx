import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        // Navigate to the newly created teacher's detail page with one-time success message
        navigate(`${basePath}/${response.data.id}`, {
          state: { successMessage: `Tạo mới giáo viên ${response.data.fullName} thành công.` }
        });
      } else {
        setServerError(response.message || 'Không thể tạo mới giáo viên.');
      }
    } catch (err: unknown) {
      setServerError(getTeacherApiErrorMessage(err));
      // Re-throw so form knows not to clear state on failure
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={pageContainerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>Thêm mới giáo viên</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Tạo tài khoản và hồ sơ giáo viên mới trong trung tâm.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(basePath)}
          style={backButtonStyle}
          title="Quay lại danh sách"
        >
          &larr; Quay lại danh sách
        </button>
      </div>

      <TeacherForm
        mode="create"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        serverError={serverError}
        onCancel={() => navigate(basePath)}
      />
    </div>
  );
};

const pageContainerStyle: React.CSSProperties = {
  maxWidth: '860px',
  margin: '0 auto',
  padding: '1.5rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem'
};

const backButtonStyle: React.CSSProperties = {
  padding: '0.45rem 0.85rem',
  fontSize: '0.85rem',
  fontWeight: 500,
  backgroundColor: '#f1f5f9',
  color: '#475569',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  cursor: 'pointer'
};
