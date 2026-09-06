using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Teachers;

namespace EnglishCenter.Api.Services.Interfaces;

public interface ITeacherService
{
    Task<PagedResult<TeacherListItemResponse>> GetListAsync(TeacherQuery query, CancellationToken cancellationToken = default);
    Task<TeacherDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default);
    Task<TeacherDetailResponse> CreateAsync(CreateTeacherRequest request, CancellationToken cancellationToken = default);
    Task<TeacherDetailResponse> UpdateAsync(int id, UpdateTeacherRequest request, CancellationToken cancellationToken = default);
    Task<TeacherDetailResponse> UpdateStatusAsync(int id, UpdateTeacherStatusRequest request, CancellationToken cancellationToken = default);
}
