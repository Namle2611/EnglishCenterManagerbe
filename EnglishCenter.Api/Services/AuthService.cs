using System.Data;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Auth;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasherService _passwordHasher;

    public AuthService(
        AppDbContext context,
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ITokenService tokenService,
        IPasswordHasherService passwordHasher)
    {
        _context = context;
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
    }

    public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request)
    {
        var normalizedEmail = request.Email.Trim();
        var user = await _userRepository.GetWithRolesByEmailAsync(normalizedEmail);

        if (user == null || !_passwordHasher.VerifyPassword(user, user.PasswordHash, request.Password))
        {
            return ApiResponse<LoginResponse>.Fail("Invalid email or password");
        }

        if (!user.IsActive)
        {
            return ApiResponse<LoginResponse>.Fail("Account is inactive");
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();
        var tokenHash = _tokenService.HashToken(rawRefreshToken);
        var accessExpiresAt = _tokenService.GetAccessTokenExpiration();
        var refreshExpiresAt = _tokenService.GetRefreshTokenExpiration();

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = refreshExpiresAt
        };

        await _refreshTokenRepository.AddAsync(refreshTokenEntity);

        var response = new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            AccessTokenExpiresAt = accessExpiresAt,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Roles = roles
            }
        };

        return ApiResponse<LoginResponse>.Ok(response, "Login successful");
    }

    public async Task<ApiResponse<RefreshTokenResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var tokenHash = _tokenService.HashToken(request.RefreshToken);

        await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            var storedToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

            if (storedToken == null || storedToken.RevokedAt != null || storedToken.ExpiresAt <= DateTime.UtcNow || !storedToken.User.IsActive)
            {
                await transaction.RollbackAsync();
                return ApiResponse<RefreshTokenResponse>.Fail("Invalid or expired refresh token");
            }

            // Revoke old token
            storedToken.RevokedAt = DateTime.UtcNow;

            // Generate new token pair
            var roles = storedToken.User.UserRoles.Select(ur => ur.Role.Name).ToList();
            var newAccessToken = _tokenService.GenerateAccessToken(storedToken.User, roles);
            var newRawRefreshToken = _tokenService.GenerateRefreshToken();
            var newTokenHash = _tokenService.HashToken(newRawRefreshToken);
            var accessExpiresAt = _tokenService.GetAccessTokenExpiration();
            var refreshExpiresAt = _tokenService.GetRefreshTokenExpiration();

            var newRefreshTokenEntity = new RefreshToken
            {
                UserId = storedToken.UserId,
                TokenHash = newTokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = refreshExpiresAt
            };

            await _context.RefreshTokens.AddAsync(newRefreshTokenEntity);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var response = new RefreshTokenResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRawRefreshToken,
                AccessTokenExpiresAt = accessExpiresAt
            };

            return ApiResponse<RefreshTokenResponse>.Ok(response, "Token refreshed successfully");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<ApiResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        if (request.NewPassword != request.ConfirmNewPassword)
        {
            return ApiResponse.Fail("Confirmation password does not match.");
        }

        if (request.NewPassword == request.CurrentPassword)
        {
            return ApiResponse.Fail("New password must be different from current password.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse.Fail("User not found.");
            }

            if (!_passwordHasher.VerifyPassword(user, user.PasswordHash, request.CurrentPassword))
            {
                return ApiResponse.Fail("Current password is incorrect.");
            }

            user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            // Revoke all active refresh tokens for user
            await _refreshTokenRepository.RevokeAllForUserAsync(userId);

            await transaction.CommitAsync();
            return ApiResponse.Ok("Password changed successfully.");
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<ApiResponse> LogoutAsync(int userId, string rawRefreshToken)
    {
        var tokenHash = _tokenService.HashToken(rawRefreshToken);
        var storedToken = await _refreshTokenRepository.GetByHashAsync(tokenHash);

        if (storedToken == null)
        {
            return ApiResponse.Fail("Invalid refresh token.");
        }

        if (storedToken.UserId != userId)
        {
            return ApiResponse.Fail("Forbidden.");
        }

        if (storedToken.RevokedAt == null)
        {
            await _refreshTokenRepository.RevokeAsync(storedToken);
        }

        return ApiResponse.Ok("Logged out successfully.");
    }

    public async Task<ApiResponse<CurrentUserResponse>> GetCurrentUserAsync(int userId)
    {
        var user = await _userRepository.GetWithRolesAsync(userId);
        if (user == null)
        {
            return ApiResponse<CurrentUserResponse>.Fail("User not found.");
        }

        var response = new CurrentUserResponse
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            AvatarUrl = user.AvatarUrl,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            IsActive = user.IsActive
        };

        return ApiResponse<CurrentUserResponse>.Ok(response);
    }
}
