using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Registration;

public class RegistrationRequestDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string RequestedRole { get; set; } = string.Empty;
    public RegistrationStatus Status { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }

    // Teacher fields
    public string? Specialization { get; set; }
    public string? Qualification { get; set; }
    public int? ExperienceYears { get; set; }

    // Student fields
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int? ReviewedByUserId { get; set; }
    public string? ReviewedByAdminName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }
}
