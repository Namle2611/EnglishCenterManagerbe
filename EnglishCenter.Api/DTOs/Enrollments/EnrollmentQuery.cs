using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Enrollments;

public class EnrollmentQuery : PagedQuery, IValidatableObject
{
    private string? _status;

    public string? Status
    {
        get => _status;
        set => _status = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public EnrollmentStatus? ParsedStatus { get; private set; }

    public int? StudentId { get; set; }
    public int? CourseId { get; set; }
    public int? ClassId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!string.IsNullOrWhiteSpace(Status))
        {
            if (int.TryParse(Status, out _) ||
                !Enum.TryParse<EnrollmentStatus>(Status, ignoreCase: true, out var parsedStatus) ||
                !Enum.IsDefined(typeof(EnrollmentStatus), parsedStatus))
            {
                yield return new ValidationResult("Invalid enrollment status.", new[] { nameof(Status) });
            }
            else
            {
                ParsedStatus = parsedStatus;
            }
        }

        if (StudentId.HasValue && StudentId.Value <= 0)
        {
            yield return new ValidationResult("StudentId must be greater than 0.", new[] { nameof(StudentId) });
        }

        if (CourseId.HasValue && CourseId.Value <= 0)
        {
            yield return new ValidationResult("CourseId must be greater than 0.", new[] { nameof(CourseId) });
        }

        if (ClassId.HasValue && ClassId.Value <= 0)
        {
            yield return new ValidationResult("ClassId must be greater than 0.", new[] { nameof(ClassId) });
        }

        if (DateFrom.HasValue && DateTo.HasValue && DateFrom.Value > DateTo.Value)
        {
            yield return new ValidationResult("DateFrom cannot be greater than DateTo.", new[] { nameof(DateFrom), nameof(DateTo) });
        }
    }
}
