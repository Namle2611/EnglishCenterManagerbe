using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Assignments;

public class TeacherAssignmentClassLookupItemResponse
{
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public ClassStatus Status { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
