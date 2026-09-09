using EnglishCenter.Api.DTOs.Classes;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IClassRepository
{
    Task<PagedResult<ClassListItemResponse>> GetPagedAsync(ClassQuery query, CancellationToken cancellationToken = default);
    Task<ClassDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<CourseClass?> GetByIdTrackedAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ClassCodeExistsAsync(string classCode, CancellationToken cancellationToken = default);
    Task<bool> CourseExistsAsync(int courseId, CancellationToken cancellationToken = default);
    Task<bool> TeacherExistsAsync(int teacherId, CancellationToken cancellationToken = default);
    Task AddAsync(CourseClass courseClass, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
