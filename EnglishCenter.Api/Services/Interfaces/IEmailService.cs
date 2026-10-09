namespace EnglishCenter.Api.Services.Interfaces;

public interface IEmailService
{
    Task SendOtpEmailAsync(string toEmail, string fullName, string otp, CancellationToken cancellationToken = default);
}
