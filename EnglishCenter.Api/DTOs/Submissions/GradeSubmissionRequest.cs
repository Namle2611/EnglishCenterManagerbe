using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.Submissions;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class GradeSubmissionRequest
{
    private string? _feedback;

    [Required(ErrorMessage = "Score is required.")]
    public decimal? Score { get; set; }

    public string? Feedback
    {
        get => _feedback;
        set => _feedback = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
