namespace EnglishCenter.Api.DTOs.Teachers;

public class TeacherDetailResponse
{
    public int Id { get; set; }
    public string TeacherCode { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; }
    public List<string> Roles { get; set; } = new();
    public string Specialization { get; set; } = string.Empty;
    public string? Qualification { get; set; }
    public int ExperienceYears { get; set; }
    public DateTime HireDate { get; set; }
    public string Status { get; set; } = string.Empty;
}
