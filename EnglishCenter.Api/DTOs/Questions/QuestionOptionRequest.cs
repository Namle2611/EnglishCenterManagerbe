using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.Questions;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class QuestionOptionRequest : IValidatableObject
{
    private string _content = string.Empty;

    [Required]
    public string Content
    {
        get => _content;
        set => _content = value ?? string.Empty;
    }

    [Required]
    public bool? IsCorrect { get; set; }

    [Required]
    public int? OrderIndex { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Content))
        {
            yield return new ValidationResult("Option content is required.", new[] { nameof(Content) });
        }

        if (OrderIndex.HasValue && OrderIndex.Value < 0)
        {
            yield return new ValidationResult("OrderIndex must be greater than or equal to 0.", new[] { nameof(OrderIndex) });
        }
    }
}
