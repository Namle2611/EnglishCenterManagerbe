using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.QuizAttempts;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IQuizAttemptService
{
    Task<PagedResult<QuizAttemptListItemResponse>> GetAttemptsForQuizAsync(
        int quizId,
        QuizAttemptQuery query,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<List<StudentAttemptSummaryResponse>> GetMyAttemptsAsync(
        int quizId,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<(StudentAttemptDetailResponse Response, bool Created)> StartAttemptAsync(
        int quizId,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<object> GetAttemptDetailAsync(
        int attemptId,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<StudentAnswerResponse> SaveAnswerAsync(
        int attemptId,
        int questionId,
        SaveAnswerRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<object> SubmitAttemptAsync(
        int attemptId,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<Dictionary<int, HashSet<int>>> ReconcileClassesStaleAttemptsAsync(
        IReadOnlyCollection<int> classIds,
        DateTime utcNow,
        CancellationToken cancellationToken = default);
}
