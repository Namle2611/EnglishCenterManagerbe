using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.QuizAi;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class GenerateQuizQuestionsRequest : IValidatableObject
{
    private string? _topic;
    private string? _additionalInstructions;

    [Required(ErrorMessage = "SourceType is required.")]
    public QuizAiSourceType? SourceType { get; set; }

    public string? Topic
    {
        get => _topic;
        set => _topic = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public int? LessonId { get; set; }

    [Required(ErrorMessage = "QuestionCount is required.")]
    [Range(1, 20, ErrorMessage = "QuestionCount must be between 1 and 20.")]
    public int QuestionCount { get; set; } = 5;

    [Required(ErrorMessage = "QuestionTypes is required.")]
    public List<QuestionType>? QuestionTypes { get; set; }

    public QuizAiDifficulty Difficulty { get; set; } = QuizAiDifficulty.Medium;

    public QuizAiLanguage Language { get; set; } = QuizAiLanguage.English;

    [Range(0.01, 999.99, ErrorMessage = "ScorePerQuestion must be greater than 0 and less than or equal to 999.99.")]
    public decimal ScorePerQuestion { get; set; } = 1.0m;

    public string? AdditionalInstructions
    {
        get => _additionalInstructions;
        set => _additionalInstructions = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (SourceType.HasValue)
        {
            if (SourceType.Value == QuizAiSourceType.Topic)
            {
                if (string.IsNullOrWhiteSpace(Topic))
                {
                    yield return new ValidationResult(
                        "Topic is required when SourceType is Topic.",
                        new[] { nameof(Topic) });
                }
                else if (Topic.Length > 300)
                {
                    yield return new ValidationResult(
                        "Topic cannot exceed 300 characters.",
                        new[] { nameof(Topic) });
                }

                if (LessonId.HasValue)
                {
                    yield return new ValidationResult(
                        "LessonId must be null when SourceType is Topic.",
                        new[] { nameof(LessonId) });
                }
            }
            else if (SourceType.Value == QuizAiSourceType.Lesson)
            {
                if (!LessonId.HasValue || LessonId.Value <= 0)
                {
                    yield return new ValidationResult(
                        "A valid LessonId is required when SourceType is Lesson.",
                        new[] { nameof(LessonId) });
                }

                if (!string.IsNullOrWhiteSpace(Topic))
                {
                    yield return new ValidationResult(
                        "Topic must be null when SourceType is Lesson.",
                        new[] { nameof(Topic) });
                }
            }
        }

        if (QuestionTypes == null || QuestionTypes.Count == 0)
        {
            yield return new ValidationResult(
                "At least one QuestionType must be specified.",
                new[] { nameof(QuestionTypes) });
        }
        else
        {
            if (QuestionTypes.Distinct().Count() != QuestionTypes.Count)
            {
                yield return new ValidationResult(
                    "QuestionTypes must not contain duplicate values.",
                    new[] { nameof(QuestionTypes) });
            }

            foreach (var qType in QuestionTypes)
            {
                if (!Enum.IsDefined(typeof(QuestionType), qType))
                {
                    yield return new ValidationResult(
                        $"Unsupported question type: {qType}.",
                        new[] { nameof(QuestionTypes) });
                }
            }
        }

        if (AdditionalInstructions != null && AdditionalInstructions.Length > 500)
        {
            yield return new ValidationResult(
                "AdditionalInstructions cannot exceed 500 characters.",
                new[] { nameof(AdditionalInstructions) });
        }
    }
}
