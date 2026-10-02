using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;

namespace EnglishCenter.Api.DTOs.Quizzes;

public class TeacherQuizClassLookupQuery : PagedQuery, IValidatableObject
{
    public int? ClassId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ClassId.HasValue && ClassId.Value <= 0)
        {
            yield return new ValidationResult("ClassId must be greater than 0.", new[] { nameof(ClassId) });
        }
    }
}
