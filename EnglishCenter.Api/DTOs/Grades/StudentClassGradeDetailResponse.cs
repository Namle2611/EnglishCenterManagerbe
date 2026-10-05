using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Grades;

public class StudentClassGradeDetailResponse
{
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public ClassStatus ClassStatus { get; set; }
    public int StudentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public ClassStudentStatus MembershipStatus { get; set; }
    public GradeReportingSummaryResponse Summary { get; set; } = new();
    public List<GradeItemResponse> Items { get; set; } = new();
}
