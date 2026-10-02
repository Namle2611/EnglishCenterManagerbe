using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.QuizAttempts;

public class StudentSubmittedAnswerSummary
{
    public int QuestionId { get; set; }
    public int? SelectedOptionId { get; set; }
    public string? TextAnswer { get; set; }
}

public class StudentOpenQuizResultResponse
{
    public int AttemptId { get; set; }
    public int QuizId { get; set; }
    public string QuizTitle { get; set; } = string.Empty;
    public int AttemptNumber { get; set; }
    public QuizAttemptStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public decimal? TotalScore { get; set; } // Strictly null while open
    public decimal QuizMaxScore { get; set; }
    public int QuestionCount { get; set; }
    public List<StudentSubmittedAnswerSummary> SubmittedAnswers { get; set; } = new();
}
