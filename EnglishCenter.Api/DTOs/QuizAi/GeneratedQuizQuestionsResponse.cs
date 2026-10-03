using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.QuizAi;

public class GeneratedQuizQuestionsResponse
{
    public int QuizId { get; set; }
    public QuizAiSourceType SourceType { get; set; }
    public string SourceSummary { get; set; } = string.Empty;
    public List<GeneratedQuizQuestionItemResponse> Questions { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}
