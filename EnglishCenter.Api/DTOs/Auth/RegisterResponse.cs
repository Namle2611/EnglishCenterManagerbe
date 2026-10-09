namespace EnglishCenter.Api.DTOs.Auth;

public class RegisterResponse
{
    public string Email { get; set; } = string.Empty;
    public string RequestedRole { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
