using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Notifications;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface INotificationRepository
{
    Task<PagedResult<NotificationResponse>> GetUserNotificationsAsync(int userId, NotificationQueryParameters query, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default);
    Task<Notification?> GetByIdAndReceiverAsync(int id, int receiverId, CancellationToken cancellationToken = default);
    Task<int> MarkAllAsReadAsync(int receiverId, DateTime readAt, CancellationToken cancellationToken = default);
    Task<bool> UserExistsAsync(int userId, CancellationToken cancellationToken = default);
    Task<CourseClass?> GetClassWithTeacherAndActiveStudentsAsync(int classId, CancellationToken cancellationToken = default);
    Task AddAsync(Notification notification, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<Notification> notifications, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<NotificationUserLookupResponse>> GetUserLookupAsync(NotificationUserLookupQuery query, CancellationToken cancellationToken = default);
}
