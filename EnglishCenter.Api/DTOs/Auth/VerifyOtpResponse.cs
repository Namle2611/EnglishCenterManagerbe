namespace EnglishCenter.Api.DTOs.Auth;

public class VerifyOtpResponse
{
    public bool IsPendingApproval { get; set; }
    public string Message { get; set; } = string.Empty;
}
