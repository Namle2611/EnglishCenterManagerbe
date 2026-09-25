using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Attendances;

public class AttendanceRosterItemResponse
{
    public int StudentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public ClassStudentStatus MembershipStatus { get; set; }
    public DateTime JoinedAt { get; set; }
    public bool CanCreate { get; set; }
    public string? IneligibilityReason { get; set; }
    public int? AttendanceId { get; set; }
    public AttendanceStatus? Status { get; set; }
    public string? Note { get; set; }
}
