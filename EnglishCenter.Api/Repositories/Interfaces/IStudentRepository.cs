using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Students;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IStudentRepository
{
    Task<PagedResult<StudentListItemResponse>> GetPagedAsync(StudentQuery query, CancellationToken cancellationToken = default);
    Task<Student?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Student?> GetByIdWithUserAndRolesAsync(int id, bool asNoTracking = false, CancellationToken cancellationToken = default);
    Task<bool> StudentCodeExistsAsync(string studentCode, CancellationToken cancellationToken = default);
    Task AddAsync(Student student, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
