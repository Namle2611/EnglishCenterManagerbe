using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Lessons;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface ILessonRepository
{
    Task<PagedResult<LessonListItemResponse>> GetPagedAsync(
        LessonQuery query,
        List<int>? allowedCourseIds,
        CancellationToken cancellationToken = default);

    Task<Lesson?> GetByIdAsync(
        int id,
        bool asNoTracking = true,
        CancellationToken cancellationToken = default);

    Task<LessonDetailResponse?> GetDetailByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<bool> SectionExistsAsync(
        int sectionId,
        CancellationToken cancellationToken = default);

    Task<Section?> GetSectionWithCourseAsync(
        int sectionId,
        CancellationToken cancellationToken = default);

    Task<bool> TitleExistsAsync(
        int sectionId,
        string normalizedTitle,
        int? excludeId = null,
        CancellationToken cancellationToken = default);

    Task<int> GetMaxOrderIndexAsync(
        int sectionId,
        CancellationToken cancellationToken = default);

    Task<List<int>> GetTeacherAuthorizedCourseIdsAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<bool> IsTeacherAuthorizedForCourseAsync(
        int userId,
        int courseId,
        CancellationToken cancellationToken = default);

    Task<bool> IsActiveTeacherAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task AddAsync(Lesson lesson, CancellationToken cancellationToken = default);
    void Remove(Lesson lesson);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
