using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Quizzes;

public class QuizQuery : PagedQuery, IValidatableObject
{
    private string? _status;

    public int? ClassId { get; set; }

    public string? Status
    {
        get => _status;
        set => _status = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public QuizStatus? ParsedStatus { get; private set; }

    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!string.IsNullOrWhiteSpace(Status))
        {
            if (int.TryParse(Status, out _) ||
                !Enum.TryParse<QuizStatus>(Status, ignoreCase: true, out var parsedStatus) ||
                !Enum.IsDefined(typeof(QuizStatus), parsedStatus))
            {
                yield return new ValidationResult("Invalid quiz status.", new[] { nameof(Status) });
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

        if (FromDate.HasValue && ToDate.HasValue && FromDate.Value > ToDate.Value)
        {
            yield return new ValidationResult("FromDate cannot be later than ToDate.", new[] { nameof(FromDate), nameof(ToDate) });
        }
    }
}
