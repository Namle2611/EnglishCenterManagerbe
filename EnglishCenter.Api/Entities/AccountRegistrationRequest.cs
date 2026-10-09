using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class AccountRegistrationRequest
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public string? Phone { get; set; }
    public string RequestedRole { get; set; } = string.Empty; // STUDENT, TEACHER, STAFF
    public RegistrationStatus Status { get; set; } = RegistrationStatus.PendingEmailVerification;

    public DateTime? EmailVerifiedAt { get; set; }
    public string? OtpHash { get; set; }
    public DateTime? OtpExpiresAt { get; set; }
    public int OtpAttemptCount { get; set; }
    public DateTime? OtpSentAt { get; set; }

    // Domain data for eventual account creation
    public string? Specialization { get; set; }
    public string? Qualification { get; set; }
    public int? ExperienceYears { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public int? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? RejectionReason { get; set; }

    // Navigation properties
    public User? ReviewedByUser { get; set; }
}
