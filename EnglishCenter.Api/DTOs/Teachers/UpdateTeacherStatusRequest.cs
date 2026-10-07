using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Teachers;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateTeacherStatusRequest
{
    [Required(ErrorMessage = "Status is required.")]
    [EnumDataType(typeof(TeacherStatus), ErrorMessage = "Invalid teacher status.")]
    public TeacherStatus? Status { get; set; }
}
