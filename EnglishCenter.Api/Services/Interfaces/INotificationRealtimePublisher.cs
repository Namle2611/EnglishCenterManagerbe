namespace EnglishCenter.Api.Services.Interfaces;

public interface INotificationRealtimePublisher
{
    Task PublishNotificationReceivedAsync(int receiverUserId, CancellationToken cancellationToken = default);
    Task PublishNotificationReceivedAsync(IReadOnlyCollection<int> receiverUserIds, CancellationToken cancellationToken = default);
}
