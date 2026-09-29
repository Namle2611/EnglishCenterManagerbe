using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Sections;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface ISectionService
{
    Task<PagedResult<SectionListItemResponse>> GetListAsync(
        SectionQuery query,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);

    Task<SectionDetailResponse> GetDetailAsync(
        int id,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);

    Task<CourseSyllabusResponse> GetCourseSyllabusAsync(
        int courseId,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);

    Task<SectionDetailResponse> CreateAsync(
        CreateSectionRequest request,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);

    Task<SectionDetailResponse> UpdateAsync(
        int id,
        UpdateSectionRequest request,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        int id,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);

    Task<PagedResult<TeacherCourseLookupItemResponse>> GetTeacherCoursesLookupAsync(
        TeacherCourseLookupQuery query,
        LearningContentActor actor,
        CancellationToken cancellationToken = default);
}
