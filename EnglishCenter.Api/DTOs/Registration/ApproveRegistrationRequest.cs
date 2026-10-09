using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.Registration;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class ApproveRegistrationRequest
{
    [StringLength(20, ErrorMessage = "Mã giáo viên không được vượt quá 20 ký tự.")]
    public string? TeacherCode { get; set; }

    public DateTime? HireDate { get; set; }
}
