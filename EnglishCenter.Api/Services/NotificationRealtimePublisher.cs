using EnglishCenter.Api.Hubs;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace EnglishCenter.Api.Services;

public class NotificationRealtimePublisher : INotificationRealtimePublisher
{
    private const string EventName = "NotificationReceived";
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(3);

    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationRealtimePublisher> _logger;

    public NotificationRealtimePublisher(
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationRealtimePublisher> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task PublishNotificationReceivedAsync(int receiverUserId, CancellationToken cancellationToken = default)
    {
        if (receiverUserId <= 0)
        {
            return;
        }

        using var cts = new CancellationTokenSource(DefaultTimeout);
        try
        {
            await _hubContext.Clients.User(receiverUserId.ToString())
                .SendAsync(EventName, cts.Token);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Failed to deliver best-effort realtime event {EventName} to User {UserId}. Exception: {ExceptionType}",
                EventName,
                receiverUserId,
                ex.GetType().Name);
        }
    }

    public async Task PublishNotificationReceivedAsync(IReadOnlyCollection<int> receiverUserIds, CancellationToken cancellationToken = default)
    {
        if (receiverUserIds == null || receiverUserIds.Count == 0)
        {
            return;
        }

        var distinctTargetUserIds = receiverUserIds
            .Where(id => id > 0)
            .Distinct()
            .Select(id => id.ToString())
            .ToList();

        if (distinctTargetUserIds.Count == 0)
        {
            return;
        }

        using var cts = new CancellationTokenSource(DefaultTimeout);
        try
        {
            await _hubContext.Clients.Users(distinctTargetUserIds)
                .SendAsync(EventName, cts.Token);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Failed to deliver best-effort realtime event {EventName} to {Count} User(s). Exception: {ExceptionType}",
                EventName,
                distinctTargetUserIds.Count,
                ex.GetType().Name);
        }
    }
}
