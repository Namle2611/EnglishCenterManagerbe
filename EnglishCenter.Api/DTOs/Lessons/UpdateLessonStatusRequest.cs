using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Lessons;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateLessonStatusRequest
{
    [Required(ErrorMessage = "Status is required.")]
    public LessonStatus? Status { get; set; }
}
