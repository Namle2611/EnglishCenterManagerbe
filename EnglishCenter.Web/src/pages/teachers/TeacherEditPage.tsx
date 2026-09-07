import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/common/LoadingState';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { TeacherForm } from '../../components/teachers/TeacherForm';
import { teacherService } from '../../services/teacher.service';
import type { TeacherDetail, UpdateTeacherPayload } from '../../types/teacher.types';
import { getTeacherApiErrorMessage } from '../../utils/teacherHelper';

export const TeacherEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const basePath = '/admin/teachers';

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  useEffect(() => {
    const teacherId = parseInt(id || '', 10);
    if (isNaN(teacherId) || teacherId <= 0) {
      setIsNotFound(true);
      setIsLoadingDetail(false);
      return;
    }

    const fetchTeacher = async () => {
      setIsLoadingDetail(true);
      setServerError(null);
      setIsNotFound(false);

      try {
        const response = await teacherService.getTeacherById(teacherId);
        if (response.success && response.data) {
          setTeacher(response.data);
        } else {
          setServerError(response.message || 'Không thể tải dữ liệu giáo viên.');
        }
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          setIsNotFound(true);
        } else {
          setServerError(getTeacherApiErrorMessage(err));
        }
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchTeacher();
  }, [id]);

  const handleSubmit = async (payload: unknown) => {
    if (!teacher) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await teacherService.updateTeacher(
        teacher.id,
        payload as UpdateTeacherPayload
      );

      if (response.success && response.data) {
        navigate(`${basePath}/${teacher.id}`, {
          state: { successMessage: 'Cập nhật thông tin giáo viên thành công.' }
        });
      } else {
        setServerError(response.message || 'Không thể cập nhật giáo viên.');
      }
    } catch (err: unknown) {
      setServerError(getTeacherApiErrorMessage(err));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDetail) {
    return (
      <AppShell>
        <LoadingState message="Đang tải dữ liệu giáo viên..." />
      </AppShell>
    );
  }

  if (isNotFound) {
    return (
      <AppShell>
        <div style={notFoundCardStyle}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
            Không tìm thấy giáo viên
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Hồ sơ giáo viên không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <button
            type="button"
            onClick={() => navigate(basePath)}
            style={primaryButtonStyle}
          >
            &larr; Quay lại danh sách giáo viên
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={`Chỉnh sửa: ${teacher?.fullName}`}
        subtitle={`Cập nhật thông tin chuyên môn của giáo viên (${teacher?.teacherCode}).`}
        breadcrumbs={[
          { label: 'Trang chủ', path: '/admin' },
          { label: 'Quản lý giáo viên', path: basePath },
          { label: teacher?.fullName || 'Chi tiết', path: `${basePath}/${teacher?.id}` },
          { label: 'Chỉnh sửa' }
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate(`${basePath}/${teacher?.id}`)}
            style={backButtonStyle}
            title="Hủy và quay lại trang chi tiết"
          >
            &larr; Quay lại chi tiết
          </button>
        }
      />

      <div style={{ maxWidth: '900px' }}>
        {teacher && (
          <TeacherForm
            mode="edit"
            initialValues={{
              teacherCode: teacher.teacherCode,
              email: teacher.email,
              fullName: teacher.fullName,
              phone: teacher.phone || '',
              avatarUrl: teacher.avatarUrl || '',
              specialization: teacher.specialization,
              qualification: teacher.qualification || '',
              experienceYears: teacher.experienceYears,
              hireDate: teacher.hireDate
            }}
            readOnlyData={{
              teacherCode: teacher.teacherCode,
              status: teacher.status
            }}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            serverError={serverError}
            onCancel={() => navigate(`${basePath}/${teacher.id}`)}
          />
        )}
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
