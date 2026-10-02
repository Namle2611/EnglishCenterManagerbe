using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.QuizAttempts;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class SaveAnswerRequest : IValidatableObject
{
    private string? _textAnswer;

    public int? SelectedOptionId { get; set; }

    public string? TextAnswer
    {
        get => _textAnswer;
        set => _textAnswer = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (SelectedOptionId.HasValue && SelectedOptionId.Value <= 0)
        {
            yield return new ValidationResult("SelectedOptionId must be greater than 0.", new[] { nameof(SelectedOptionId) });
        }
    }
}
