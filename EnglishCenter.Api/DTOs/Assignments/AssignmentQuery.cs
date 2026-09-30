using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Assignments;

public class AssignmentQuery : PagedQuery, IValidatableObject
{
    private string? _status;

    public int? ClassId { get; set; }
    public int? TeacherId { get; set; }

    public string? Status
    {
        get => _status;
        set => _status = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public AssignmentStatus? ParsedStatus { get; private set; }

    public DateTime? DueFrom { get; set; }
    public DateTime? DueTo { get; set; }



    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!string.IsNullOrWhiteSpace(Status))
        {
            if (int.TryParse(Status, out _) ||
                !Enum.TryParse<AssignmentStatus>(Status, ignoreCase: true, out var parsedStatus) ||
                !Enum.IsDefined(typeof(AssignmentStatus), parsedStatus))
            {
                yield return new ValidationResult("Invalid assignment status.", new[] { nameof(Status) });
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

        if (TeacherId.HasValue && TeacherId.Value <= 0)
        {
            yield return new ValidationResult("TeacherId must be greater than 0.", new[] { nameof(TeacherId) });
        }

        if (DueFrom.HasValue && DueTo.HasValue && DueFrom.Value > DueTo.Value)
        {
            yield return new ValidationResult("DueFrom cannot be later than DueTo.", new[] { nameof(DueFrom), nameof(DueTo) });
        }
    }
}
