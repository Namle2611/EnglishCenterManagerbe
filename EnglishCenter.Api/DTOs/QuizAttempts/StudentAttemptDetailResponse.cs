using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.QuizAttempts;

public class StudentAttemptDetailResponse
{
    public int AttemptId { get; set; }
    public int QuizId { get; set; }
    public string QuizTitle { get; set; } = string.Empty;
    public int AttemptNumber { get; set; }
    public DateTime StartedAt { get; set; }
    public int? DurationMinutes { get; set; }
    public DateTime? EffectiveDeadline { get; set; }
    public QuizAttemptStatus Status { get; set; }
    public decimal QuizMaxScore { get; set; }
    public List<StudentQuestionResponse> Questions { get; set; } = new();
}
