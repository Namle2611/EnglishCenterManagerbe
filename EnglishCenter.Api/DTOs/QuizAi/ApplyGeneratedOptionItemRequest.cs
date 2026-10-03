using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.QuizAi;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class ApplyGeneratedOptionItemRequest : IValidatableObject
{
    private string _content = string.Empty;

    [Required(ErrorMessage = "Content is required.")]
    public string Content
    {
        get => _content;
        set => _content = value ?? string.Empty;
    }

    [Required(ErrorMessage = "IsCorrect is required.")]
    public bool? IsCorrect { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Content))
        {
            yield return new ValidationResult("Option content is required.", new[] { nameof(Content) });
        }
    }
}
