namespace EnglishCenter.Api.Entities;

public class Schedule
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public int RoomId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    // Navigation properties
    public CourseClass Class { get; set; } = null!;
    public Room Room { get; set; } = null!;
}
