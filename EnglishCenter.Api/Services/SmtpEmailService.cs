using System.Net;
using System.Net.Mail;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EnglishCenter.Api.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;
    private readonly IWebHostEnvironment _environment;

    public SmtpEmailService(
        IConfiguration config,
        ILogger<SmtpEmailService> logger,
        IWebHostEnvironment environment)
    {
        _config = config;
        _logger = logger;
        _environment = environment;
    }

    public async Task SendOtpEmailAsync(string toEmail, string fullName, string otp, CancellationToken cancellationToken = default)
    {
        var host = _config["Email:Host"]?.Trim();
        var port = _config.GetValue<int>("Email:Port", 587);
        var username = _config["Email:Username"]?.Trim();
        var rawPassword = _config["Email:Password"];
        var password = rawPassword?.Replace(" ", "").Trim();
        var fromAddress = _config["Email:FromAddress"]?.Trim();
        var fromName = _config["Email:FromName"] ?? "English Center Manager";
        var enableSsl = _config.GetValue<bool>("Email:EnableSsl", true);

        // If using Gmail SMTP, sender address must match authenticated Gmail account
        if (host?.Contains("gmail.com", StringComparison.OrdinalIgnoreCase) == true && !string.IsNullOrWhiteSpace(username))
        {
            fromAddress = username;
        }
        if (string.IsNullOrWhiteSpace(fromAddress))
        {
            fromAddress = username ?? "noreply@englishcenter.edu.vn";
        }

        var isSmtpConfigured = !string.IsNullOrWhiteSpace(host)
            && !(host.Equals("localhost", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(username))
            && !string.IsNullOrWhiteSpace(username)
            && !string.IsNullOrWhiteSpace(password);

        if (!isSmtpConfigured)
        {
            if (_environment.IsDevelopment())
            {
                _logger.LogInformation("================================================================================");
                _logger.LogInformation("[DEV EMAIL MOCK] SMTP credentials are not configured.");
                _logger.LogInformation("Gửi tới: {ToEmail} ({FullName})", toEmail, fullName);
                _logger.LogInformation("Mã xác thực OTP đăng ký: >>> {Otp} <<<", otp);
                _logger.LogInformation("Thời gian hiệu lực: 5 phút");
                _logger.LogInformation("================================================================================");
                return;
            }

            _logger.LogWarning("Email delivery failed: SMTP host/credentials are not configured.");
            throw new InvalidOperationException("Email provider is not configured. Please configure SMTP settings or environment variables.");
        }

        try
        {
            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP email to recipient: {Recipient}", toEmail);
            if (_environment.IsDevelopment())
            {
                _logger.LogWarning("================================================================================");
                _logger.LogWarning("[DEV MODE FALLBACK] Failed to send email via SMTP ({Error}). Fallback OTP for {Email} is: {Otp}", ex.Message, toEmail, otp);
                _logger.LogWarning("================================================================================");
                return;
            }
            throw new InvalidOperationException("Không thể gửi email xác thực. Vui lòng thử lại sau.", ex);
        }
    }
}
