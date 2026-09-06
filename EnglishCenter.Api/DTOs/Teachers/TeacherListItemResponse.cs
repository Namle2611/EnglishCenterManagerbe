namespace EnglishCenter.Api.DTOs.Teachers;

public class TeacherListItemResponse
{
    public int Id { get; set; }
    public string TeacherCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Specialization { get; set; } = string.Empty;
    public string? Qualification { get; set; }
    public int ExperienceYears { get; set; }
    public DateTime HireDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
