using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Classes;

public class ClassQuery : PagedQuery, IValidatableObject
{
    private string? _status;

    public string? Status
    {
        get => _status;
        set => _status = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public ClassStatus? ParsedStatus { get; private set; }

    public int? CourseId { get; set; }
    public int? TeacherId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!string.IsNullOrWhiteSpace(Status))
        {
            if (int.TryParse(Status, out _) ||
                !Enum.TryParse<ClassStatus>(Status, ignoreCase: true, out var parsedStatus) ||
                !Enum.IsDefined(typeof(ClassStatus), parsedStatus))
            {
                yield return new ValidationResult("Invalid class status.", new[] { nameof(Status) });
            }
            else
            {
                ParsedStatus = parsedStatus;
            }
        }

        if (CourseId.HasValue && CourseId.Value <= 0)
        {
            yield return new ValidationResult("CourseId must be greater than 0.", new[] { nameof(CourseId) });
        }

        if (TeacherId.HasValue && TeacherId.Value <= 0)
        {
            yield return new ValidationResult("TeacherId must be greater than 0.", new[] { nameof(TeacherId) });
        }
    }
}
