using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.Quizzes;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class CreateQuizRequest : IValidatableObject
{
    private string _title = string.Empty;
    private string? _description;

    [Required]
    public int? ClassId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title
    {
        get => _title;
        set => _title = value ?? string.Empty;
    }

    public string? Description
    {
        get => _description;
        set => _description = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public int? DurationMinutes { get; set; }

    [Required]
    public int? MaxAttempts { get; set; }

    public DateTime? StartAt { get; set; }

    public DateTime? EndAt { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ClassId.HasValue && ClassId.Value <= 0)
        {
            yield return new ValidationResult("ClassId must be greater than 0.", new[] { nameof(ClassId) });
        }

        if (string.IsNullOrWhiteSpace(Title))
        {
            yield return new ValidationResult("Title is required.", new[] { nameof(Title) });
        }
        else if (Title.Trim().Length > 200)
        {
            yield return new ValidationResult("Title cannot exceed 200 characters.", new[] { nameof(Title) });
        }

        if (DurationMinutes.HasValue && DurationMinutes.Value <= 0)
        {
            yield return new ValidationResult("DurationMinutes must be greater than 0.", new[] { nameof(DurationMinutes) });
        }

        if (MaxAttempts.HasValue && MaxAttempts.Value < 1)
        {
            yield return new ValidationResult("MaxAttempts must be at least 1.", new[] { nameof(MaxAttempts) });
        }

        if (StartAt.HasValue && EndAt.HasValue && EndAt.Value <= StartAt.Value)
        {
            yield return new ValidationResult("EndAt must be strictly greater than StartAt.", new[] { nameof(EndAt) });
        }
    }
}
