using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Grades;

public class GradeStudentRosterItemResponse
{
    public int StudentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public ClassStudentStatus MembershipStatus { get; set; }
    public GradeReportingSummaryResponse Summary { get; set; } = new();
    public List<GradeItemResponse> Items { get; set; } = new();
}
