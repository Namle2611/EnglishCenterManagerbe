import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <AppShell>
      <PageHeader
        title="Cổng thông tin giảng viên"
        subtitle={`Xin chào, thầy/cô ${user?.fullName || ''}! Chúc thầy/cô một buổi giảng dạy tràn đầy năng lượng.`}
      />

      <div style={overviewCardStyle}>
        <h3 style={overviewTitleStyle}>Hồ sơ giảng viên</h3>
        <p style={overviewSubtitleStyle}>
          Thông tin tài khoản giảng dạy trên hệ thống trung tâm Anh ngữ.
        </p>

        <div style={infoGridStyle}>
          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Mã định danh</span>
            <span style={infoValueStyle} className="font-mono">#{user?.id}</span>
          </div>

          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Họ và tên</span>
            <span style={infoValueStyle}>{user?.fullName}</span>
          </div>

          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Email liên hệ</span>
            <span style={infoValueStyle}>{user?.email}</span>
          </div>

          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Vai trò hệ thống</span>
            <span style={roleBadgeStyle}>
              {user?.roles.join(', ')}
            </span>
          </div>

          <div style={infoItemStyle}>
            <span style={infoLabelStyle}>Trạng thái tài khoản</span>
            <span style={user?.isActive ? activeBadgeStyle : inactiveBadgeStyle}>
              {user?.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const overviewCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-sm)',
  padding: '1.75rem',
  maxWidth: '800px'
};

const overviewTitleStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  margin: '0 0 0.375rem 0'
};

const overviewSubtitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)',
  margin: '0 0 1.25rem 0'
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  padding: '1.25rem',
  backgroundColor: 'var(--color-surface-subtle)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)'
};

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const infoValueStyle: React.CSSProperties = {
  fontSize: '0.9375rem',
  fontWeight: 500,
  color: 'var(--color-text-primary)'
};

const roleBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.5rem',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--role-teacher-bg)',
  color: 'var(--role-teacher-text)',
  border: '1px solid var(--role-teacher-border)',
  fontSize: '0.75rem',
  fontWeight: 600,
  width: 'fit-content'
};

const activeBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.5rem',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--status-active-bg)',
  color: 'var(--status-active-text)',
  border: '1px solid var(--status-active-border)',
  fontSize: '0.75rem',
  fontWeight: 600,
  width: 'fit-content'
};

const inactiveBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.5rem',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--status-inactive-bg)',
  color: 'var(--status-inactive-text)',
  border: '1px solid var(--status-inactive-border)',
  fontSize: '0.75rem',
  fontWeight: 600,
  width: 'fit-content'
};
