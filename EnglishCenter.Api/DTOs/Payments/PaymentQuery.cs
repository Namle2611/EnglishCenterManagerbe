using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Payments;

public class PaymentQuery : PagedQuery, IValidatableObject
{
    private string? _status;
    private string? _paymentMethod;

    public string? Status
    {
        get => _status;
        set => _status = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public PaymentStatus? ParsedStatus { get; private set; }

    public string? PaymentMethod
    {
        get => _paymentMethod;
        set => _paymentMethod = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public PaymentMethod? ParsedPaymentMethod { get; private set; }

    public int? EnrollmentId { get; set; }
    public int? StudentId { get; set; }
    public int? CourseId { get; set; }
    public int? ClassId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public decimal? MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!string.IsNullOrWhiteSpace(Status))
        {
            if (int.TryParse(Status, out _) ||
                !Enum.TryParse<PaymentStatus>(Status, ignoreCase: true, out var parsedStatus) ||
                !Enum.IsDefined(typeof(PaymentStatus), parsedStatus))
            {
                yield return new ValidationResult("Invalid payment status.", new[] { nameof(Status) });
            }
            else
            {
                ParsedStatus = parsedStatus;
            }
        }

        if (!string.IsNullOrWhiteSpace(PaymentMethod))
        {
            if (int.TryParse(PaymentMethod, out _) ||
                !Enum.TryParse<PaymentMethod>(PaymentMethod, ignoreCase: true, out var parsedMethod) ||
                !Enum.IsDefined(typeof(PaymentMethod), parsedMethod))
            {
                yield return new ValidationResult("Invalid payment method.", new[] { nameof(PaymentMethod) });
            }
            else
            {
                ParsedPaymentMethod = parsedMethod;
            }
        }

        if (EnrollmentId.HasValue && EnrollmentId.Value <= 0)
        {
            yield return new ValidationResult("EnrollmentId must be greater than 0.", new[] { nameof(EnrollmentId) });
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

        if (MinAmount.HasValue && MinAmount.Value < 0)
        {
            yield return new ValidationResult("MinAmount cannot be negative.", new[] { nameof(MinAmount) });
        }

        if (MaxAmount.HasValue && MaxAmount.Value < 0)
        {
            yield return new ValidationResult("MaxAmount cannot be negative.", new[] { nameof(MaxAmount) });
        }

        if (MinAmount.HasValue && MaxAmount.HasValue && MinAmount.Value > MaxAmount.Value)
        {
            yield return new ValidationResult("MinAmount cannot be greater than MaxAmount.", new[] { nameof(MinAmount), nameof(MaxAmount) });
        }
    }
}
