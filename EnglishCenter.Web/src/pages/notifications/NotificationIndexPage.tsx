import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/layout/PageHeader';
import { NotificationInbox } from '../../components/notifications/NotificationInbox';
import { DirectSendForm } from '../../components/notifications/DirectSendForm';
import { ClassBroadcastForm } from '../../components/notifications/ClassBroadcastForm';
import { useAuth } from '../../hooks/useAuth';

type TabType = 'inbox' | 'direct' | 'broadcast';

export const NotificationIndexPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('inbox');

  const roles = user?.roles || [];
  const isAdmin = roles.includes('ADMIN');
  const isStaff = roles.includes('STAFF');
  const isTeacher = roles.includes('TEACHER');

  // Capabilities UX visibility
  const canDirectSend = isAdmin || isStaff;
  const canBroadcast = isAdmin || isStaff || isTeacher;

  // Determine home route & role label
  const getRolePrefix = () => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/staff')) return '/staff';
    if (location.pathname.startsWith('/teacher')) return '/teacher';
    if (location.pathname.startsWith('/student')) return '/student';
    return '/admin';
  };
  const rolePrefix = getRolePrefix();
  const primaryRole = roles[0] || '';

  const breadcrumbs = [
    { label: 'Trang chủ', path: rolePrefix },
    { label: 'Thông báo', path: `${rolePrefix}/notifications` }
  ];

  return (
    <AppShell>
      <PageHeader
        title="Quản lý thông báo"
        subtitle="Theo dõi tin tức, gửi tin nhắn trực tiếp và phát thông báo tới các lớp học"
        breadcrumbs={breadcrumbs}
      />

      {/* Tabs navigation if user has multiple capabilities */}
      {(canDirectSend || canBroadcast) && (
        <div style={tabContainerStyle} role="tablist" aria-label="Điều hướng tính năng thông báo">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'inbox'}
            onClick={() => setActiveTab('inbox')}
            style={{
              ...tabButtonStyle,
              ...(activeTab === 'inbox' ? activeTabButtonStyle : {})
            }}
          >
            📬 Hộp thư thông báo
          </button>

          {canDirectSend && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'direct'}
              onClick={() => setActiveTab('direct')}
              style={{
                ...tabButtonStyle,
                ...(activeTab === 'direct' ? activeTabButtonStyle : {})
              }}
            >
              ✉️ Gửi tin nhắn trực tiếp
            </button>
          )}

          {canBroadcast && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'broadcast'}
              onClick={() => setActiveTab('broadcast')}
              style={{
                ...tabButtonStyle,
                ...(activeTab === 'broadcast' ? activeTabButtonStyle : {})
              }}
            >
              📢 Thông báo lớp học
            </button>
          )}
        </div>
      )}

      {/* Tab Panels */}
      <div style={contentAreaStyle}>
        {activeTab === 'inbox' && (
          <div role="tabpanel" aria-label="Hộp thư thông báo">
            <NotificationInbox userRole={primaryRole} />
          </div>
        )}

        {activeTab === 'direct' && canDirectSend && (
          <div role="tabpanel" aria-label="Gửi tin nhắn trực tiếp">
            <DirectSendForm />
          </div>
        )}

        {activeTab === 'broadcast' && canBroadcast && (
          <div role="tabpanel" aria-label="Thông báo lớp học">
            <ClassBroadcastForm />
          </div>
        )}
      </div>
    </AppShell>
  );
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  borderBottom: '1px solid var(--color-border, #e2e8f0)',
  marginBottom: '1.5rem',
  paddingBottom: '0.25rem',
  overflowX: 'auto'
};

const tabButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.625rem 1.25rem',
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary, #64748b)',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  cursor: 'pointer',
  borderRadius: 'var(--radius-md, 6px) var(--radius-md, 6px) 0 0',
  transition: 'color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
  outline: 'none',
  whiteSpace: 'nowrap'
};

const activeTabButtonStyle: React.CSSProperties = {
  color: 'var(--color-primary, #2563eb)',
  borderBottom: '2px solid var(--color-primary, #2563eb)',
  backgroundColor: 'var(--color-primary-subtle, #eff6ff)'
};

const contentAreaStyle: React.CSSProperties = {
  width: '100%'
};
