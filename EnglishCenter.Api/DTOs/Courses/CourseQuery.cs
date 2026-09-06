using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Courses;

public class CourseQuery : PagedQuery, IValidatableObject
{
    public CourseStatus? Status { get; set; }

    private string? _level;
    public string? Level
    {
        get => _level;
        set => _level = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Status.HasValue && !Enum.IsDefined(typeof(CourseStatus), Status.Value))
        {
            yield return new ValidationResult("Invalid course status.", new[] { nameof(Status) });
        }
    }
}
