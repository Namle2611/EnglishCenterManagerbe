using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.Common;

namespace EnglishCenter.Api.DTOs.Students;

public class CreateStudentRequest
{
    [Required(ErrorMessage = "Student code is required.")]
    [StringLength(20, ErrorMessage = "Student code cannot exceed 20 characters.")]
    public string StudentCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [StringLength(ValidationConstants.EmailMaxLength, ErrorMessage = "Email cannot exceed 255 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MinLength(ValidationConstants.PasswordMinLength, ErrorMessage = "Password must be at least 8 characters.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(ValidationConstants.FullNameMaxLength, ErrorMessage = "Full name cannot exceed 150 characters.")]
    public string FullName { get; set; } = string.Empty;

    [StringLength(ValidationConstants.PhoneMaxLength, ErrorMessage = "Phone number cannot exceed 20 characters.")]
    public string? Phone { get; set; }

    [StringLength(500, ErrorMessage = "Avatar URL cannot exceed 500 characters.")]
    public string? AvatarUrl { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [StringLength(20, ErrorMessage = "Gender cannot exceed 20 characters.")]
    public string? Gender { get; set; }

    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters.")]
    public string? Address { get; set; }

    [StringLength(50, ErrorMessage = "Current level cannot exceed 50 characters.")]
    public string? CurrentLevel { get; set; }
}
