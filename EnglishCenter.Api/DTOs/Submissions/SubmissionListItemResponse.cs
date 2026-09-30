namespace EnglishCenter.Api.DTOs.Submissions;

public class SubmissionListItemResponse
{
    public int Id { get; set; }
    public int AssignmentId { get; set; }
    public int StudentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public string? Content { get; set; }
    public DateTime SubmittedAt { get; set; }
    public bool IsLate { get; set; }
    public decimal? Score { get; set; }
    public string? Feedback { get; set; }
    public bool IsGraded { get; set; }
}
