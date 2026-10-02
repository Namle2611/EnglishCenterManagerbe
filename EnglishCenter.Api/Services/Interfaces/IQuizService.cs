using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Quizzes;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IQuizService
{
    Task<PagedResult<QuizListItemResponse>> GetListAsync(
        QuizQuery query,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<PagedResult<TeacherQuizClassLookupItemResponse>> GetTeacherClassLookupAsync(
        TeacherQuizClassLookupQuery query,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<QuizDetailResponse> GetDetailAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<StudentQuizDetailResponse> GetStudentDetailAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<QuizDetailResponse> CreateAsync(
        CreateQuizRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<QuizDetailResponse> UpdateAsync(
        int id,
        UpdateQuizRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<QuizDetailResponse> PublishAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<QuizDetailResponse> CloseAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default);

    Task<QuizDetailResponse> ReopenAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default);
}
