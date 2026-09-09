using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.Api.DTOs.Classes;

public class CreateClassRequest : IValidatableObject
{
    private string _classCode = string.Empty;

    [Required(ErrorMessage = "ClassCode is required.")]
    [MaxLength(30, ErrorMessage = "ClassCode cannot exceed 30 characters.")]
    public string ClassCode
    {
        get => _classCode;
        set => _classCode = value?.Trim() ?? string.Empty;
    }

    [Required(ErrorMessage = "CourseId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "CourseId must be greater than 0.")]
    public int? CourseId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "TeacherId must be greater than 0.")]
    public int? TeacherId { get; set; }

    [Required(ErrorMessage = "StartDate is required.")]
    public DateTime? StartDate { get; set; }

    [Required(ErrorMessage = "EndDate is required.")]
    public DateTime? EndDate { get; set; }

    [Required(ErrorMessage = "MaxStudents is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "MaxStudents must be greater than 0.")]
    public int? MaxStudents { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(ClassCode))
        {
            yield return new ValidationResult("ClassCode is required.", new[] { nameof(ClassCode) });
        }

        if (StartDate.HasValue && EndDate.HasValue && EndDate.Value <= StartDate.Value)
        {
            yield return new ValidationResult("EndDate must be strictly after StartDate.", new[] { nameof(EndDate) });
        }
    }
}
