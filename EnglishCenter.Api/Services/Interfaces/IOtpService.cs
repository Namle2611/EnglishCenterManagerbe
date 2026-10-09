namespace EnglishCenter.Api.Services.Interfaces;

public interface IOtpService
{
    string GenerateOtp(string email, string? currentOtpHash = null);
    string HashOtp(string email, string otp);
    bool VerifyOtp(string email, string candidateOtp, string storedHash);
}
