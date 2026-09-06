namespace EnglishCenter.Api.Services.Models;

public class CreateUserAccountCommand
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
