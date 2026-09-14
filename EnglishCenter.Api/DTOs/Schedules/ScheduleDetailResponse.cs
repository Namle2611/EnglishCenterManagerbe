using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Schedules;

public class ScheduleDetailResponse
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public ClassStatus ClassStatus { get; set; }
    public DateTime ClassStartDate { get; set; }
    public DateTime ClassEndDate { get; set; }
    public int? TeacherId { get; set; }
    public string? TeacherName { get; set; }
    public int RoomId { get; set; }
    public string RoomCode { get; set; } = string.Empty;
    public string? RoomName { get; set; }
    public RoomStatus RoomStatus { get; set; }
    public int DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}
