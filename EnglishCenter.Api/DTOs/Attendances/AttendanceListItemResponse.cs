using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Attendances;

public class AttendanceListItemResponse
{
    public int Id { get; set; }
    public int AttendanceSessionId { get; set; }
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int? TeacherId { get; set; }
    public string? TeacherName { get; set; }
    public DateOnly SessionDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public int StudentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public AttendanceStatus Status { get; set; }
    public string? Note { get; set; }
}
