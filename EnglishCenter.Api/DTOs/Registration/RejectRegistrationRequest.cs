using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.Registration;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class RejectRegistrationRequest
{
    [StringLength(500, ErrorMessage = "Lý do từ chối không được vượt quá 500 ký tự.")]
    public string? Reason { get; set; }
}
