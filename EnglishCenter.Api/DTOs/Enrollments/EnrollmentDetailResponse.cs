using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Enrollments;

public class EnrollmentDetailResponse
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? StudentEmail { get; set; }
    public string? StudentPhone { get; set; }
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public decimal CourseTuitionFee { get; set; }
    public int? ClassId { get; set; }
    public string? ClassCode { get; set; }
    public ClassStatus? ClassStatus { get; set; }
    public ClassStudentStatus? ClassStudentStatus { get; set; }
    public DateTime? ClassJoinedAt { get; set; }
    public decimal TuitionAmount { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public EnrollmentStatus Status { get; set; }
    public int? ConfirmedBy { get; set; }
    public string? ConfirmedByName { get; set; }
    public DateTime? ConfirmedAt { get; set; }
}
