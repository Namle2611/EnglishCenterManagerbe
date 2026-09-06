namespace EnglishCenter.Api.DTOs.Students;

public class StudentDetailResponse
{
    public int Id { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; }
    public List<string> Roles { get; set; } = new();
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? CurrentLevel { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public string Status { get; set; } = string.Empty;
}
