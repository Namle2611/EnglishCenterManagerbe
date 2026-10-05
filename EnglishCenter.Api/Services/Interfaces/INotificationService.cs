using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Notifications;

namespace EnglishCenter.Api.Services.Interfaces;

public interface INotificationService
{
    Task<PagedResult<NotificationResponse>> GetUserNotificationsAsync(int currentUserId, NotificationQueryParameters query, CancellationToken cancellationToken = default);
    Task<UnreadCountResponse> GetUnreadCountAsync(int currentUserId, CancellationToken cancellationToken = default);
    Task<NotificationResponse> MarkAsReadAsync(int id, int currentUserId, CancellationToken cancellationToken = default);
    Task<BatchReadResponse> MarkAllAsReadAsync(int currentUserId, CancellationToken cancellationToken = default);
    Task<NotificationResponse> CreateDirectNotificationAsync(int currentUserId, CreateNotificationRequest request, CancellationToken cancellationToken = default);
    Task<BatchCreateNotificationResponse> CreateClassBroadcastAsync(int currentUserId, bool isStaffOrAdmin, int classId, CreateClassNotificationRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<NotificationUserLookupResponse>> GetUserLookupAsync(NotificationUserLookupQuery query, CancellationToken cancellationToken = default);
}
