using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.QuizAttempts;

public class StudentQuestionReviewItem
{
    public int QuestionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public decimal Score { get; set; }
    public int OrderIndex { get; set; }
    public int? SelectedOptionId { get; set; }
    public string? TextAnswer { get; set; }
    public bool? IsCorrect { get; set; }
    public decimal ScoreEarned { get; set; }
    public string? CorrectTextAnswer { get; set; }
    public List<QuestionOptionResponse> Options { get; set; } = new();
}

public class StudentAttemptReviewResponse
{
    public int AttemptId { get; set; }
    public int QuizId { get; set; }
    public string QuizTitle { get; set; } = string.Empty;
    public int AttemptNumber { get; set; }
    public QuizAttemptStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public decimal TotalScore { get; set; }
    public decimal QuizMaxScore { get; set; }
    public List<StudentQuestionReviewItem> Questions { get; set; } = new();
}
