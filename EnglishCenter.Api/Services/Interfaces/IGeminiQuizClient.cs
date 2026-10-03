using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Services.Interfaces;

public class GeminiGeneratePromptContext
{
    public QuizAiSourceType SourceType { get; set; }
    public string SourceText { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
    public List<QuestionType> QuestionTypes { get; set; } = new();
    public QuizAiDifficulty Difficulty { get; set; }
    public QuizAiLanguage Language { get; set; }
    public string? AdditionalInstructions { get; set; }
}

public class GeminiGeneratedQuestionRawItem
{
    public string Content { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public List<GeminiGeneratedOptionRawItem>? Options { get; set; }
    public string? CorrectTextAnswer { get; set; }
    public string? Explanation { get; set; }
}

public class GeminiGeneratedOptionRawItem
{
    public string Content { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class GeminiGenerationResult
{
    public bool IsSuccess { get; set; }
    public bool IsSafetyBlocked { get; set; }
    public bool IsTruncated { get; set; }
    public bool IsTransientError { get; set; }
    public bool IsAuthError { get; set; }
    public string? ErrorMessage { get; set; }
    public List<GeminiGeneratedQuestionRawItem> Questions { get; set; } = new();
    public int ProviderCallsMade { get; set; } = 1;
}

public interface IGeminiQuizClient
{
    Task<GeminiGenerationResult> GenerateQuestionsAsync(
        GeminiGeneratePromptContext context,
        CancellationToken cancellationToken = default);
}
