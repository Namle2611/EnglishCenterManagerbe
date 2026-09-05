using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class AttendanceRecord
{
    public int Id { get; set; }
    public int AttendanceSessionId { get; set; }
    public int StudentId { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Note { get; set; }

    // Navigation properties
    public AttendanceSession AttendanceSession { get; set; } = null!;
    public Student Student { get; set; } = null!;
}
