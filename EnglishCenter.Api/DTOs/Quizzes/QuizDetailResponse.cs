using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Quizzes;

public class QuizDetailResponse
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public ClassStatus ClassStatus { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DurationMinutes { get; set; }
    public int MaxAttempts { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public QuizStatus Status { get; set; }
    public decimal MaxScore { get; set; }
    public int QuestionCount { get; set; }
    public int AttemptCount { get; set; }
    public List<QuestionManagementResponse> Questions { get; set; } = new();
}
