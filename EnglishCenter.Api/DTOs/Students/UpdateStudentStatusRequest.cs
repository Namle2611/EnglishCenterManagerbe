using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Students;

public class UpdateStudentStatusRequest
{
    [Required(ErrorMessage = "Status is required.")]
    [EnumDataType(typeof(StudentStatus), ErrorMessage = "Invalid student status.")]
    public StudentStatus Status { get; set; }
}
