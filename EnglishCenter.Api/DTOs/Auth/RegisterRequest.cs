using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Common;

namespace EnglishCenter.Api.DTOs.Auth;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class RegisterRequest
{
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(ValidationConstants.FullNameMaxLength, ErrorMessage = "Full name cannot exceed 150 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [StringLength(ValidationConstants.EmailMaxLength, ErrorMessage = "Email cannot exceed 255 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MinLength(ValidationConstants.PasswordMinLength, ErrorMessage = "Password must be at least 8 characters.")]
    public string Password { get; set; } = string.Empty;

    [StringLength(ValidationConstants.PhoneMaxLength, ErrorMessage = "Phone number cannot exceed 20 characters.")]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Requested role is required.")]
    public string RequestedRole { get; set; } = string.Empty;

    // Fields for Teacher applications
    [StringLength(150, ErrorMessage = "Specialization cannot exceed 150 characters.")]
    public string? Specialization { get; set; }

    [StringLength(255, ErrorMessage = "Qualification cannot exceed 255 characters.")]
    public string? Qualification { get; set; }

    [Range(0, 100, ErrorMessage = "Experience years must be between 0 and 100.")]
    public int? ExperienceYears { get; set; }

    // Fields for Student applications
    public DateTime? DateOfBirth { get; set; }

    [StringLength(20, ErrorMessage = "Gender cannot exceed 20 characters.")]
    public string? Gender { get; set; }

    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters.")]
    public string? Address { get; set; }
}
