using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Sections;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface ISectionRepository
{
    Task<PagedResult<SectionListItemResponse>> GetPagedAsync(
        SectionQuery query,
        List<int>? allowedCourseIds,
        CancellationToken cancellationToken = default);

    Task<Section?> GetByIdAsync(
        int id,
        bool asNoTracking = true,
        CancellationToken cancellationToken = default);

    Task<SectionDetailResponse?> GetDetailByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<Course?> GetCourseWithSyllabusAsync(
        int courseId,
        CancellationToken cancellationToken = default);

    Task<bool> CourseExistsAsync(
        int courseId,
        CancellationToken cancellationToken = default);

    Task<bool> TitleExistsAsync(
        int courseId,
        string normalizedTitle,
        int? excludeId = null,
        CancellationToken cancellationToken = default);

    Task<int> GetMaxOrderIndexAsync(
        int courseId,
        CancellationToken cancellationToken = default);

    Task<bool> HasLessonsAsync(
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

    Task<PagedResult<TeacherCourseLookupItemResponse>> GetTeacherCoursesLookupAsync(
        TeacherCourseLookupQuery query,
        int teacherUserId,
        CancellationToken cancellationToken = default);

    Task AddAsync(Section section, CancellationToken cancellationToken = default);
    void Remove(Section section);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
