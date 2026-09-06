import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../components/common/LoadingState';
import { StudentStatusBadge } from '../../components/students/StudentStatusBadge';
import { StudentStatusControl } from '../../components/students/StudentStatusControl';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/student.service';
import type { StudentDetail, StudentStatus } from '../../types/student.types';
import {
  formatDateOnly,
  getApiErrorMessage,
  getStudentBasePath
} from '../../utils/studentHelper';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const basePath = getStudentBasePath(location.pathname, user?.roles);

  const [student, setStudent] = useState<StudentDetail | null>(null);
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
    const studentId = parseInt(id || '', 10);
    if (isNaN(studentId) || studentId <= 0) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setIsNotFound(false);

      try {
        const response = await studentService.getStudentById(studentId);
        if (response.success && response.data) {
          setStudent(response.data);
        } else {
          setErrorMessage(response.message || 'Không thể tải thông tin học viên.');
        }
      } catch (err: unknown) {
        // If 404
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          setIsNotFound(true);
        } else {
          setErrorMessage(getApiErrorMessage(err));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleStatusChange = async (newStatus: StudentStatus) => {
    if (!student) return;
    const response = await studentService.updateStudentStatus(student.id, newStatus);
    if (response.success && response.data) {
      // Direct update from backend source of truth
      setStudent(response.data);
      setSuccessBanner(`Đã cập nhật trạng thái học viên thành: ${newStatus}`);
    }
  };

  if (isLoading) {
    return (
      <div style={pageContainerStyle}>
        <LoadingState message="Đang tải thông tin chi tiết học viên..." />
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
      </div>
    );
  }

  if (errorMessage || !student) {
    return (
      <div style={pageContainerStyle}>
        <div style={errorContainerStyle}>
          <p>
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
      </div>
    );
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div style={pageContainerStyle}>
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

      {/* Navigation header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate(basePath)}
            style={backButtonStyle}
            title="Quay lại danh sách"
          >
            &larr; Quay lại
          </button>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>
            Hồ sơ học viên: {student.fullName}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`${basePath}/${student.id}/edit`} style={editButtonStyle}>
            ✎ Chỉnh sửa thông tin
          </Link>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div style={cardStyle}>
        <div style={profileHeaderStyle}>
          {student.avatarUrl ? (
            <img
              src={student.avatarUrl}
              alt={student.fullName}
              style={avatarImageStyle}
              onError={(e) => {
                // If avatar image fails to load, replace with initials
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={avatarFallbackStyle}>{getInitials(student.fullName)}</div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                {student.fullName}
              </h2>
              <StudentStatusBadge status={student.status} />
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: student.isActive ? '#ecfdf5' : '#fef2f2',
                  color: student.isActive ? '#065f46' : '#991b1b',
                  border: `1px solid ${student.isActive ? '#a7f3d0' : '#fecaca'}`
                }}
              >
                Tài khoản: {student.isActive ? 'Đang hoạt động' : 'Đã khóa'}
              </span>
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: '#475569', fontSize: '0.875rem' }}>
              <div>
                <strong>Mã học viên:</strong>{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {student.studentCode}
                </span>
              </div>
              <div>
                <strong>Email:</strong> {student.email}
              </div>
              <div>
                <strong>Số điện thoại:</strong> {student.phone || '-'}
              </div>
              <div>
                <strong>Vai trò hệ thống:</strong> {student.roles.join(', ') || 'Học viên'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Info Grid */}
      <div style={detailsGridStyle}>
        {/* Academic & Personal details */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Thông tin cá nhân & học tập</h3>
          <div style={infoListStyle}>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Trình độ hiện tại:</span>
              <span style={infoValueStyle}>{student.currentLevel || 'Chưa xác định'}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Ngày nhập học:</span>
              <span style={infoValueStyle}>{formatDateOnly(student.enrollmentDate)}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Ngày sinh:</span>
              <span style={infoValueStyle}>{formatDateOnly(student.dateOfBirth)}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Giới tính:</span>
              <span style={infoValueStyle}>{student.gender || '-'}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Địa chỉ liên hệ:</span>
              <span style={infoValueStyle}>{student.address || '-'}</span>
            </div>
          </div>
        </div>

        {/* Status Control Card */}
        <div>
          <StudentStatusControl
            currentStatus={student.status}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
};

const pageContainerStyle: React.CSSProperties = {
  maxWidth: '1000px',
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

const editButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  backgroundColor: '#2563eb',
  color: '#ffffff',
  borderRadius: '6px',
  textDecoration: 'none'
};

const successBannerStyle: React.CSSProperties = {
  padding: '0.75rem 1.25rem',
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '8px',
  color: '#065f46',
  fontSize: '0.875rem',
  fontWeight: 500,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const dismissButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.25rem',
  color: '#065f46',
  cursor: 'pointer',
  lineHeight: 1
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
};

const profileHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  flexWrap: 'wrap'
};

const avatarImageStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid #e2e8f0'
};

const avatarFallbackStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  fontWeight: 700,
  flexShrink: 0
};

const detailsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.5rem',
  alignItems: 'start'
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 1rem 0',
  fontSize: '1rem',
  color: '#1e293b',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '0.5rem'
};

const infoListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.875rem',
  borderBottom: '1px dashed #f1f5f9',
  paddingBottom: '0.5rem'
};

const infoLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontWeight: 500
};

const infoValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 600
};

const notFoundCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '3rem 1.5rem',
  borderRadius: '8px',
  textAlign: 'center',
  border: '1px dashed #cbd5e1'
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

const errorContainerStyle: React.CSSProperties = {
  padding: '1.5rem',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  borderRadius: '8px',
  border: '1px solid #fecaca',
  textAlign: 'center'
};
