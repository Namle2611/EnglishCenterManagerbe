using System.Security.Claims;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Notifications;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationResponse>>>> GetNotifications(
        [FromQuery] NotificationQueryParameters query,
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.GetUserNotificationsAsync(GetUserId(), query, cancellationToken);
        return Ok(ApiResponse<PagedResult<NotificationResponse>>.Ok(result, "Notifications retrieved successfully."));
    }

    [HttpGet("unread-count")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UnreadCountResponse>>> GetUnreadCount(
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.GetUnreadCountAsync(GetUserId(), cancellationToken);
        return Ok(ApiResponse<UnreadCountResponse>.Ok(result, "Unread count retrieved successfully."));
    }

    [HttpPut("{id:int}/read")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<NotificationResponse>>> MarkAsRead(
        [FromRoute] int id,
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.MarkAsReadAsync(id, GetUserId(), cancellationToken);
        return Ok(ApiResponse<NotificationResponse>.Ok(result, "Notification marked as read."));
    }

    [HttpPut("read-all")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<BatchReadResponse>>> MarkAllAsRead(
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.MarkAllAsReadAsync(GetUserId(), cancellationToken);
        return Ok(ApiResponse<BatchReadResponse>.Ok(result, "All notifications marked as read."));
    }

    [HttpPost]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Staff}")]
    public async Task<ActionResult<ApiResponse<NotificationResponse>>> CreateDirectNotification(
        [FromBody] CreateNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.CreateDirectNotificationAsync(GetUserId(), request, cancellationToken);
        return CreatedAtAction(nameof(GetNotifications), new { id = result.Id }, ApiResponse<NotificationResponse>.Ok(result, "Notification sent successfully."));
    }

    [HttpPost("classes/{classId:int}")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Staff},{RoleNames.Teacher}")]
    public async Task<ActionResult<ApiResponse<BatchCreateNotificationResponse>>> CreateClassBroadcast(
        [FromRoute] int classId,
        [FromBody] CreateClassNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var isStaffOrAdmin = User.IsInRole(RoleNames.Admin) || User.IsInRole(RoleNames.Staff);
        var result = await _notificationService.CreateClassBroadcastAsync(GetUserId(), isStaffOrAdmin, classId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<BatchCreateNotificationResponse>.Ok(result, "Class notification broadcast sent successfully."));
    }

    [HttpGet("lookups/users")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.Staff}")]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationUserLookupResponse>>>> GetUserLookup(
        [FromQuery] NotificationUserLookupQuery query,
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.GetUserLookupAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<NotificationUserLookupResponse>>.Ok(result, "Users retrieved successfully."));
    }

    private int GetUserId()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            throw new UnauthorizedAccessException("Unauthorized.");
        }
        return userId;
    }
}
