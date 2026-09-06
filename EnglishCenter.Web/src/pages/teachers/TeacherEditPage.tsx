import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/common/LoadingState';
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
      <div style={pageContainerStyle}>
        <LoadingState message="Đang tải dữ liệu giáo viên..." />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div style={pageContainerStyle}>
        <div style={notFoundCardStyle}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
            Không tìm thấy giáo viên
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Hồ sơ giáo viên không tồn tại hoặc đã bị xóa khỏi hệ thống. (404 Not Found)
          </p>
          <div style={{ marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => navigate(basePath)}
              style={backToTableBtnStyle}
            >
              &larr; Quay lại danh sách giáo viên
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>
            Chỉnh sửa giáo viên: {teacher?.fullName}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Cập nhật thông tin cá nhân và chuyên môn của giáo viên ({teacher?.teacherCode}).
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/${teacher?.id}`)}
          style={backButtonStyle}
          title="Hủy và quay lại trang chi tiết"
        >
          &larr; Quay lại chi tiết
        </button>
      </div>

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
  borderRadius: '8px',
  padding: '3rem 1.5rem',
  textAlign: 'center',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
};

const backToTableBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1.25rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};
