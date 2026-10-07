using EnglishCenter.Api.DTOs.Auth;

namespace EnglishCenter.Api.Services.Models;

public class AuthInternalResult
{
    public string AccessToken { get; set; } = string.Empty;
    public string RawRefreshToken { get; set; } = string.Empty;
    public DateTime AccessTokenExpiresAt { get; set; }
    public UserDto? User { get; set; }
}
