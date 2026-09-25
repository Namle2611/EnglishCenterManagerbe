using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Attendances;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateAttendanceRequest
{
    [Required]
    public AttendanceStatus? Status { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }
}
