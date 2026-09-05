using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Services.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user, IEnumerable<string> roles);
    string GenerateRefreshToken();
    string HashToken(string rawToken);
    DateTime GetAccessTokenExpiration();
    DateTime GetRefreshTokenExpiration();
}
