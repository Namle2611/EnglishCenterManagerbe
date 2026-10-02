using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Quizzes;

public class StudentQuizDetailResponse
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public ClassStatus ClassStatus { get; set; }
    public ClassStudentStatus? StudentMembershipStatus { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DurationMinutes { get; set; }
    public int MaxAttempts { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public QuizStatus Status { get; set; }
    public decimal MaxScore { get; set; }
    public int AttemptCount { get; set; }
    public bool HasActiveAttempt { get; set; }
}
