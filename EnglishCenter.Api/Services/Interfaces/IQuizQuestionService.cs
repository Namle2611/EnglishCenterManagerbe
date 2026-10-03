using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.DTOs.QuizAi;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IQuizQuestionService
{
    Task<List<QuestionManagementResponse>> GetQuestionsAsync(
        int quizId,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<QuestionManagementResponse> CreateAsync(
        int quizId,
        CreateQuestionRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<List<QuestionManagementResponse>> CreateBulkAsync(
        int quizId,
        List<ApplyGeneratedQuestionItemRequest> questions,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<QuestionManagementResponse> UpdateAsync(
        int quizId,
        int questionId,
        UpdateQuestionRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        int quizId,
        int questionId,
        QuizActor actor,
        CancellationToken cancellationToken = default);
}
