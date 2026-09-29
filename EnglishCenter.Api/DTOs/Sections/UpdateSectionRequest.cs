using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.Sections;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateSectionRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required(ErrorMessage = "OrderIndex is required.")]
    [Range(0, int.MaxValue, ErrorMessage = "OrderIndex must be greater than or equal to 0.")]
    public int? OrderIndex { get; set; }
}
