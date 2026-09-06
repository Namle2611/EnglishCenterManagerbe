namespace EnglishCenter.Api.DTOs.Students;

public class StudentListItemResponse
{
    public int Id { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CurrentLevel { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
