using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Rooms;

public class RoomListItemResponse
{
    public int Id { get; set; }
    public string RoomCode { get; set; } = string.Empty;
    public string? RoomName { get; set; }
    public int Capacity { get; set; }
    public RoomStatus Status { get; set; }
}
