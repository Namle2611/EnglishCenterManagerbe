using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.DTOs.QuizAi;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IQuizAiService
{
    Task<GeneratedQuizQuestionsResponse> GenerateQuestionsAsync(
        int quizId,
        GenerateQuizQuestionsRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<List<QuestionManagementResponse>> ApplyQuestionsAsync(
        int quizId,
        ApplyGeneratedQuestionsRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default);
}
