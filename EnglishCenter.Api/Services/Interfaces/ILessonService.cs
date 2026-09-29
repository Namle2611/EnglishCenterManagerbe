using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Lessons;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface ILessonService
{
    Task<PagedResult<LessonListItemResponse>> GetListAsync(
        LessonQuery query,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);

    Task<LessonDetailResponse> GetDetailAsync(
        int id,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);

    Task<LessonDetailResponse> CreateAsync(
        CreateLessonRequest request,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);

    Task<LessonDetailResponse> UpdateAsync(
        int id,
        UpdateLessonRequest request,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);

    Task<LessonDetailResponse> UpdateStatusAsync(
        int id,
        UpdateLessonStatusRequest request,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        int id,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);
}
