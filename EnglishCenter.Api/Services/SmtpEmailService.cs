using System.Net;
using System.Net.Mail;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EnglishCenter.Api.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendOtpEmailAsync(string toEmail, string fullName, string otp, CancellationToken cancellationToken = default)
    {
        var host = _config["Email:Host"];
        var port = _config.GetValue<int>("Email:Port", 587);
        var fromAddress = _config["Email:FromAddress"] ?? "noreply@englishcenter.edu.vn";
        var fromName = _config["Email:FromName"] ?? "English Center Manager";
        var username = _config["Email:Username"];
        var password = _config["Email:Password"];
        var enableSsl = _config.GetValue<bool>("Email:EnableSsl", true);

        if (string.IsNullOrWhiteSpace(host) || (host.Equals("localhost", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(username)))
        {
            _logger.LogWarning("Email delivery failed: SMTP host/credentials are not configured.");
            throw new InvalidOperationException("Email provider is not configured. Please configure SMTP settings or environment variables.");
        }

        try
        {
            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl
            };

            if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
            {
                client.Credentials = new NetworkCredential(username, password);
            }

            var subject = "[English Center Manager] Mã xác thực đăng ký tài khoản (OTP)";
            var body = $@"Xin chào {fullName},

Mã xác thực đăng ký tài khoản của bạn tại English Center Manager là:

    {otp}

Mã này có hiệu lực trong vòng 5 phút.
Tuyệt đối KHÔNG chia sẻ mã này cho bất kỳ ai để đảm bảo an toàn cho tài khoản của bạn.

Trân trọng,
English Center Manager Team";

            using var message = new MailMessage
            {
                From = new MailAddress(fromAddress, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };
            message.To.Add(toEmail);

            await client.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("Successfully sent OTP email to recipient: {Recipient}", toEmail);
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            _logger.LogError(ex, "Failed to send OTP email to recipient: {Recipient}", toEmail);
            throw new InvalidOperationException("Không thể gửi email xác thực. Vui lòng thử lại sau.", ex);
        }
    }
}
