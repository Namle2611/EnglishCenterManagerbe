using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Questions;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class CreateQuestionRequest : IValidatableObject
{
    private string _content = string.Empty;
    private string? _correctTextAnswer;

    [Required]
    public string Content
    {
        get => _content;
        set => _content = value ?? string.Empty;
    }

    [Required]
    public QuestionType? QuestionType { get; set; }

    public string? CorrectTextAnswer
    {
        get => _correctTextAnswer;
        set => _correctTextAnswer = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    [Required]
    public decimal? Score { get; set; }

    [Required]
    public int? OrderIndex { get; set; }

    public List<QuestionOptionRequest>? Options { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Content))
        {
            yield return new ValidationResult("Question content is required.", new[] { nameof(Content) });
        }

        if (Score.HasValue && (Score.Value <= 0 || Score.Value > 999.99m))
        {
            yield return new ValidationResult("Score must be greater than 0 and less than or equal to 999.99.", new[] { nameof(Score) });
        }

        if (OrderIndex.HasValue && OrderIndex.Value < 0)
        {
            yield return new ValidationResult("OrderIndex must be greater than or equal to 0.", new[] { nameof(OrderIndex) });
        }

        if (QuestionType.HasValue)
        {
            if (!Enum.IsDefined(typeof(QuestionType), QuestionType.Value))
            {
                yield return new ValidationResult("Invalid question type.", new[] { nameof(QuestionType) });
            }
            else if (QuestionType.Value == Enums.QuestionType.MultipleChoice)
            {
                if (Options == null || Options.Count < 2)
                {
                    yield return new ValidationResult("MultipleChoice question requires at least 2 options.", new[] { nameof(Options) });
                }
                else
                {
                    var correctCount = Options.Count(o => o.IsCorrect == true);
                    if (correctCount != 1)
                    {
                        yield return new ValidationResult("MultipleChoice question must have exactly one correct option.", new[] { nameof(Options) });
                    }
                }

                if (!string.IsNullOrWhiteSpace(CorrectTextAnswer))
                {
                    yield return new ValidationResult("CorrectTextAnswer must be null for MultipleChoice questions.", new[] { nameof(CorrectTextAnswer) });
                }
            }
            else if (QuestionType.Value == Enums.QuestionType.TrueFalse)
            {
                if (Options == null || Options.Count != 2)
                {
                    yield return new ValidationResult("TrueFalse question requires exactly 2 options.", new[] { nameof(Options) });
                }
                else
                {
                    var correctCount = Options.Count(o => o.IsCorrect == true);
                    if (correctCount != 1)
                    {
                        yield return new ValidationResult("TrueFalse question must have exactly one correct option.", new[] { nameof(Options) });
                    }
                }

                if (!string.IsNullOrWhiteSpace(CorrectTextAnswer))
                {
                    yield return new ValidationResult("CorrectTextAnswer must be null for TrueFalse questions.", new[] { nameof(CorrectTextAnswer) });
                }
            }
            else if (QuestionType.Value == Enums.QuestionType.FillInBlank)
            {
                if (Options != null && Options.Count > 0)
                {
                    yield return new ValidationResult("FillInBlank question must not contain options.", new[] { nameof(Options) });
                }

                if (string.IsNullOrWhiteSpace(CorrectTextAnswer))
                {
                    yield return new ValidationResult("CorrectTextAnswer is required for FillInBlank questions.", new[] { nameof(CorrectTextAnswer) });
                }
            }
        }
    }
}
