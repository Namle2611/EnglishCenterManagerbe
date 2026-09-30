using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;

namespace EnglishCenter.Api.DTOs.Submissions;

public class SubmissionQuery : PagedQuery, IValidatableObject
{
    public int? StudentId { get; set; }
    public bool? IsGraded { get; set; }
    public bool? IsLate { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (StudentId.HasValue && StudentId.Value <= 0)
        {
            yield return new ValidationResult("StudentId must be greater than 0.", new[] { nameof(StudentId) });
        }
    }
}
