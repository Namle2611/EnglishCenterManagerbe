using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Assignments;

public class AssignmentListItemResponse
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public decimal MaxScore { get; set; }
    public AssignmentStatus Status { get; set; }
    public int SubmissionCount { get; set; }
    public bool? HasSubmitted { get; set; }
    public ClassStudentStatus? StudentMembershipStatus { get; set; }
}
