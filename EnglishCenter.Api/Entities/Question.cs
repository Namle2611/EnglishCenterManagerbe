using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class Question
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public string? CorrectTextAnswer { get; set; }
    public decimal Score { get; set; }
    public int OrderIndex { get; set; }

    // Navigation properties
    public Quiz Quiz { get; set; } = null!;
    public ICollection<QuestionOption> QuestionOptions { get; set; } = new List<QuestionOption>();
    public ICollection<QuizAnswer> QuizAnswers { get; set; } = new List<QuizAnswer>();
}
