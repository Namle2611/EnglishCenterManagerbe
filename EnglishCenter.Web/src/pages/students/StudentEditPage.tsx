import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/common/LoadingState';
import { StudentForm } from '../../components/students/StudentForm';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/student.service';
import type { StudentDetail, UpdateStudentPayload } from '../../types/student.types';
import { getApiErrorMessage, getStudentBasePath } from '../../utils/studentHelper';

export const StudentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const basePath = getStudentBasePath(location.pathname, user?.roles);

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  useEffect(() => {
    const studentId = parseInt(id || '', 10);
    if (isNaN(studentId) || studentId <= 0) {
      setIsNotFound(true);
      setIsLoadingDetail(false);
      return;
    }

    const fetchStudent = async () => {
      setIsLoadingDetail(true);
      setServerError(null);
      setIsNotFound(false);

      try {
        const response = await studentService.getStudentById(studentId);
        if (response.success && response.data) {
          setStudent(response.data);
        } else {
          setServerError(response.message || 'Không thể tải dữ liệu học viên.');
        }
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          setIsNotFound(true);
        } else {
          setServerError(getApiErrorMessage(err));
        }
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleSubmit = async (payload: unknown) => {
    if (!student) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await studentService.updateStudent(
        student.id,
        payload as UpdateStudentPayload
      );

      if (response.success && response.data) {
        navigate(`${basePath}/${student.id}`, {
          state: { successMessage: 'Cập nhật thông tin học viên thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể cập nhật học viên.');
      }
    } catch (err: unknown) {
      setServerError(getApiErrorMessage(err));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDetail) {
    return (
      <div style={pageContainerStyle}>
        <LoadingState message="Đang tải dữ liệu học viên..." />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div style={pageContainerStyle}>
        <div style={notFoundCardStyle}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
            Không tìm thấy học viên
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Học viên với mã định danh #{id} không tồn tại hoặc đã bị xóa.
          </p>
          <button
            type="button"
            onClick={() => navigate(basePath)}
            style={primaryButtonStyle}
          >
            &larr; Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={pageContainerStyle}>
        <div style={errorCardStyle}>
          <p>
            <strong>Lỗi tải dữ liệu:</strong> {serverError}
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
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>
            Chỉnh sửa học viên: {student.fullName}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Cập nhật thông tin liên hệ và học tập của học viên.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/${student.id}`)}
          style={backButtonStyle}
          title="Hủy và quay lại chi tiết"
        >
          &larr; Quay lại hồ sơ
        </button>
      </div>

      <StudentForm
        mode="edit"
        initialValues={{
          email: student.email,
          fullName: student.fullName,
          phone: student.phone || '',
          avatarUrl: student.avatarUrl || '',
          dateOfBirth: student.dateOfBirth || '',
          gender: student.gender || '',
          address: student.address || '',
          currentLevel: student.currentLevel || ''
        }}
        readOnlyData={{
          studentCode: student.studentCode,
          enrollmentDate: student.enrollmentDate,
          status: student.status
        }}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        serverError={serverError}
        onCancel={() => navigate(`${basePath}/${student.id}`)}
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

const notFoundCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '3rem 1.5rem',
  borderRadius: '8px',
  textAlign: 'center',
  border: '1px dashed #cbd5e1'
};

const errorCardStyle: React.CSSProperties = {
  padding: '1.5rem',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  borderRadius: '8px',
  border: '1px solid #fecaca',
  textAlign: 'center'
};

const primaryButtonStyle: React.CSSProperties = {
  marginTop: '1rem',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};
