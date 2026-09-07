import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/common/LoadingState';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { StudentForm } from '../../components/students/StudentForm';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/student.service';
import type { StudentDetail, UpdateStudentPayload } from '../../types/student.types';
import { getRoleHomeRoute } from '../../utils/roleHelper';
import { getApiErrorMessage, getStudentBasePath } from '../../utils/studentHelper';

export const StudentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const basePath = getStudentBasePath(location.pathname, user?.roles);
  const homeRoute = user ? getRoleHomeRoute(user.roles) : '/login';

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
      <AppShell>
        <LoadingState message="Đang tải dữ liệu học viên..." />
      </AppShell>
    );
  }

  if (isNotFound) {
    return (
      <AppShell>
        <div style={notFoundCardStyle}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
            Không tìm thấy học viên
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Học viên với mã định danh #{id} không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <button
            type="button"
            onClick={() => navigate(basePath)}
            style={primaryButtonStyle}
          >
            &larr; Quay lại danh sách
          </button>
        </div>
      </AppShell>
    );
  }

  if (!student) {
    return (
      <AppShell>
        <div style={errorCardStyle}>
          <p style={{ margin: '0 0 1rem 0', fontWeight: 500 }}>
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
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={`Chỉnh sửa: ${student.fullName}`}
        subtitle="Cập nhật thông tin liên hệ và học vụ của học viên."
        breadcrumbs={[
          { label: 'Trang chủ', path: homeRoute },
          { label: 'Quản lý học viên', path: basePath },
          { label: student.fullName, path: `${basePath}/${student.id}` },
          { label: 'Chỉnh sửa' }
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate(`${basePath}/${student.id}`)}
            style={backButtonStyle}
            title="Hủy và quay lại hồ sơ chi tiết"
          >
            &larr; Quay lại hồ sơ
          </button>
        }
      />

      <div style={{ maxWidth: '900px' }}>
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

const notFoundCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  padding: '2.5rem 2rem',
  textAlign: 'center',
  maxWidth: '480px',
  margin: '2rem auto'
};

const errorCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--status-danger-bg)',
  border: '1px solid var(--status-danger-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem',
  color: 'var(--status-danger-text)',
  maxWidth: '600px',
  margin: '2rem auto',
  textAlign: 'center'
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
};
