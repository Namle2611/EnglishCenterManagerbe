namespace EnglishCenter.Api.DTOs.Payments;

public class PaymentStatusCheckResponse
{
    public int PaymentId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public decimal Amount { get; set; }
    public string? PaymentCode { get; set; }
}
