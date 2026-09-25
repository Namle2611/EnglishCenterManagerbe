using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Attendances;

public class TeacherClassLookupItemResponse
{
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public ClassStatus Status { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxStudents { get; set; }
    public int EnrolledStudentCount { get; set; }
    public IReadOnlyList<TeacherClassScheduleResponse> Schedules { get; set; } = Array.Empty<TeacherClassScheduleResponse>();
}
