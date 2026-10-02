using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.QuizAttempts;

public class QuizAttemptQuery : PagedQuery, IValidatableObject
{
    private string? _status;

    public int? StudentId { get; set; }

    public string? Status
    {
        get => _status;
        set => _status = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public QuizAttemptStatus? ParsedStatus { get; private set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!string.IsNullOrWhiteSpace(Status))
        {
            if (int.TryParse(Status, out _) ||
                !Enum.TryParse<QuizAttemptStatus>(Status, ignoreCase: true, out var parsedStatus) ||
                !Enum.IsDefined(typeof(QuizAttemptStatus), parsedStatus))
            {
                yield return new ValidationResult("Invalid quiz attempt status.", new[] { nameof(Status) });
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
    }
}
