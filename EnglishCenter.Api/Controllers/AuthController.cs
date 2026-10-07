using System.Security.Claims;
using EnglishCenter.Api.DTOs.Auth;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private const string RefreshCookieName = "ec_refresh_token";
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;

    public AuthController(IAuthService authService, IWebHostEnvironment environment)
    {
        _authService = authService;
        _environment = environment;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthLoginPolicy")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (!result.Success || result.Data == null)
        {
            return Unauthorized(ApiResponse<LoginResponse>.Fail(result.Message));
        }

        Response.Cookies.Append(RefreshCookieName, result.Data.RawRefreshToken, GetCookieOptions());

        var responseDto = new LoginResponse
        {
            AccessToken = result.Data.AccessToken,
            AccessTokenExpiresAt = result.Data.AccessTokenExpiresAt,
            User = result.Data.User ?? new UserDto()
        };

        return Ok(ApiResponse<LoginResponse>.Ok(responseDto, result.Message));
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthRefreshPolicy")]
    public async Task<IActionResult> RefreshToken()
    {
        if (Request.Headers["X-EC-CSRF"] != "1")
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<RefreshTokenResponse>.Fail("Missing or invalid CSRF protection header."));
        }

        var rawRefreshToken = Request.Cookies[RefreshCookieName];
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            return Unauthorized(ApiResponse<RefreshTokenResponse>.Fail("Refresh token cookie is missing"));
        }

        var result = await _authService.RefreshTokenAsync(rawRefreshToken);
        if (!result.Success || result.Data == null)
        {
            Response.Cookies.Delete(RefreshCookieName, GetDeleteCookieOptions());
            return Unauthorized(ApiResponse<RefreshTokenResponse>.Fail(result.Message));
        }

        Response.Cookies.Append(RefreshCookieName, result.Data.RawRefreshToken, GetCookieOptions());

        var responseDto = new RefreshTokenResponse
        {
            AccessToken = result.Data.AccessToken,
            AccessTokenExpiresAt = result.Data.AccessTokenExpiresAt
        };

        return Ok(ApiResponse<RefreshTokenResponse>.Ok(responseDto, result.Message));
    }

    [HttpPost("change-password")]
    [Authorize]
    [EnableRateLimiting("ChangePasswordPolicy")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Unauthorized."));
        }

        var result = await _authService.ChangePasswordAsync(userId, request);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        if (Request.Headers["X-EC-CSRF"] != "1")
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Fail("Missing or invalid CSRF protection header."));
        }

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Unauthorized."));
        }

        var rawRefreshToken = Request.Cookies[RefreshCookieName];
        var result = ApiResponse.Ok("Logged out successfully.");
        if (!string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            result = await _authService.LogoutAsync(userId, rawRefreshToken);
        }

        Response.Cookies.Delete(RefreshCookieName, GetDeleteCookieOptions());

        return result.Success ? Ok(result) : BadRequest(result);
    }

    private CookieOptions GetCookieOptions()
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth",
            MaxAge = TimeSpan.FromSeconds(604800)
        };
    }

    private CookieOptions GetDeleteCookieOptions()
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth",
            MaxAge = TimeSpan.Zero,
            Expires = DateTimeOffset.UnixEpoch
        };
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized(ApiResponse<CurrentUserResponse>.Fail("Unauthorized."));
        }

        var result = await _authService.GetCurrentUserAsync(userId);
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    [HttpGet("test-admin")]
    [AllowAnonymous]
    public IActionResult TestAdmin()
    {
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        if (User.Identity?.IsAuthenticated != true)
        {
            return Challenge();
        }
        if (!User.IsInRole(RoleNames.Admin))
        {
            return Forbid();
        }

        return Ok(ApiResponse.Ok("Admin authorization passed"));
    }
}
