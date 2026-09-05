using EnglishCenter.Api.DTOs.Auth;
using EnglishCenter.Api.DTOs.Common;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<RefreshTokenResponse>> RefreshTokenAsync(RefreshTokenRequest request);
    Task<ApiResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<ApiResponse> LogoutAsync(int userId, string rawRefreshToken);
    Task<ApiResponse<CurrentUserResponse>> GetCurrentUserAsync(int userId);
}
