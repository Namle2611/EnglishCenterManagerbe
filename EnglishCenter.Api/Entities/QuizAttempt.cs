using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class QuizAttempt
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public int StudentId { get; set; }
    public int AttemptNumber { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public decimal? Score { get; set; }
    public QuizAttemptStatus Status { get; set; }

    // Navigation properties
    public Quiz Quiz { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public ICollection<QuizAnswer> QuizAnswers { get; set; } = new List<QuizAnswer>();
}
