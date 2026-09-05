using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.Api.DTOs.Auth;

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Current password is required.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required.")]
    [MinLength(8, ErrorMessage = "New password must be at least 8 characters.")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Confirmation password is required.")]
    [Compare(nameof(NewPassword), ErrorMessage = "Confirmation password does not match.")]
    public string ConfirmNewPassword { get; set; } = string.Empty;
}
