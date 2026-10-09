namespace EnglishCenter.Api.DTOs.Payments;

public class SePayPaymentResponse
{
    public int PaymentId { get; set; }
    public int EnrollmentId { get; set; }
    public string PaymentCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountHolder { get; set; } = string.Empty;
    public string QrUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }

    // Display context
    public string CourseName { get; set; } = string.Empty;
    public string? ClassCode { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
}
