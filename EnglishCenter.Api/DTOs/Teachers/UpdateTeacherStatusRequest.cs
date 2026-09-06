using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Teachers;

public class UpdateTeacherStatusRequest
{
    [Required(ErrorMessage = "Status is required.")]
    [EnumDataType(typeof(TeacherStatus), ErrorMessage = "Invalid teacher status.")]
    public TeacherStatus? Status { get; set; }
}
