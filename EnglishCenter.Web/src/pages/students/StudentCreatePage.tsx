import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StudentForm } from '../../components/students/StudentForm';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/student.service';
import type { CreateStudentPayload } from '../../types/student.types';
import { getApiErrorMessage, getStudentBasePath } from '../../utils/studentHelper';

export const StudentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const basePath = getStudentBasePath(location.pathname, user?.roles);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (payload: unknown) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await studentService.createStudent(payload as CreateStudentPayload);

      if (response.success && response.data) {
        // Navigate to the newly created student's detail page with one-time success message
        navigate(`${basePath}/${response.data.id}`, {
          state: { successMessage: `Tạo mới học viên ${response.data.fullName} thành công.` }
        });
      } else {
        setServerError(response.message || 'Không thể tạo mới học viên.');
      }
    } catch (err: unknown) {
      setServerError(getApiErrorMessage(err));
      // Re-throw so form knows not to treat this as success
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={pageContainerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>Thêm mới học viên</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Tạo tài khoản và hồ sơ học viên mới trong trung tâm.
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

      <StudentForm
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
