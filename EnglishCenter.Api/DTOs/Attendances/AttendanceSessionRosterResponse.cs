namespace EnglishCenter.Api.DTOs.Attendances;

public class AttendanceSessionRosterResponse
{
    public int? AttendanceSessionId { get; set; }
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int? TeacherId { get; set; }
    public string? TeacherName { get; set; }
    public DateOnly SessionDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public int? CreatedByTeacherId { get; set; }
    public string? CreatedByTeacherName { get; set; }
    public IReadOnlyList<AttendanceRosterItemResponse> Students { get; set; } = Array.Empty<AttendanceRosterItemResponse>();
}
