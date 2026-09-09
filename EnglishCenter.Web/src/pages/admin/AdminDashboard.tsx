import React from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <AppShell>
      <PageHeader
        title="Tổng quan quản trị"
        subtitle={`Xin chào, ${user?.fullName || 'Quản trị viên'}! Chào mừng bạn quay trở lại hệ thống.`}
      />

      {/* Quick Action Navigation Grid */}
      <div style={navGridStyle}>
        <Link to="/admin/students" style={navCardStyle}>
          <div style={navIconContainerStyle}>🎓</div>
          <div style={navContentStyle}>
            <h2 style={navTitleStyle}>Quản lý học viên</h2>
            <p style={navDescriptionStyle}>
              Tra cứu danh sách, tìm kiếm, tạo mới hồ sơ và quản lý trạng thái học viên
            </p>
          </div>
          <span style={navArrowStyle}>&rarr;</span>
        </Link>

        <Link to="/admin/teachers" style={navCardStyle}>
          <div style={navIconContainerStyle}>👨‍🏫</div>
          <div style={navContentStyle}>
            <h2 style={navTitleStyle}>Quản lý giáo viên</h2>
            <p style={navDescriptionStyle}>
              Tra cứu danh sách giảng viên, tạo tài khoản mới và cập nhật trạng thái công tác
            </p>
          </div>
          <span style={navArrowStyle}>&rarr;</span>
        </Link>

        <Link to="/admin/courses" style={navCardStyle}>
          <div style={navIconContainerStyle}>📚</div>
          <div style={navContentStyle}>
            <h2 style={navTitleStyle}>Quản lý khóa học</h2>
            <p style={navDescriptionStyle}>
              Tra cứu chương trình đào tạo, thiết lập học phí, thời lượng và trạng thái mở lớp
            </p>
          </div>
          <span style={navArrowStyle}>&rarr;</span>
        </Link>

        <Link to="/admin/classes" style={navCardStyle}>
          <div style={navIconContainerStyle}>🏫</div>
          <div style={navContentStyle}>
            <h2 style={navTitleStyle}>Quản lý lớp học</h2>
            <p style={navDescriptionStyle}>
              Tra cứu danh sách lớp học, phân công giảng viên, quản lý thời gian và theo dõi trạng thái
            </p>
          </div>
          <span style={navArrowStyle}>&rarr;</span>
        </Link>
      </div>

      {/* Administrator Account Overview Card (Strictly factual info, zero fake metrics) */}
      <div style={overviewCardStyle}>
        <h3 style={overviewTitleStyle}>Thông tin tài khoản quản trị</h3>
        <p style={overviewSubtitleStyle}>
          Phiên đăng nhập hiện tại được cấp quyền Administrator toàn hệ thống.
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

const navGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '1.25rem',
  marginBottom: '2rem'
};

const navCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
  padding: '1.5rem',
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-sm)',
  textDecoration: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease'
};

const navIconContainerStyle: React.CSSProperties = {
  width: '52px',
  height: '52px',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-surface-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.75rem',
  flexShrink: 0
};

const navContentStyle: React.CSSProperties = {
  flex: 1
};

const navTitleStyle: React.CSSProperties = {
  fontSize: '1.0625rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  margin: '0 0 0.375rem 0'
};

const navDescriptionStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  lineHeight: 1.4,
  margin: 0
};

const navArrowStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  color: 'var(--color-text-muted)',
  fontWeight: 600
};

const overviewCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-sm)',
  padding: '1.75rem'
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
  backgroundColor: 'var(--role-admin-bg)',
  color: 'var(--role-admin-text)',
  border: '1px solid var(--role-admin-border)',
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
