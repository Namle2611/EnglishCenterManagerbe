using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Payments;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdatePaymentStatusRequest
{
    [Required(ErrorMessage = "Status is required.")]
    public PaymentStatus? Status { get; set; }
}
