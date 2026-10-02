using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.QuizAttempts;

public class StudentAttemptSummaryResponse
{
    public int AttemptId { get; set; }
    public int AttemptNumber { get; set; }
    public QuizAttemptStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public decimal? Score { get; set; }
}
