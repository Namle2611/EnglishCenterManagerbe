import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getRoleHomeRoute } from '../../utils/roleHelper';

interface AppShellProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const userRole = user?.roles?.[0] || '';

  // Determine navigation items based strictly on current user's role (presentation only)
  const getNavItems = (): NavItem[] => {
    if (user?.roles.includes('ADMIN')) {
      return [
        { label: 'Tổng quan', path: '/admin', icon: '📊' },
        { label: 'Quản lý học viên', path: '/admin/students', icon: '🎓' },
        { label: 'Quản lý giáo viên', path: '/admin/teachers', icon: '👨‍🏫' },
        { label: 'Quản lý khóa học', path: '/admin/courses', icon: '📚' },
        { label: 'Quản lý lớp học', path: '/admin/classes', icon: '🏫' },
        { label: 'Quản lý phòng học', path: '/admin/rooms', icon: '🚪' }
      ];
    }
    if (user?.roles.includes('STAFF')) {
      return [
        { label: 'Tổng quan', path: '/staff', icon: '📊' },
        { label: 'Quản lý học viên', path: '/staff/students', icon: '🎓' },
        { label: 'Quản lý khóa học', path: '/staff/courses', icon: '📚' },
        { label: 'Quản lý lớp học', path: '/staff/classes', icon: '🏫' },
        { label: 'Quản lý phòng học', path: '/staff/rooms', icon: '🚪' }
      ];
    }
    if (user?.roles.includes('TEACHER')) {
      return [
        { label: 'Tổng quan', path: '/teacher', icon: '📊' }
      ];
    }
    if (user?.roles.includes('STUDENT')) {
      return [
        { label: 'Tổng quan', path: '/student', icon: '📊' }
      ];
    }
    return [];
  };

  const navItems = getNavItems();
  const homeRoute = user ? getRoleHomeRoute(user.roles) : '/login';

  // Generate initials avatar fallback
  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Get role badge style
  const getRoleBadgeStyle = (): React.CSSProperties => {
    switch (userRole) {
      case 'ADMIN':
        return { color: 'var(--role-admin-text)', backgroundColor: 'var(--role-admin-bg)', border: '1px solid var(--role-admin-border)' };
      case 'STAFF':
        return { color: 'var(--role-staff-text)', backgroundColor: 'var(--role-staff-bg)', border: '1px solid var(--role-staff-border)' };
      case 'TEACHER':
        return { color: 'var(--role-teacher-text)', backgroundColor: 'var(--role-teacher-bg)', border: '1px solid var(--role-teacher-border)' };
      case 'STUDENT':
        return { color: 'var(--role-student-text)', backgroundColor: 'var(--role-student-bg)', border: '1px solid var(--role-student-border)' };
      default:
        return { color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)' };
    }
  };

  const isActiveRoute = (path: string): boolean => {
    if (path === '/admin' || path === '/staff' || path === '/teacher' || path === '/student') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={shellContainerStyle}>
      {/* Topbar */}
      <header style={topbarStyle}>
        <div style={topbarLeftStyle}>
          <button
            type="button"
            aria-label="Mở menu điều hướng"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={mobileMenuToggleStyle}
          >
            ☰
          </button>
          <Link to={homeRoute} style={brandLogoLinkStyle}>
            <span style={brandIconStyle}>🏛️</span>
            <span style={brandTitleStyle}>EnglishCenter</span>
          </Link>
        </div>

        <div style={topbarRightStyle}>
          {user && (
            <div style={userProfileSectionStyle}>
              <div style={avatarCircleStyle}>
                {getInitials(user.fullName)}
              </div>
              <div style={userInfoColumnStyle}>
                <div style={userNameRowStyle}>
                  <span style={userNameStyle}>{user.fullName}</span>
                  <span style={{ ...roleBadgeStyle, ...getRoleBadgeStyle() }}>
                    {userRole}
                  </span>
                </div>
                <span style={userEmailStyle}>{user.email}</span>
              </div>
            </div>
          )}

          <div style={topbarActionsStyle}>
            <Link
              to="/change-password"
              style={changePasswordBtnStyle}
              title="Đổi mật khẩu tài khoản"
            >
              Đổi mật khẩu
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              style={signOutBtnStyle}
              title="Đăng xuất khỏi hệ thống"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Body Area */}
      <div style={bodyLayoutStyle}>
        {/* Sidebar */}
        <aside
          style={{
            ...sidebarStyle,
            ...(isMobileMenuOpen ? sidebarMobileOpenStyle : {})
          }}
        >
          <div style={sidebarNavHeaderStyle}>
            <span style={sidebarNavHeadingStyle}>ĐIỀU HƯỚNG</span>
          </div>
          <nav aria-label="Điều hướng chính" style={sidebarNavStyle}>
            {navItems.map((item) => {
              const active = isActiveRoute(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    ...navItemStyle,
                    ...(active ? navItemActiveStyle : {})
                  }}
                >
                  <span style={navIconStyle}>{item.icon}</span>
                  <span style={navLabelStyle}>{item.label}</span>
                  {active && <span style={activeIndicatorStyle} />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Backdrop */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            style={mobileBackdropStyle}
            aria-hidden="true"
          />
        )}

        {/* Main Content Workspace */}
        <main style={mainWorkspaceStyle}>
          {children}
        </main>
      </div>
    </div>
  );
};

