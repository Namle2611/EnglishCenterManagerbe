using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Grades;

public class StudentGradeSummaryResponse
{
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public ClassStatus ClassStatus { get; set; }
    public ClassStudentStatus MembershipStatus { get; set; }
    public GradeReportingSummaryResponse Summary { get; set; } = new();
}
