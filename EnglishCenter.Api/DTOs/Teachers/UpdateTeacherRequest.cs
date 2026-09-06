using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.Common;

namespace EnglishCenter.Api.DTOs.Teachers;

public class UpdateTeacherRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [StringLength(ValidationConstants.EmailMaxLength, ErrorMessage = "Email cannot exceed 255 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(ValidationConstants.FullNameMaxLength, ErrorMessage = "Full name cannot exceed 150 characters.")]
    public string FullName { get; set; } = string.Empty;

    [StringLength(ValidationConstants.PhoneMaxLength, ErrorMessage = "Phone number cannot exceed 20 characters.")]
    public string? Phone { get; set; }

    [StringLength(500, ErrorMessage = "Avatar URL cannot exceed 500 characters.")]
    public string? AvatarUrl { get; set; }

    [Required(ErrorMessage = "Specialization is required.")]
    [StringLength(150, ErrorMessage = "Specialization cannot exceed 150 characters.")]
    public string Specialization { get; set; } = string.Empty;

    [StringLength(255, ErrorMessage = "Qualification cannot exceed 255 characters.")]
    public string? Qualification { get; set; }

    [Required(ErrorMessage = "Experience years is required.")]
    [Range(0, int.MaxValue, ErrorMessage = "Experience years cannot be negative.")]
    public int? ExperienceYears { get; set; }

    [Required(ErrorMessage = "Hire date is required.")]
    public DateTime? HireDate { get; set; }
}