// Styles
const shellContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: 'var(--color-canvas)',
  color: 'var(--color-text-primary)'
};

const topbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '64px',
  padding: '0 1.5rem',
  backgroundColor: 'var(--color-surface)',
  borderBottom: '1px solid var(--color-border)',
  position: 'sticky',
  top: 0,
  zIndex: 30,
  boxShadow: 'var(--shadow-xs)'
};

const topbarLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const mobileMenuToggleStyle: React.CSSProperties = {
  display: 'none',
  background: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '0.375rem 0.625rem',
  fontSize: '1.25rem',
  cursor: 'pointer',
  color: 'var(--color-text-primary)'
};

const brandLogoLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  textDecoration: 'none',
  color: 'var(--color-text-primary)'
};

const brandIconStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  lineHeight: 1
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--color-text-primary)'
};

const topbarRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem'
};

const userProfileSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  paddingRight: '1rem',
  borderRight: '1px solid var(--color-border)'
};

const avatarCircleStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-primary-subtle)',
  color: 'var(--color-primary)',
  border: '1px solid var(--color-primary-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: '0.875rem'
};

const userInfoColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem'
};

const userNameRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const userNameStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)'
};

const roleBadgeStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  padding: '0.125rem 0.4rem',
  borderRadius: 'var(--radius-full)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase'
};

const userEmailStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)'
};

const topbarActionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem'
};

const changePasswordBtnStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  padding: '0.375rem 0.75rem',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-secondary)',
  backgroundColor: 'var(--color-surface-subtle)',
  border: '1px solid var(--color-border)',
  textDecoration: 'none',
  transition: 'background-color 0.15s ease, color 0.15s ease'
};

const signOutBtnStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  padding: '0.375rem 0.75rem',
  borderRadius: 'var(--radius-md)',
  color: 'var(--status-danger-text)',
  backgroundColor: 'var(--status-danger-bg)',
  border: '1px solid var(--status-danger-border)',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease'
};

const bodyLayoutStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1
};

const sidebarStyle: React.CSSProperties = {
  width: '240px',
  backgroundColor: 'var(--color-surface)',
  borderRight: '1px solid var(--color-border)',
  display: 'flex',
  flexDirection: 'column',
  padding: '1.25rem 0.75rem',
  gap: '0.5rem',
  flexShrink: 0
};

const sidebarMobileOpenStyle: React.CSSProperties = {
  display: 'flex',
  position: 'fixed',
  top: '64px',
  left: 0,
  bottom: 0,
  zIndex: 40,
  boxShadow: 'var(--shadow-lg)'
};

const mobileBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: '64px',
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  zIndex: 35
};

const sidebarNavHeaderStyle: React.CSSProperties = {
  padding: '0 0.75rem 0.5rem'
};

const sidebarNavHeadingStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  letterSpacing: '0.06em'
};

const sidebarNavStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const navItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.625rem 0.75rem',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  color: 'var(--color-text-secondary)',
  fontSize: '0.875rem',
  fontWeight: 500,
  transition: 'background-color 0.15s ease, color 0.15s ease',
  position: 'relative'
};

const navItemActiveStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-primary-subtle)',
  color: 'var(--color-primary)',
  fontWeight: 600
};

const navIconStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  lineHeight: 1
};

const navLabelStyle: React.CSSProperties = {
  flex: 1
};

const activeIndicatorStyle: React.CSSProperties = {
  width: '4px',
  height: '18px',
  backgroundColor: 'var(--color-primary)',
  borderRadius: 'var(--radius-full)',
  position: 'absolute',
  right: '6px'
};

const mainWorkspaceStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '1.75rem 2rem',
  maxWidth: '1200px',
  margin: '0 auto',
  width: '100%'
};
