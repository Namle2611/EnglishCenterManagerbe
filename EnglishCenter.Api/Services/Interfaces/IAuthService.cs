using EnglishCenter.Api.DTOs.Auth;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthInternalResult>> LoginAsync(LoginRequest request);
    Task<ApiResponse<AuthInternalResult>> RefreshTokenAsync(string rawRefreshToken);
    Task<ApiResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<ApiResponse> LogoutAsync(int userId, string? rawRefreshToken);
    Task<ApiResponse<CurrentUserResponse>> GetCurrentUserAsync(int userId);
}
