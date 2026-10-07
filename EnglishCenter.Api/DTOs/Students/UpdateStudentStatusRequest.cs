using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Students;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateStudentStatusRequest
{
    [Required(ErrorMessage = "Status is required.")]
    [EnumDataType(typeof(StudentStatus), ErrorMessage = "Invalid student status.")]
    public StudentStatus Status { get; set; }
}
