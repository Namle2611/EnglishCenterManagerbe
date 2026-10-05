export interface NotificationResponse {
  id: number;
  title: string;
  content: string;
  senderId: number;
  senderName: string;
  classId: number | null;
  classCode: string | null;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface BatchReadResponse {
  updatedCount: number;
}

export interface CreateNotificationRequest {
  receiverId: number;
  title: string;
  content: string;
}

export interface CreateClassNotificationRequest {
  title: string;
  content: string;
}

export interface BatchCreateNotificationResponse {
  classId: number;
  sentCount: number;
}

export interface NotificationQueryParameters {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  classId?: number;
}

export interface NotificationUserLookupResponse {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface NotificationUserLookupQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}
