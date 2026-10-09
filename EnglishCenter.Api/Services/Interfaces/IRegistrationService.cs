using EnglishCenter.Api.DTOs.Auth;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Registration;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IRegistrationService
{
    Task<ApiResponse<RegisterResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<VerifyOtpResponse>> VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse> ResendOtpAsync(ResendOtpRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<PagedResult<RegistrationRequestDto>>> GetAdminRequestsAsync(RegistrationRequestQuery query, CancellationToken cancellationToken = default);
    Task<ApiResponse> ApproveRequestAsync(int id, int adminUserId, ApproveRegistrationRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse> RejectRequestAsync(int id, int adminUserId, RejectRegistrationRequest request, CancellationToken cancellationToken = default);
}
