import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { NotificationResponse } from '../../types/notification.types';
import { notificationService } from '../../services/notification.service';
import { NOTIFICATION_INBOX_REFRESH_EVENT, triggerUnreadCountRefresh } from '../../utils/notificationHelper';
import { NotificationItem } from './NotificationItem';

export interface NotificationInboxProps {
  userRole?: string;
  externalUnreadCount?: number;
}

type ReadFilter = 'all' | 'unread' | 'read';

export const NotificationInbox: React.FC<NotificationInboxProps> = ({
  userRole,
  externalUnreadCount = 0
}) => {
  const [filter, setFilter] = useState<ReadFilter>('all');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [markingReadId, setMarkingReadId] = useState<number | null>(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchInbox = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const isReadParam = filter === 'unread' ? false : filter === 'read' ? true : undefined;
      const response = await notificationService.getNotifications(
        {
          page,
          pageSize,
          isRead: isReadParam
        },
        controller.signal
      );

      if (response && response.success && response.data) {
        setNotifications(response.data.items || []);
        setTotalItems(response.data.totalItems || 0);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'CanceledError') {
        return;
      }
      setErrorMessage('Không thể tải danh sách thông báo. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInbox();
    }, 0);

    const handleInboxRefresh = () => {
      fetchInbox();
    };

    window.addEventListener(NOTIFICATION_INBOX_REFRESH_EVENT, handleInboxRefresh);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(NOTIFICATION_INBOX_REFRESH_EVENT, handleInboxRefresh);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchInbox]);

  const handleFilterChange = (newFilter: ReadFilter) => {
    if (newFilter !== filter) {
      setFilter(newFilter);
      setPage(1);
    }
  };

  const handleMarkOneRead = async (id: number) => {
    if (markingReadId) return;
    setMarkingReadId(id);
    setErrorMessage(null);

    try {
      const response = await notificationService.markAsRead(id);
      if (response && response.success) {
        // Authoritative update: update the item in state
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        triggerUnreadCountRefresh();
      }
    } catch {
      setErrorMessage('Không thể đánh dấu đã đọc. Vui lòng thử lại.');
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (isMarkingAllRead) return;
    setIsMarkingAllRead(true);
    setErrorMessage(null);

    try {
      const response = await notificationService.markAllAsRead();
      if (response && response.success) {
        const count = response.data?.updatedCount ?? 0;
        setSuccessMessage(`Đã đánh dấu đã đọc ${count} thông báo.`);
        // Refresh authoritative inbox state
        await fetchInbox();
        triggerUnreadCountRefresh();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch {
      setErrorMessage('Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.');
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  // Has unread check for Mark All Read button visibility
  const hasUnread = externalUnreadCount > 0 || notifications.some((n) => !n.isRead);

  return (
    <div style={containerStyle} className="notification-inbox">
      {/* Top Action Bar */}
      <div style={inboxTopBarStyle}>
        {/* Filters Group */}
        <div style={filterButtonsGroupStyle} role="tablist" aria-label="Bộ lọc thông báo">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => handleFilterChange('all')}
            style={{
              ...filterButtonStyle,
              ...(filter === 'all' ? activeFilterButtonStyle : {})
            }}
          >
            Tất cả
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'unread'}
            onClick={() => handleFilterChange('unread')}
            style={{
              ...filterButtonStyle,
              ...(filter === 'unread' ? activeFilterButtonStyle : {})
            }}
          >
            Chưa đọc
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'read'}
            onClick={() => handleFilterChange('read')}
            style={{
              ...filterButtonStyle,
              ...(filter === 'read' ? activeFilterButtonStyle : {})
            }}
          >
            Đã đọc
          </button>
        </div>

        {/* Action Buttons: Mark All Read & Manual Refresh */}
        <div style={topActionsGroupStyle}>
          {hasUnread && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
              style={markAllReadButtonStyle}
              aria-label="Đánh dấu tất cả thông báo là đã đọc"
            >
              {isMarkingAllRead ? 'Đang xử lý...' : '✓ Đánh dấu tất cả đã đọc'}
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchInbox()}
            disabled={isLoading}
            style={refreshButtonStyle}
            title="Làm mới danh sách thông báo"
            aria-label="Làm mới danh sách thông báo"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {errorMessage && (
        <div style={errorBannerStyle} role="alert">
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={closeBannerBtnStyle}
            aria-label="Đóng thông báo lỗi"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div style={successBannerStyle} role="status">
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={closeBannerBtnStyle}
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div style={loadingContainerStyle} aria-live="polite">
          <div style={loadingSpinnerStyle} />
          <span>Đang tải thông báo...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div style={emptyContainerStyle}>
          <span style={emptyIconStyle}>📭</span>
          <p style={emptyTextStyle}>
            {filter === 'unread'
              ? 'Không có thông báo chưa đọc.'
              : filter === 'read'
              ? 'Không có thông báo đã đọc.'
              : 'Bạn chưa có thông báo.'}
          </p>
        </div>
      ) : (
        <div style={listContainerStyle} role="feed" aria-label="Danh sách thông báo">
          {notifications.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              userRole={userRole}
              isMarkingRead={markingReadId === item.id}
              onMarkRead={handleMarkOneRead}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && notifications.length > 0 && (
        <div style={paginationRowStyle}>
          <span style={paginationInfoStyle}>
            Hiển thị {notifications.length} / tổng số {totalItems} thông báo
          </span>

          <div style={paginationButtonsStyle}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                ...pageNavButtonStyle,
                ...(page <= 1 ? disabledPageNavButtonStyle : {})
              }}
              aria-label="Trang trước"
            >
              ← Trước
            </button>

            <span style={pageIndicatorStyle}>
              Trang {page} / {Math.max(1, totalPages)}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                ...pageNavButtonStyle,
                ...(page >= totalPages ? disabledPageNavButtonStyle : {})
              }}
              aria-label="Trang sau"
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem'
};

const inboxTopBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '1rem'
};

const filterButtonsGroupStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.25rem',
  backgroundColor: 'var(--color-surface-subtle, #f1f5f9)',
  borderRadius: 'var(--radius-md, 8px)',
  border: '1px solid var(--color-border, #e2e8f0)'
};

