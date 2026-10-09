using System.Security.Cryptography;
using EnglishCenter.Api.Services.Interfaces;

namespace EnglishCenter.Api.Services;

public class DefaultOtpCodeGenerator : IOtpCodeGenerator
{
    public string GenerateSixDigitCode()
    {
        return RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
    }
}
