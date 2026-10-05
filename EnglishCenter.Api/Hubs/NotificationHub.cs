using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EnglishCenter.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    // Realtime notification channel: server-to-client push only.
    // Exactly zero client-invokable business mutation methods.
}
