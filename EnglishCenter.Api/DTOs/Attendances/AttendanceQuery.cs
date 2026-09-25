using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Attendances;

public class AttendanceQuery : PagedQuery, IValidatableObject
{
    private string? _status;

    public int? ClassId { get; set; }
    public int? StudentId { get; set; }
    public int? CourseId { get; set; }
    public int? TeacherId { get; set; }

    public string? Status
    {
        get => _status;
        set => _status = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public AttendanceStatus? ParsedStatus { get; private set; }
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        foreach (var (value, name) in new[]
        {
            (ClassId, nameof(ClassId)),
            (StudentId, nameof(StudentId)),
            (CourseId, nameof(CourseId)),
            (TeacherId, nameof(TeacherId))
        })
        {
            if (value.HasValue && value.Value <= 0)
            {
                yield return new ValidationResult($"{name} must be greater than 0.", [name]);
            }
        }

        if (!string.IsNullOrWhiteSpace(Status))
        {
            if (int.TryParse(Status, out _) ||
                !Enum.TryParse<AttendanceStatus>(Status, ignoreCase: true, out var parsedStatus) ||
                !Enum.IsDefined(parsedStatus))
            {
                yield return new ValidationResult("Invalid attendance status.", [nameof(Status)]);
            }
            else
            {
                ParsedStatus = parsedStatus;
            }
        }

        if (DateFrom.HasValue && DateTo.HasValue && DateFrom.Value > DateTo.Value)
        {
            yield return new ValidationResult(
                "DateFrom cannot be greater than DateTo.",
                [nameof(DateFrom), nameof(DateTo)]);
        }
    }
}
