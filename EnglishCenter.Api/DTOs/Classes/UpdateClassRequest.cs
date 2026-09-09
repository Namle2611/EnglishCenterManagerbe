using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.Api.DTOs.Classes;

public class UpdateClassRequest : IValidatableObject
{
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
        if (StartDate.HasValue && EndDate.HasValue && EndDate.Value <= StartDate.Value)
        {
            yield return new ValidationResult("EndDate must be strictly after StartDate.", new[] { nameof(EndDate) });
        }
    }
}
