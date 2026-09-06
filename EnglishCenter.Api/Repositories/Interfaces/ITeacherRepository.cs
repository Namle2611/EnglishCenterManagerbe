using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Teachers;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface ITeacherRepository
{
    Task<PagedResult<TeacherListItemResponse>> GetPagedAsync(TeacherQuery query, CancellationToken cancellationToken = default);
    Task<Teacher?> GetByIdWithUserAndRolesAsync(int id, bool asNoTracking = true, CancellationToken cancellationToken = default);
    Task<Teacher?> GetByIdWithUserAsync(int id, bool asNoTracking = false, CancellationToken cancellationToken = default);
    Task<bool> TeacherCodeExistsAsync(string teacherCode, CancellationToken cancellationToken = default);
    Task AddAsync(Teacher teacher, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
