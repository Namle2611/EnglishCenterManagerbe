using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Notifications;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;

namespace EnglishCenter.Api.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repository;

    public NotificationService(INotificationRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<NotificationResponse>> GetUserNotificationsAsync(
        int currentUserId,
        NotificationQueryParameters query,
        CancellationToken cancellationToken = default)
    {
        query.Page = query.Page < 1 ? 1 : query.Page;
        query.PageSize = query.PageSize < 1 ? 10 : Math.Min(query.PageSize, 100);

        return await _repository.GetUserNotificationsAsync(currentUserId, query, cancellationToken);
    }

    public async Task<UnreadCountResponse> GetUnreadCountAsync(
        int currentUserId,
        CancellationToken cancellationToken = default)
    {
        var count = await _repository.GetUnreadCountAsync(currentUserId, cancellationToken);
        return new UnreadCountResponse { UnreadCount = count };
    }

    public async Task<NotificationResponse> MarkAsReadAsync(
        int id,
        int currentUserId,
        CancellationToken cancellationToken = default)
    {
        var notification = await _repository.GetByIdAndReceiverAsync(id, currentUserId, cancellationToken);
        if (notification == null)
        {
            throw new NotFoundException("Notification not found.");
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _repository.SaveChangesAsync(cancellationToken);
        }

        return MapToResponse(notification);
    }

    public async Task<BatchReadResponse> MarkAllAsReadAsync(
        int currentUserId,
        CancellationToken cancellationToken = default)
    {
        var updatedCount = await _repository.MarkAllAsReadAsync(currentUserId, DateTime.UtcNow, cancellationToken);
        return new BatchReadResponse { UpdatedCount = updatedCount };
    }

    public async Task<NotificationResponse> CreateDirectNotificationAsync(
        int currentUserId,
        CreateNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.ReceiverId <= 0)
        {
            throw new ValidationException("ReceiverId must be greater than 0.");
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationException("Title is required.");
        }

        if (request.Title.Trim().Length > 200)
        {
            throw new ValidationException("Title cannot exceed 200 characters.");
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ValidationException("Content is required.");
        }

        var receiverExists = await _repository.UserExistsAsync(request.ReceiverId, cancellationToken);
        if (!receiverExists)
        {
            throw new NotFoundException("Receiver user not found.");
        }

        var notification = new Notification
        {
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            SenderId = currentUserId,
            ReceiverId = request.ReceiverId,
            ClassId = null,
            CreatedAt = DateTime.UtcNow,
            IsRead = false,
            ReadAt = null
        };

        await _repository.AddAsync(notification, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        var created = await _repository.GetByIdAndReceiverAsync(notification.Id, notification.ReceiverId, cancellationToken);
        return MapToResponse(created ?? notification);
    }

    public async Task<BatchCreateNotificationResponse> CreateClassBroadcastAsync(
        int currentUserId,
        bool isStaffOrAdmin,
        int classId,
        CreateClassNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationException("Title is required.");
        }

        if (request.Title.Trim().Length > 200)
        {
            throw new ValidationException("Title cannot exceed 200 characters.");
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ValidationException("Content is required.");
        }

        var courseClass = await _repository.GetClassWithTeacherAndActiveStudentsAsync(classId, cancellationToken);
        if (courseClass == null)
        {
            throw new NotFoundException("Class not found.");
        }

        if (!isStaffOrAdmin)
        {
            if (courseClass.Teacher == null || courseClass.Teacher.UserId != currentUserId)
            {
                throw new ForbiddenException("You are not authorized to broadcast notifications to this class.");
            }
        }

        if (courseClass.Status == ClassStatus.Completed)
        {
            throw new ValidationException("Cannot broadcast notifications to a completed class.");
        }

        if (courseClass.Status == ClassStatus.Cancelled)
        {
            throw new ValidationException("Cannot broadcast notifications to a cancelled class.");
        }

        var activeStudentUserIds = courseClass.ClassStudents
            .Where(cs => cs.Status == ClassStudentStatus.Active)
            .Select(cs => cs.Student.UserId)
            .Distinct()
            .ToList();

        if (activeStudentUserIds.Count == 0)
        {
            return new BatchCreateNotificationResponse
            {
                ClassId = classId,
                SentCount = 0
            };
        }

        var operationUtcNow = DateTime.UtcNow;
        var notifications = activeStudentUserIds.Select(recipientUserId => new Notification
        {
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            SenderId = currentUserId,
            ReceiverId = recipientUserId,
            ClassId = classId,
            CreatedAt = operationUtcNow,
            IsRead = false,
            ReadAt = null
        }).ToList();

        await _repository.AddRangeAsync(notifications, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new BatchCreateNotificationResponse
        {
            ClassId = classId,
            SentCount = notifications.Count
        };
    }

    public async Task<PagedResult<NotificationUserLookupResponse>> GetUserLookupAsync(
        NotificationUserLookupQuery query,
        CancellationToken cancellationToken = default)
    {
        query.Page = query.Page < 1 ? 1 : query.Page;
        query.PageSize = query.PageSize < 1 ? 20 : Math.Min(query.PageSize, 100);

        return await _repository.GetUserLookupAsync(query, cancellationToken);
    }

    private static NotificationResponse MapToResponse(Notification n)
    {
        return new NotificationResponse
        {
            Id = n.Id,
            Title = n.Title,
            Content = n.Content,
            SenderId = n.SenderId,
            SenderName = n.Sender != null ? n.Sender.FullName : string.Empty,
            ClassId = n.ClassId,
            ClassCode = n.Class != null ? n.Class.ClassCode : null,
            CreatedAt = n.CreatedAt,
            IsRead = n.IsRead,
            ReadAt = n.ReadAt
        };
    }
}
