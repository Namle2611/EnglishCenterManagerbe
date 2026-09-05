namespace EnglishCenter.Api.Entities;

public class AttendanceSession
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public DateTime SessionDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public int CreatedBy { get; set; }

    // Navigation properties
    public CourseClass Class { get; set; } = null!;
    public Teacher CreatedByTeacher { get; set; } = null!;
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
}
