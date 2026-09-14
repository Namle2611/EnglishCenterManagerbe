using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Enrollments;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IEnrollmentService
{
    Task<PagedResult<EnrollmentListItemResponse>> GetListAsync(EnrollmentQuery query, CancellationToken cancellationToken = default);
    Task<EnrollmentDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default);
    Task<EnrollmentDetailResponse> CreateAsync(CreateEnrollmentRequest request, CancellationToken cancellationToken = default);
    Task<EnrollmentDetailResponse> UpdateAsync(int id, UpdateEnrollmentRequest request, CancellationToken cancellationToken = default);
    Task<EnrollmentDetailResponse> UpdateStatusAsync(int id, UpdateEnrollmentStatusRequest request, int currentUserId, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
