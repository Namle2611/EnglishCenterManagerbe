using System.Security.Cryptography;
using System.Text;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace EnglishCenter.Api.Services;

public class OtpService : IOtpService
{
    private readonly IOtpCodeGenerator _codeGenerator;
    private readonly byte[] _hashKeyBytes;

    public OtpService(IOtpCodeGenerator codeGenerator, IConfiguration configuration, IHostEnvironment? environment = null)
    {
        _codeGenerator = codeGenerator;
        var key = configuration["Otp:HashKey"];
        var envName = environment?.EnvironmentName ?? configuration["ASPNETCORE_ENVIRONMENT"] ?? configuration["DOTNET_ENVIRONMENT"] ?? "Production";
        var isDevelopment = string.Equals(envName, "Development", StringComparison.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(key))
        {
            if (!isDevelopment)
            {
                throw new InvalidOperationException("CRITICAL: Otp:HashKey configuration is required and cannot be empty in non-Development environments.");
            }
            key = "DevOnly_SecureDevelopmentOtpKey_MustBeOverriddenInProduction123456!";
        }
        else if (!isDevelopment && (key.Contains("DevOnly_") || key.Contains("DefaultSecureDevelopmentOtpKey")))
        {
            throw new InvalidOperationException("CRITICAL: Committed development OTP key cannot be used in non-Development environments.");
        }

        _hashKeyBytes = Encoding.UTF8.GetBytes(key);
    }

    public string GenerateOtp(string email, string? currentOtpHash = null)
    {
        string candidate;
        int maxAttempts = 10;
        do
        {
            candidate = _codeGenerator.GenerateSixDigitCode();
            maxAttempts--;
        } while (currentOtpHash != null && VerifyOtp(email, candidate, currentOtpHash) && maxAttempts > 0);

        return candidate;
    }

    public string HashOtp(string email, string otp)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var payload = $"email:{normalizedEmail}|purpose:registration|otp:{otp.Trim()}";
        using var hmac = new HMACSHA256(_hashKeyBytes);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash);
    }

    public bool VerifyOtp(string email, string candidateOtp, string storedHash)
    {
        if (string.IsNullOrWhiteSpace(candidateOtp) || string.IsNullOrWhiteSpace(storedHash))
        {
            return false;
        }

        var candidateHash = HashOtp(email, candidateOtp);
        var candidateBytes = Convert.FromBase64String(candidateHash);
        var storedBytes = Convert.FromBase64String(storedHash);

        return CryptographicOperations.FixedTimeEquals(candidateBytes, storedBytes);
    }
}
