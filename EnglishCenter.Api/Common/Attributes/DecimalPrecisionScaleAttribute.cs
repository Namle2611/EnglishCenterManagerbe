using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.Api.Common.Attributes;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter, AllowMultiple = false)]
public class DecimalPrecisionScaleAttribute : ValidationAttribute
{
    private readonly int _precision;
    private readonly int _scale;
    private readonly decimal _min;
    private readonly decimal _max;

    public DecimalPrecisionScaleAttribute(int precision, int scale, double min = 0)
    {
        _precision = precision;
        _scale = scale;
        _min = (decimal)min;

        // Calculate maximum value fitting the given precision and scale,
        // e.g. for (18, 2): integer part has 16 digits of 9, fractional part has 2 digits of 9 => 9999999999999999.99
        int integerDigits = precision - scale;
        decimal max = 0;
        for (int i = 0; i < integerDigits; i++)
        {
            max = max * 10 + 9;
        }

        decimal fractional = 0;
        decimal factor = 0.1m;
        for (int i = 0; i < scale; i++)
        {
            fractional += 9 * factor;
            factor *= 0.1m;
        }

        _max = max + fractional;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value == null)
        {
            return ValidationResult.Success; // Nullability is handled by [Required]
        }

        if (value is not decimal dec)
        {
            return new ValidationResult("Invalid decimal format.", new[] { validationContext.MemberName ?? string.Empty });
        }

        if (dec < _min)
        {
            return new ValidationResult($"Value cannot be less than {_min}.", new[] { validationContext.MemberName ?? string.Empty });
        }

        if (dec > _max)
        {
            return new ValidationResult($"Value cannot be greater than {_max}.", new[] { validationContext.MemberName ?? string.Empty });
        }

        if (dec != decimal.Round(dec, _scale))
        {
            return new ValidationResult($"Value cannot have more than {_scale} decimal places.", new[] { validationContext.MemberName ?? string.Empty });
        }

        return ValidationResult.Success;
    }
}
