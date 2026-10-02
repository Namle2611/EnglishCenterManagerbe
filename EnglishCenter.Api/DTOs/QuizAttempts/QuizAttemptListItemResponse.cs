using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.QuizAttempts;

public class QuizAttemptListItemResponse
{
    public int AttemptId { get; set; }
    public int QuizId { get; set; }
    public int StudentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public int AttemptNumber { get; set; }
    public QuizAttemptStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public decimal? Score { get; set; }
    public decimal QuizMaxScore { get; set; }
}
