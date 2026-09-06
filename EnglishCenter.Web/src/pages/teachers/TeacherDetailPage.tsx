import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/common/LoadingState';
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

  // Clear location.state so refresh doesn't keep displaying stale success notification
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
      // Direct update from backend source of truth
      setTeacher(response.data);
      setSuccessBanner(`Đã cập nhật trạng thái giáo viên thành: ${newStatus === 'Active' ? 'Đang hoạt động' : 'Không hoạt động'}`);
    }
  };

  if (isLoading) {
    return (
      <div style={pageContainerStyle}>
        <LoadingState message="Đang tải thông tin chi tiết giáo viên..." />
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

  if (errorMessage || !teacher) {
    return (
      <div style={pageContainerStyle}>
        <div style={notFoundCardStyle}>
          <p style={{ color: '#b91c1c', margin: '0 0 1rem 0' }}>
            {errorMessage || 'Không thể tải thông tin giáo viên.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={retryButtonStyle}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Generate initials for avatar fallback
  const initials = teacher.fullName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div style={pageContainerStyle}>
      {/* Top Header & Navigation */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate(basePath)}
            style={backButtonStyle}
            title="Quay lại danh sách"
          >
            &larr; Danh sách
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>
              {teacher.fullName} ({teacher.teacherCode})
            </h1>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Mã hồ sơ: #{teacher.id} &bull; Chuyên môn: {teacher.specialization}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`${basePath}/${teacher.id}/edit`}
            style={editButtonStyle}
            title="Chỉnh sửa thông tin giáo viên"
          >
            ✏ Chỉnh sửa thông tin
          </Link>
        </div>
      </div>

      {/* Flash Success Notification */}
      {successBanner && (
        <div style={successBannerStyle} role="alert">
          <span>✓ {successBanner}</span>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            style={closeBannerButtonStyle}
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div style={profileHeaderCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {teacher.avatarUrl ? (
            <img
              src={teacher.avatarUrl}
              alt={teacher.fullName}
              style={avatarImageStyle}
              onError={(e) => {
                // If avatar fails to load, replace with initials
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={initialsAvatarStyle}>{initials}</div>
          )}

          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
              {teacher.fullName}
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#475569' }}>
                ✉ {teacher.email}
              </span>
              <span style={{ fontSize: '0.875rem', color: '#475569' }}>
                ☎ {teacher.phone || 'Chưa cập nhật SĐT'}
              </span>
              <span style={roleBadgeStyle}>
                Vai trò: Giáo viên ({teacher.roles.join(', ') || 'TEACHER'})
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Trạng thái hồ sơ:</span>
            <TeacherStatusBadge status={teacher.status} />
          </div>
          <div style={{ fontSize: '0.8rem', color: teacher.isActive ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
            {teacher.isActive ? '● Tài khoản: Đang hoạt động' : '○ Tài khoản: Bị vô hiệu hóa'}
          </div>
        </div>
      </div>

      {/* Detailed Information Grid */}
      <div style={detailGridStyle}>
        {/* Personal & Contact Information */}
        <div style={sectionCardStyle}>
          <h3 style={sectionCardTitleStyle}>Thông tin cá nhân & Liên hệ</h3>
          <div style={fieldListStyle}>
            <div style={fieldItemStyle}>
              <span style={fieldLabelStyle}>Mã giáo viên:</span>
              <span style={fieldValueStyle}>{teacher.teacherCode}</span>
            </div>
            <div style={fieldItemStyle}>
              <span style={fieldLabelStyle}>Họ và tên:</span>
              <span style={fieldValueStyle}>{teacher.fullName}</span>
            </div>
            <div style={fieldItemStyle}>
              <span style={fieldLabelStyle}>Email tài khoản:</span>
              <span style={fieldValueStyle}>{teacher.email}</span>
            </div>
            <div style={fieldItemStyle}>
              <span style={fieldLabelStyle}>Số điện thoại:</span>
              <span style={fieldValueStyle}>{teacher.phone || '-'}</span>
            </div>
            <div style={fieldItemStyle}>
              <span style={fieldLabelStyle}>Avatar URL:</span>
              <span style={{ ...fieldValueStyle, wordBreak: 'break-all' }}>
                {teacher.avatarUrl || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Professional & Academic Information */}
        <div style={sectionCardStyle}>
          <h3 style={sectionCardTitleStyle}>Chuyên môn & Công tác</h3>
          <div style={fieldListStyle}>
            <div style={fieldItemStyle}>
              <span style={fieldLabelStyle}>Chuyên môn giảng dạy:</span>
              <span style={{ ...fieldValueStyle, fontWeight: 600, color: '#1d4ed8' }}>
                {teacher.specialization}
              </span>
            </div>
            <div style={fieldItemStyle}>
              <span style={fieldLabelStyle}>Bằng cấp / Chứng chỉ:</span>
              <span style={fieldValueStyle}>{teacher.qualification || '-'}</span>
            </div>
            <div style={fieldItemStyle}>
              <span style={fieldLabelStyle}>Số năm kinh nghiệm:</span>
              <span style={fieldValueStyle}>{teacher.experienceYears} năm</span>
            </div>
            <div style={fieldItemStyle}>
              <span style={fieldLabelStyle}>Ngày vào làm:</span>
              <span style={fieldValueStyle}>{formatDateOnly(teacher.hireDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Management Section */}
      <TeacherStatusControl
        currentStatus={teacher.status}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

const pageContainerStyle: React.CSSProperties = {
  maxWidth: '1000px',
  margin: '0 auto',
  padding: '1.5rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
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

const editButtonStyle: React.CSSProperties = {
  padding: '0.45rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: '#ffffff',
  color: '#2563eb',
  border: '1px solid #93c5fd',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem'
};

const profileHeaderCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '1.5rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem'
};

const avatarImageStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid #e2e8f0'
};

const initialsAvatarStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '1.25rem',
  fontWeight: 700,
  border: '2px solid #bfdbfe'
};

const roleBadgeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  backgroundColor: '#f1f5f9',
  color: '#334155',
  padding: '0.15rem 0.5rem',
  borderRadius: '4px',
  fontWeight: 500
};

const detailGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.25rem'
};

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '1.25rem 1.5rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
};

const sectionCardTitleStyle: React.CSSProperties = {
  margin: '0 0 1rem 0',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: '#0f172a',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '0.5rem'
};

const fieldListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const fieldItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  fontSize: '0.875rem'
};

const fieldLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontWeight: 500,
  flex: '0 0 140px'
};

const fieldValueStyle: React.CSSProperties = {
  color: '#1e293b',
  fontWeight: 500,
  textAlign: 'right',
  flex: 1
};

const successBannerStyle: React.CSSProperties = {
  backgroundColor: '#ecfdf5',
  color: '#065f46',
  border: '1px solid #a7f3d0',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.875rem',
  fontWeight: 500
};

const closeBannerButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.2rem',
  color: '#065f46',
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

const retryButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};
