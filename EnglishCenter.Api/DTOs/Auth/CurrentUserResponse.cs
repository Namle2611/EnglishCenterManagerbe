namespace EnglishCenter.Api.DTOs.Auth;

public class CurrentUserResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public List<string> Roles { get; set; } = new();
    public bool IsActive { get; set; }
}
