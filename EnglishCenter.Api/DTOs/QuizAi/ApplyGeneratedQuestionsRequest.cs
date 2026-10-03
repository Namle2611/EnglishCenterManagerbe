using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.QuizAi;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class ApplyGeneratedQuestionsRequest
{
    [Required(ErrorMessage = "Questions list is required.")]
    [MinLength(1, ErrorMessage = "At least one question must be applied.")]
    [MaxLength(20, ErrorMessage = "Cannot apply more than 20 questions at once.")]
    public List<ApplyGeneratedQuestionItemRequest> Questions { get; set; } = new();
}
