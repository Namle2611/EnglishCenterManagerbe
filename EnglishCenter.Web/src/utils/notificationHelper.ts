import type {
  CreateClassNotificationRequest,
  CreateNotificationRequest,
  NotificationQueryParameters,
  NotificationUserLookupQuery
} from '../types/notification.types';

export const NOTIFICATION_REFRESH_EVENT = 'englishcenter:notifications:refresh';
export const NOTIFICATION_INBOX_REFRESH_EVENT = 'englishcenter:notifications:inbox-refresh';

/**
 * Triggers a global unread count refresh in the AppShell via custom event.
 */
export function triggerUnreadCountRefresh(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_REFRESH_EVENT));
  }
}

/**
 * Triggers a refresh of the open NotificationInbox via custom event.
 */
export function triggerNotificationInboxRefresh(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_INBOX_REFRESH_EVENT));
  }
}

/**
 * Resolves the SignalR NotificationHub HTTP(S) URL from API base configuration.
 * Always returns HTTP/HTTPS URL for SignalR negotiation; does NOT produce ws/wss scheme.
 * Strips any trailing /api prefix so hub route is mapped at root /hubs/notifications.
 */
export function getNotificationHubUrl(apiBaseUrl?: string): string {
  const base = apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5137/api';
  const origin = base.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  return `${origin}/hubs/notifications`;
}

/**
 * Checks whether an access token is expired or close to expiry (within 30 seconds).
 * Inspects exp claim only for client-side refresh timing; server remains auth authority.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now() + 30_000;
  } catch {
    return true;
  }
}

/**
 * Formats an ISO datetime string into Vietnamese local display format: DD/MM/YYYY HH:mm
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formats the unread badge display string:
 * 0 or negative: '' (hide badge)
 * 1–99: exact count as string
 * >= 100: '99+'
 */
export function formatUnreadBadge(count: number): string {
  if (!count || count <= 0) return '';
  if (count >= 100) return '99+';
  return String(count);
}

/**
 * Strict builder for direct send payload.
 */
export function buildDirectSendPayload(
  receiverId: number,
  title: string,
  content: string
): CreateNotificationRequest {
  return {
    receiverId: Number(receiverId),
    title: title.trim(),
    content: content.trim()
  };
}

/**
 * Strict builder for class broadcast payload.
 */
export function buildClassBroadcastPayload(
  title: string,
  content: string
): CreateClassNotificationRequest {
  return {
    title: title.trim(),
    content: content.trim()
  };
}

/**
 * Validates notification form fields.
 */
export function validateNotificationForm(
  title: string,
  content: string
): { isValid: boolean; errors: { title?: string; content?: string } } {
  const errors: { title?: string; content?: string } = {};
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle) {
    errors.title = 'Tiêu đề không được để trống.';
  } else if (trimmedTitle.length > 200) {
    errors.title = 'Tiêu đề không được vượt quá 200 ký tự.';
  }

  if (!trimmedContent) {
    errors.content = 'Nội dung không được để trống.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Checks if a class is valid for broadcasting.
 * Only Planned and Ongoing classes are permitted.
 */
export function isClassBroadcastable(status: string | null | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'planned' || s === 'ongoing';
}

/**
 * Constructs class context detail route according to user role.
 * Admin -> /admin/classes/{classId}
 * Staff -> /staff/classes/{classId}
 * Teacher/Student -> null (no general class detail route exists)
 */
export function getRoleClassRoute(role: string | undefined, classId: number | null): string | null {
  if (!classId) return null;
  const upperRole = role?.toUpperCase();
  if (upperRole === 'ADMIN') {
    return `/admin/classes/${classId}`;
  }
  if (upperRole === 'STAFF') {
    return `/staff/classes/${classId}`;
  }
  return null;
}

/**
 * Formats broadcast completion message based on sentCount.
 */
export function formatBroadcastResultMessage(sentCount: number): string {
  if (sentCount === 0) {
    return 'Không có học viên đang hoạt động để nhận thông báo.';
  }
  return `Đã gửi thông báo cho ${sentCount} học viên.`;
}

/**
 * Returns accessible read state label.
 */
export function getReadStatusLabel(isRead: boolean): string {
  return isRead ? 'Đã đọc' : 'Chưa đọc';
}

/**
 * Normalizes notification list query parameters.
 */
export function buildNotificationQueryParams(
  params: NotificationQueryParameters
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {
    page: params.page && params.page > 0 ? params.page : 1,
    pageSize: params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 10
  };

  if (params.isRead !== undefined) {
    result.isRead = params.isRead;
  }

  if (params.classId && params.classId > 0) {
    result.classId = params.classId;
  }

  return result;
}

/**
 * Normalizes user lookup query parameters.
 */
export function buildUserLookupQueryParams(
  params: NotificationUserLookupQuery
): Record<string, string | number> {
  const result: Record<string, string | number> = {
    page: params.page && params.page > 0 ? params.page : 1,
    pageSize: params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 20
  };

  if (params.search?.trim()) {
    result.search = params.search.trim();
  }

  return result;
}
