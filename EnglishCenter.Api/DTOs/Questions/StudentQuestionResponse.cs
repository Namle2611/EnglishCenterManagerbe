using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Questions;

public class StudentQuestionResponse
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public decimal Score { get; set; }
    public int OrderIndex { get; set; }
    public List<StudentOptionResponse> Options { get; set; } = new();
    public int? SelectedOptionId { get; set; }
    public string? TextAnswer { get; set; }
}
