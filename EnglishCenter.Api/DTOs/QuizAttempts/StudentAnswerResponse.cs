namespace EnglishCenter.Api.DTOs.QuizAttempts;

public class StudentAnswerResponse
{
    public int QuestionId { get; set; }
    public int? SelectedOptionId { get; set; }
    public string? TextAnswer { get; set; }
    public DateTime SavedAt { get; set; }
}
