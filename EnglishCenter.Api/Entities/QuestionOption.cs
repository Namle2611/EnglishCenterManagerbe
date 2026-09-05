namespace EnglishCenter.Api.Entities;

public class QuestionOption
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }

    // Navigation properties
    public Question Question { get; set; } = null!;
    public ICollection<QuizAnswer> QuizAnswers { get; set; } = new List<QuizAnswer>();
}