const filterButtonStyle: React.CSSProperties = {
  padding: '0.45rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text-secondary, #64748b)',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 'var(--radius-sm, 6px)',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const activeFilterButtonStyle: React.CSSProperties = {
  color: '#2563eb',
  backgroundColor: 'var(--color-surface, #ffffff)',
  fontWeight: 600,
  boxShadow: 'var(--shadow-xs, 0 1px 2px 0 rgba(0, 0, 0, 0.05))'
};

const topActionsGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap'
};

const markAllReadButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.45rem 0.95rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#15803d',
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 'var(--radius-md, 8px)',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const refreshButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.45rem 0.95rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text-primary, #1e293b)',
  backgroundColor: 'var(--color-surface, #ffffff)',
  border: '1px solid var(--color-border, #e2e8f0)',
  borderRadius: 'var(--radius-md, 8px)',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const errorBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.875rem 1.25rem',
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: '0.875rem'
};

const successBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.875rem 1.25rem',
  backgroundColor: '#f0fdf4',
  color: '#15803d',
  border: '1px solid #bbf7d0',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: '0.875rem'
};

const closeBannerBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  color: 'inherit',
  opacity: 0.7
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem',
  gap: '1rem',
  color: 'var(--color-text-secondary, #64748b)'
};

const loadingSpinnerStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '3px solid #e2e8f0',
  borderTopColor: '#3b82f6',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite'
};

const emptyContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3.5rem 1rem',
  borderRadius: 'var(--radius-lg, 12px)',
  border: '1px dashed var(--color-border, #cbd5e1)',
  backgroundColor: 'var(--color-surface, #ffffff)',
  textAlign: 'center'
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  marginBottom: '0.5rem'
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: '1rem',
  color: 'var(--color-text-secondary, #64748b)',
  margin: 0
};

const listContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const paginationRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '1rem',
  paddingTop: '0.75rem',
  borderTop: '1px solid var(--color-border, #e2e8f0)'
};

const paginationInfoStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary, #64748b)'
};

const paginationButtonsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const pageNavButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text-primary, #1e293b)',
  backgroundColor: 'var(--color-surface, #ffffff)',
  border: '1px solid var(--color-border, #cbd5e1)',
  borderRadius: 'var(--radius-md, 6px)',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
};

const disabledPageNavButtonStyle: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
  backgroundColor: '#f8fafc'
};

const pageIndicatorStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text-secondary, #475569)'
};
