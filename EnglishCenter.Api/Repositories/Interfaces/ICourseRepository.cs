using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Courses;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface ICourseRepository
{
    Task<PagedResult<CourseListItemResponse>> GetPagedAsync(CourseQuery query, CancellationToken cancellationToken = default);
    Task<Course?> GetByIdAsync(int id, bool asNoTracking = false, CancellationToken cancellationToken = default);
    Task<bool> CourseCodeExistsAsync(string courseCode, CancellationToken cancellationToken = default);
    Task AddAsync(Course course, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
