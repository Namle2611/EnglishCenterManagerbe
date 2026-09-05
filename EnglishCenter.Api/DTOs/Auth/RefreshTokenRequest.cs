using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.Api.DTOs.Auth;

public class RefreshTokenRequest
{
    [Required(ErrorMessage = "RefreshToken is required.")]
    public string RefreshToken { get; set; } = string.Empty;
}
