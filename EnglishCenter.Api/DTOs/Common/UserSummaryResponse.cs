namespace EnglishCenter.Api.DTOs.Common;

public class UserSummaryResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; }
    public List<string> Roles { get; set; } = new();
}
