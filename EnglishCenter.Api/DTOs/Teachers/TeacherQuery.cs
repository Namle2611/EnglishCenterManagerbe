using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Teachers;

public class TeacherQuery : PagedQuery, IValidatableObject
{
    public TeacherStatus? Status { get; set; }

    private string? _specialization;
    public string? Specialization
    {
        get => _specialization;
        set => _specialization = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Status.HasValue && !Enum.IsDefined(typeof(TeacherStatus), Status.Value))
        {
            yield return new ValidationResult("Invalid teacher status.", new[] { nameof(Status) });
        }
    }
}
