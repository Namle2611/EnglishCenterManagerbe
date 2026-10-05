import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  BatchCreateNotificationResponse,
  BatchReadResponse,
  CreateClassNotificationRequest,
  CreateNotificationRequest,
  NotificationQueryParameters,
  NotificationResponse,
  NotificationUserLookupQuery,
  NotificationUserLookupResponse,
  UnreadCountResponse
} from '../types/notification.types';

export const notificationService = {
  async getNotifications(
    params: NotificationQueryParameters = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<NotificationResponse>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<NotificationResponse>>>('/notifications', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        isRead: params.isRead !== undefined ? params.isRead : undefined,
        classId: params.classId || undefined
      },
      signal
    });
    return response.data;
  },

  async getUnreadCount(signal?: AbortSignal): Promise<ApiResponse<UnreadCountResponse>> {
    const response = await axiosClient.get<ApiResponse<UnreadCountResponse>>('/notifications/unread-count', {
      signal
    });
    return response.data;
  },

  async markAsRead(id: number, signal?: AbortSignal): Promise<ApiResponse<NotificationResponse>> {
    const response = await axiosClient.put<ApiResponse<NotificationResponse>>(`/notifications/${id}/read`, {}, {
      signal
    });
    return response.data;
  },

  async markAllAsRead(signal?: AbortSignal): Promise<ApiResponse<BatchReadResponse>> {
    const response = await axiosClient.put<ApiResponse<BatchReadResponse>>('/notifications/read-all', {}, {
      signal
    });
    return response.data;
  },

  async createDirectNotification(
    payload: CreateNotificationRequest,
    signal?: AbortSignal
  ): Promise<ApiResponse<NotificationResponse>> {
    const response = await axiosClient.post<ApiResponse<NotificationResponse>>('/notifications', payload, {
      signal
    });
    return response.data;
  },

  async createClassBroadcast(
    classId: number,
    payload: CreateClassNotificationRequest,
    signal?: AbortSignal
  ): Promise<ApiResponse<BatchCreateNotificationResponse>> {
    const response = await axiosClient.post<ApiResponse<BatchCreateNotificationResponse>>(
      `/notifications/classes/${classId}`,
      payload,
      { signal }
    );
    return response.data;
  },

  async getUserLookup(
    params: NotificationUserLookupQuery = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<NotificationUserLookupResponse>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<NotificationUserLookupResponse>>>(
      '/notifications/lookups/users',
      {
        params: {
          search: params.search?.trim() || undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 20
        },
        signal
      }
    );
    return response.data;
  }
};
