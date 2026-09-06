using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Courses;

namespace EnglishCenter.Api.Services.Interfaces;

public interface ICourseService
{
    Task<PagedResult<CourseListItemResponse>> GetListAsync(CourseQuery query, CancellationToken cancellationToken = default);
    Task<CourseDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default);
    Task<CourseDetailResponse> CreateAsync(CreateCourseRequest request, CancellationToken cancellationToken = default);
    Task<CourseDetailResponse> UpdateAsync(int id, UpdateCourseRequest request, CancellationToken cancellationToken = default);
    Task<CourseDetailResponse> UpdateStatusAsync(int id, UpdateCourseStatusRequest request, CancellationToken cancellationToken = default);
}
