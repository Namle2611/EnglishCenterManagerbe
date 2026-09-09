using EnglishCenter.Api.DTOs.Classes;
using EnglishCenter.Api.DTOs.Common;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IClassService
{
    Task<PagedResult<ClassListItemResponse>> GetListAsync(ClassQuery query, CancellationToken cancellationToken = default);
    Task<PagedResult<TeacherLookupItemResponse>> GetTeacherLookupAsync(TeacherLookupQuery query, CancellationToken cancellationToken = default);
    Task<ClassDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default);
    Task<ClassDetailResponse> CreateAsync(CreateClassRequest request, CancellationToken cancellationToken = default);
    Task<ClassDetailResponse> UpdateAsync(int id, UpdateClassRequest request, CancellationToken cancellationToken = default);
    Task<ClassDetailResponse> UpdateStatusAsync(int id, UpdateClassStatusRequest request, CancellationToken cancellationToken = default);
}
