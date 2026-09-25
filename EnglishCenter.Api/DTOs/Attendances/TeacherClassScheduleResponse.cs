namespace EnglishCenter.Api.DTOs.Attendances;

public class TeacherClassScheduleResponse
{
    public int ScheduleId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int RoomId { get; set; }
    public string RoomCode { get; set; } = string.Empty;
    public string? RoomName { get; set; }
}
