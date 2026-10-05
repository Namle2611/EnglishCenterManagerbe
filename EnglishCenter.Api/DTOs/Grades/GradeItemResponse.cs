using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Grades;

public class GradeItemResponse
{
    public GradeSourceType SourceType { get; set; }
    public int SourceId { get; set; }
    public int? SubmissionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public GradeItemStatus Status { get; set; }
    public string? SourceStatus { get; set; }
    public decimal? RawScore { get; set; }
    public decimal MaxScore { get; set; }
    public decimal? Percentage { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? Feedback { get; set; }
}
