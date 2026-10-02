using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Questions;

public class QuestionManagementResponse
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public string? CorrectTextAnswer { get; set; }
    public decimal Score { get; set; }
    public int OrderIndex { get; set; }
    public List<QuestionOptionResponse> Options { get; set; } = new();
}
