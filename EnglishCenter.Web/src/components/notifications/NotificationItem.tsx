import React from 'react';
import { Link } from 'react-router-dom';
import type { NotificationResponse } from '../../types/notification.types';
import { formatDateTime, getReadStatusLabel, getRoleClassRoute } from '../../utils/notificationHelper';

export interface NotificationItemProps {
  notification: NotificationResponse;
  userRole?: string;
  isMarkingRead?: boolean;
  onMarkRead: (id: number) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  userRole,
  isMarkingRead = false,
  onMarkRead
}) => {
  const isUnread = !notification.isRead;
  const statusLabel = getReadStatusLabel(notification.isRead);
  const formattedDate = formatDateTime(notification.createdAt);
  const classRoute = getRoleClassRoute(userRole, notification.classId);

  return (
    <div
      style={{
        ...cardContainerStyle,
        ...(isUnread ? unreadCardStyle : readCardStyle)
      }}
      className={`notification-card ${isUnread ? 'is-unread' : 'is-read'}`}
    >
      {/* Top Header Row: Status Badge & Timestamp & Actions */}
      <div style={cardHeaderRowStyle}>
        <div style={badgesGroupStyle}>
          {/* Read / Unread Status Badge */}
          <span
            style={{
              ...statusBadgeBaseStyle,
              ...(isUnread ? unreadBadgeStyle : readBadgeStyle)
            }}
          >
            {statusLabel}
          </span>

          {/* Class Context Badge (if classId & classCode present) */}
          {notification.classId && notification.classCode && (
            <span style={classBadgeWrapperStyle}>
              {classRoute ? (
                <Link
                  to={classRoute}
                  style={classLinkStyle}
                  title={`Xem chi tiết lớp học ${notification.classCode}`}
                >
                  🏫 Lớp {notification.classCode}
                </Link>
              ) : (
                <span style={classTextBadgeStyle}>
                  🏫 Lớp {notification.classCode}
                </span>
              )}
            </span>
          )}
        </div>

        <div style={headerRightStyle}>
          <time dateTime={notification.createdAt} style={timestampStyle}>
            {formattedDate}
          </time>

          {/* Explicit Mark Read Button for unread notifications */}
          {isUnread && (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              disabled={isMarkingRead}
              style={markReadButtonStyle}
              aria-label={`Đánh dấu đã đọc thông báo: ${notification.title}`}
            >
              {isMarkingRead ? 'Đang xử lý...' : 'Đánh dấu đã đọc'}
            </button>
          )}
        </div>
      </div>

      {/* Title (Plain text React escaped) */}
      <h3
        style={{
          ...titleStyle,
          fontWeight: isUnread ? 700 : 500
        }}
      >
        {notification.title}
      </h3>

      {/* Content (Plain text React escaped with whitespace preservation) */}
      <div style={contentStyle}>
        {notification.content}
      </div>

      {/* Sender footer */}
      {notification.senderName && (
        <div style={senderFooterStyle}>
          <span style={senderLabelStyle}>Người gửi:</span>
          <span style={senderNameStyle}>{notification.senderName}</span>
        </div>
      )}
    </div>
  );
};

// Styles
const cardContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.625rem',
  padding: '1.25rem',
  borderRadius: 'var(--radius-lg, 12px)',
  border: '1px solid var(--color-border, #e2e8f0)',
  backgroundColor: 'var(--color-surface, #ffffff)',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
};

const unreadCardStyle: React.CSSProperties = {
  borderLeft: '4px solid #3b82f6',
  backgroundColor: '#f8faff'
};

const readCardStyle: React.CSSProperties = {
  borderLeft: '4px solid #cbd5e1',
  backgroundColor: 'var(--color-surface, #ffffff)'
};

const cardHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '0.5rem'
};

const badgesGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap'
};

const statusBadgeBaseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.55rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: 'var(--radius-sm, 6px)',
  lineHeight: 1.2
};

const unreadBadgeStyle: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  color: '#1d4ed8',
  border: '1px solid #bfdbfe'
};

const readBadgeStyle: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  color: '#475569',
  border: '1px solid #e2e8f0'
};

const classBadgeWrapperStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center'
};

const classLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.55rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: 'var(--radius-sm, 6px)',
  backgroundColor: '#f0fdf4',
  color: '#15803d',
  border: '1px solid #bbf7d0',
  textDecoration: 'none',
  transition: 'background-color 0.15s ease'
};

const classTextBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.55rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: 'var(--radius-sm, 6px)',
  backgroundColor: '#f0fdf4',
  color: '#15803d',
  border: '1px solid #bbf7d0'
};

const headerRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap'
};

const timestampStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary, #64748b)'
};

const markReadButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.3rem 0.75rem',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: '#2563eb',
  backgroundColor: '#ffffff',
  border: '1px solid #93c5fd',
  borderRadius: 'var(--radius-md, 6px)',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  lineHeight: 1.4,
  color: 'var(--color-text-primary, #0f172a)',
  wordBreak: 'break-word'
};

const contentStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  lineHeight: 1.6,
  color: 'var(--color-text-secondary, #334155)',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word'
};

const senderFooterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary, #64748b)',
  paddingTop: '0.25rem',
  borderTop: '1px dashed var(--color-border, #f1f5f9)'
};

const senderLabelStyle: React.CSSProperties = {
  fontWeight: 400
};

const senderNameStyle: React.CSSProperties = {
  fontWeight: 600,
  color: 'var(--color-text-primary, #1e293b)'
};
