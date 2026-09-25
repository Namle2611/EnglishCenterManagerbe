using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.Attendances;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class BulkUpsertAttendanceRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int? ClassId { get; set; }

    [Required]
    public DateOnly? SessionDate { get; set; }

    [Required]
    public TimeSpan? StartTime { get; set; }

    [Required]
    [MinLength(1)]
    public List<BulkAttendanceItemRequest>? Records { get; set; }
}
