using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Classes;

public class ClassListItemResponse
{
    public int Id { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int? TeacherId { get; set; }
    public string? TeacherCode { get; set; }
    public string? TeacherName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxStudents { get; set; }
    public ClassStatus Status { get; set; }
}
