using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Students;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IStudentService
{
    Task<PagedResult<StudentListItemResponse>> GetListAsync(StudentQuery query, CancellationToken cancellationToken = default);
    Task<StudentDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default);
    Task<StudentDetailResponse> CreateAsync(CreateStudentRequest request, CancellationToken cancellationToken = default);
    Task<StudentDetailResponse> UpdateAsync(int id, UpdateStudentRequest request, CancellationToken cancellationToken = default);
    Task<StudentDetailResponse> UpdateStatusAsync(int id, UpdateStudentStatusRequest request, CancellationToken cancellationToken = default);
}
