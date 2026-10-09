using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Registration;

public class RegistrationRequestQuery
{
    public RegistrationStatus? Status { get; set; }
    public string? Role { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
