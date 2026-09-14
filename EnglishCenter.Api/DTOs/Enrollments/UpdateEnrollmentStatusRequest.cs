using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Enrollments;

public class UpdateEnrollmentStatusRequest : IValidatableObject
{
    [Required(ErrorMessage = "Status is required.")]
    public EnrollmentStatus? Status { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "ClassId must be greater than 0.")]
    public int? ClassId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Status == EnrollmentStatus.Enrolled && (!ClassId.HasValue || ClassId.Value <= 0))
        {
            yield return new ValidationResult("ClassId is required when transitioning to Enrolled status.", new[] { nameof(ClassId) });
        }

        if (Status.HasValue && Status != EnrollmentStatus.Enrolled && ClassId.HasValue)
        {
            yield return new ValidationResult("ClassId must not be provided when transitioning to statuses other than Enrolled.", new[] { nameof(ClassId) });
        }
    }
}
