using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Notifications;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly AppDbContext _context;

    public NotificationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<NotificationResponse>> GetUserNotificationsAsync(
        int userId,
        NotificationQueryParameters query,
        CancellationToken cancellationToken = default)
    {
        var queryable = _context.Notifications
            .AsNoTracking()
            .Where(n => n.ReceiverId == userId);

        if (query.IsRead.HasValue)
        {
            queryable = queryable.Where(n => n.IsRead == query.IsRead.Value);
        }

        if (query.ClassId.HasValue)
        {
            queryable = queryable.Where(n => n.ClassId == query.ClassId.Value);
        }

        var totalItems = await queryable.CountAsync(cancellationToken);

        var items = await queryable
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(n => new NotificationResponse
            {
                Id = n.Id,
                Title = n.Title,
                Content = n.Content,
                SenderId = n.SenderId,
                SenderName = n.Sender.FullName,
                ClassId = n.ClassId,
                ClassCode = n.Class != null ? n.Class.ClassCode : null,
                CreatedAt = n.CreatedAt,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<NotificationResponse>(items, totalItems, query.Page, query.PageSize);
    }

    public async Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Notifications
            .CountAsync(n => n.ReceiverId == userId && !n.IsRead, cancellationToken);
    }

    public async Task<Notification?> GetByIdAndReceiverAsync(int id, int receiverId, CancellationToken cancellationToken = default)
    {
        return await _context.Notifications
            .Include(n => n.Sender)
            .Include(n => n.Class)
            .FirstOrDefaultAsync(n => n.Id == id && n.ReceiverId == receiverId, cancellationToken);
    }

    public async Task<int> MarkAllAsReadAsync(int receiverId, DateTime readAt, CancellationToken cancellationToken = default)
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => n.ReceiverId == receiverId && !n.IsRead)
            .ToListAsync(cancellationToken);

        if (unreadNotifications.Count == 0)
        {
            return 0;
        }

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt = readAt;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return unreadNotifications.Count;
    }

    public async Task<bool> UserExistsAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Users.AnyAsync(u => u.Id == userId, cancellationToken);
    }

    public async Task<CourseClass?> GetClassWithTeacherAndActiveStudentsAsync(int classId, CancellationToken cancellationToken = default)
    {
        return await _context.Classes
            .Include(c => c.Teacher)
            .Include(c => c.ClassStudents.Where(cs => cs.Status == ClassStudentStatus.Active))
                .ThenInclude(cs => cs.Student)
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);
    }

    public async Task AddAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        await _context.Notifications.AddAsync(notification, cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<Notification> notifications, CancellationToken cancellationToken = default)
    {
        await _context.Notifications.AddRangeAsync(notifications, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedResult<NotificationUserLookupResponse>> GetUserLookupAsync(
        NotificationUserLookupQuery query,
        CancellationToken cancellationToken = default)
    {
        var queryable = _context.Users
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            queryable = queryable.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));
        }

        var totalItems = await queryable.CountAsync(cancellationToken);

        var items = await queryable
            .OrderBy(u => u.FullName)
            .ThenBy(u => u.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(u => new NotificationUserLookupResponse
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? string.Empty,
                IsActive = u.IsActive
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<NotificationUserLookupResponse>(items, totalItems, query.Page, query.PageSize);
    }
}
