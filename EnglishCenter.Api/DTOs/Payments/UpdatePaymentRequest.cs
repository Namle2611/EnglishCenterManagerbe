using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Payments;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdatePaymentRequest
{
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0.")]
    public decimal? Amount { get; set; }

    public DateTime? PaymentDate { get; set; }

    public PaymentMethod? PaymentMethod { get; set; }

    [MaxLength(100, ErrorMessage = "TransactionCode cannot exceed 100 characters.")]
    public string? TransactionCode { get; set; }

    [MaxLength(500, ErrorMessage = "Note cannot exceed 500 characters.")]
    public string? Note { get; set; }
}
