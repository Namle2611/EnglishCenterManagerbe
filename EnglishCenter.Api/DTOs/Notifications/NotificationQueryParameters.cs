using EnglishCenter.Api.DTOs.Common;

namespace EnglishCenter.Api.DTOs.Notifications;

public class NotificationQueryParameters : PaginationQuery
{
    public bool? IsRead { get; set; }
    public int? ClassId { get; set; }
}
