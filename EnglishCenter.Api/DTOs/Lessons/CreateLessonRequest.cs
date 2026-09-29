using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Lessons;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class CreateLessonRequest
{
    [Required(ErrorMessage = "SectionId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "SectionId must be greater than 0.")]
    public int? SectionId { get; set; }

    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    public string? Content { get; set; }

    [MaxLength(500, ErrorMessage = "VideoUrl cannot exceed 500 characters.")]
    public string? VideoUrl { get; set; }

    [MaxLength(500, ErrorMessage = "AudioUrl cannot exceed 500 characters.")]
    public string? AudioUrl { get; set; }

    [MaxLength(500, ErrorMessage = "DocumentUrl cannot exceed 500 characters.")]
    public string? DocumentUrl { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "OrderIndex must be greater than or equal to 0.")]
    public int? OrderIndex { get; set; }

    public LessonStatus? Status { get; set; }
}
