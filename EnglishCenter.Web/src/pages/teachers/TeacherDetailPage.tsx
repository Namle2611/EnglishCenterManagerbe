import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/common/LoadingState';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { TeacherStatusBadge } from '../../components/teachers/TeacherStatusBadge';
import { TeacherStatusControl } from '../../components/teachers/TeacherStatusControl';
import { teacherService } from '../../services/teacher.service';
import type { TeacherDetail, TeacherStatus } from '../../types/teacher.types';
import {
  formatDateOnly,
  getTeacherApiErrorMessage
} from '../../utils/teacherHelper';

export const TeacherDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = '/admin/teachers';

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Success message passed via location.state (one-time display)
  const [successBanner, setSuccessBanner] = useState<string | null>(
    (location.state as { successMessage?: string })?.successMessage || null
  );

  useEffect(() => {
    if (successBanner) {
      window.history.replaceState({}, document.title);
    }
  }, [successBanner]);

  useEffect(() => {
    const teacherId = parseInt(id || '', 10);
    if (isNaN(teacherId) || teacherId <= 0) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setIsNotFound(false);

      try {
        const response = await teacherService.getTeacherById(teacherId);
        if (response.success && response.data) {
          setTeacher(response.data);
        } else {
          setErrorMessage(response.message || 'Không thể tải thông tin giáo viên.');
        }
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          setIsNotFound(true);
        } else {
          setErrorMessage(getTeacherApiErrorMessage(err));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleStatusChange = async (newStatus: TeacherStatus) => {
    if (!teacher) return;
    const response = await teacherService.updateTeacherStatus(teacher.id, newStatus);
    if (response.success && response.data) {
      setTeacher(response.data);
      setSuccessBanner(
        `Đã cập nhật trạng thái giáo viên thành: ${newStatus === 'Active' ? 'Đang hoạt động' : 'Không hoạt động'}`
      );
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState message="Đang tải thông tin chi tiết giáo viên..." />
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

  if (errorMessage || !teacher) {
    return (
      <AppShell>
        <div style={errorContainerStyle} role="alert">
          <p style={{ margin: '0 0 1rem 0', fontWeight: 500 }}>
            <strong>Lỗi tải dữ liệu:</strong> {errorMessage}
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
      {/* Success banner */}
      {successBanner && (
        <div style={successBannerStyle} role="status">
          <span>✓ {successBanner}</span>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            style={dismissButtonStyle}
            aria-label="Đóng thông báo"
          >
            &times;
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={`Giáo viên: ${teacher.fullName}`}
        subtitle={`Mã hồ sơ: ${teacher.teacherCode}`}
        breadcrumbs={[
          { label: 'Trang chủ', path: '/admin' },
          { label: 'Quản lý giáo viên', path: basePath },
          { label: teacher.fullName }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button
              type="button"
              onClick={() => navigate(basePath)}
              style={backButtonStyle}
              title="Quay lại danh sách"
            >
              &larr; Quay lại
            </button>
            <Link to={`${basePath}/${teacher.id}/edit`} style={editButtonStyle}>
              ✎ Chỉnh sửa hồ sơ
            </Link>
          </div>
        }
      />

      {/* Profile Overview Card */}
      <div style={cardStyle}>
        <div style={profileHeaderStyle}>
          {teacher.avatarUrl ? (
            <img
              src={teacher.avatarUrl}
              alt={teacher.fullName}
              style={avatarImageStyle}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={avatarFallbackStyle}>{getInitials(teacher.fullName)}</div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                {teacher.fullName}
              </h2>
              <TeacherStatusBadge status={teacher.status} />
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: teacher.isActive ? 'var(--status-active-bg)' : 'var(--status-danger-bg)',
                  color: teacher.isActive ? 'var(--status-active-text)' : 'var(--status-danger-text)',
                  border: `1px solid ${teacher.isActive ? 'var(--status-active-border)' : 'var(--status-danger-border)'}`
                }}
              >
                Tài khoản: {teacher.isActive ? 'Đang hoạt động' : 'Đã khóa'}
              </span>
            </div>

            <div style={overviewMetaStyle}>
              <div>
                <span style={metaLabelStyle}>Mã giáo viên:</span>{' '}
                <span className="font-mono" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                  {teacher.teacherCode}
                </span>
              </div>
              <div>
                <span style={metaLabelStyle}>Email:</span> {teacher.email}
              </div>
              <div>
                <span style={metaLabelStyle}>Số điện thoại:</span> {teacher.phone || '—'}
              </div>
              <div>
                <span style={metaLabelStyle}>Vai trò:</span> {teacher.roles.join(', ') || 'Giáo viên'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Info Grid */}
      <div style={detailsGridStyle}>
        {/* Professional details */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Chuyên môn & Bằng cấp giảng dạy</h3>
          <div style={infoListStyle}>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Chuyên môn đào tạo</span>
              <span style={infoValueStyle}>{teacher.specialization || '—'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Bằng cấp / Chứng chỉ</span>
              <span style={infoValueStyle}>{teacher.qualification || '—'}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Kinh nghiệm giảng dạy</span>
              <span style={infoValueStyle} className="tabular-nums">
                {teacher.experienceYears !== undefined && teacher.experienceYears !== null
                  ? `${teacher.experienceYears} năm`
                  : '—'}
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={infoLabelStyle}>Ngày vào làm</span>
              <span style={infoValueStyle}>{formatDateOnly(teacher.hireDate)}</span>
            </div>
          </div>
        </div>

        {/* Status Control Card */}
        <div>
          <TeacherStatusControl
            currentStatus={teacher.status}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </AppShell>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-sm)',
  padding: '1.75rem',
  marginBottom: '1.5rem'
};

const profileHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  flexWrap: 'wrap'
};

const avatarFallbackStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-primary-subtle)',
  color: 'var(--color-primary)',
  border: '2px solid var(--color-primary-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  fontWeight: 700
};

const avatarImageStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: 'var(--radius-full)',
  objectFit: 'cover',
  border: '2px solid var(--color-border)'
};

const overviewMetaStyle: React.CSSProperties = {
  marginTop: '0.75rem',
  display: 'flex',
  gap: '1.5rem',
  flexWrap: 'wrap',
  color: 'var(--color-text-secondary)',
  fontSize: '0.8125rem'
};

const metaLabelStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  marginRight: '0.25rem'
};

const detailsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.5rem'
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  margin: '0 0 1.25rem 0',
  borderBottom: '1px solid var(--color-border-subtle)',
  paddingBottom: '0.625rem'
};

const infoListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.875rem'
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid var(--color-border-subtle)'
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  fontWeight: 500
};

const infoValueStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-primary)',
  fontWeight: 600
};

const backButtonStyle: React.CSSProperties = {
  padding: '0.5rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer'
};

const editButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none'
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

const successBannerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 1rem',
  backgroundColor: 'var(--status-active-bg)',
  border: '1px solid var(--status-active-border)',
  color: 'var(--status-active-text)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: '1rem'
};

const dismissButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.25rem',
  color: 'var(--status-active-text)',
  cursor: 'pointer',
  padding: 0,
  lineHeight: 1
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

const errorContainerStyle: React.CSSProperties = {
  backgroundColor: 'var(--status-danger-bg)',
  border: '1px solid var(--status-danger-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem',
  color: 'var(--status-danger-text)',
  maxWidth: '600px',
  margin: '2rem auto',
  textAlign: 'center'
};
