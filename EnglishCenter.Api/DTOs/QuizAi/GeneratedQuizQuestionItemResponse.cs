using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.QuizAi;

public class GeneratedQuizQuestionItemResponse
{
    public string TempId { get; set; } = Guid.NewGuid().ToString("N");
    public string Content { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public decimal Score { get; set; }
    public int OrderIndex { get; set; }
    public List<GeneratedQuizOptionItemResponse>? Options { get; set; }
    public string? CorrectTextAnswer { get; set; }
    public string? Explanation { get; set; }
}
