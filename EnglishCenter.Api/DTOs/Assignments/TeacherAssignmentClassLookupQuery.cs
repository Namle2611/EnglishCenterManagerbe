using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Assignments;

public class TeacherAssignmentClassLookupQuery : PagedQuery, IValidatableObject
{
    private string? _status;

    public int? ClassId { get; set; }

    public string? Status
    {
        get => _status;
        set => _status = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public ClassStatus? ParsedStatus { get; private set; }

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

        if (ClassId.HasValue && ClassId.Value <= 0)
        {
            yield return new ValidationResult("ClassId must be greater than 0.", new[] { nameof(ClassId) });
        }
    }
}
