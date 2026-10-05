import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatUnreadBadge } from '../../utils/notificationHelper';

export interface NotificationBellProps {
  unreadCount: number;
  rolePath: string; // e.g. '/admin/notifications', '/staff/notifications', etc.
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, rolePath }) => {
  const navigate = useNavigate();
  const badgeText = formatUnreadBadge(unreadCount);

  const handleClick = () => {
    navigate(rolePath);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Thông báo"
      title={unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Thông báo'}
      style={bellButtonStyle}
      className="notification-bell-btn"
    >
      <span style={bellIconStyle} aria-hidden="true">
        🔔
      </span>
      {badgeText && (
        <span style={badgeStyle} aria-label={`${unreadCount} thông báo chưa đọc`}>
          {badgeText}
        </span>
      )}
    </button>
  );
};

const bellButtonStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '44px',
  minHeight: '44px',
  padding: '0.5rem',
  background: 'transparent',
  border: '1px solid var(--color-border, #e2e8f0)',
  borderRadius: 'var(--radius-md, 8px)',
  cursor: 'pointer',
  color: 'var(--color-text-primary, #1e293b)',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
  outline: 'none'
};

const bellIconStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  lineHeight: 1
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '20px',
  height: '20px',
  padding: '0 5px',
  fontSize: '0.75rem',
  fontWeight: 700,
  lineHeight: 1,
  color: '#ffffff',
  backgroundColor: '#ef4444',
  borderRadius: '9999px',
  border: '2px solid var(--color-surface, #ffffff)',
  boxShadow: 'var(--shadow-xs, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
  pointerEvents: 'none'
};
