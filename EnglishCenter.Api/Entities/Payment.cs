using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class Payment
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? TransactionCode { get; set; }
    public PaymentStatus Status { get; set; }
    public string? Note { get; set; }

    // SePay VietQR payment concepts
    public string? PaymentCode { get; set; }
    public long? SePayTransactionId { get; set; }
    public string? SePayReferenceCode { get; set; }
    public decimal? ReceivedAmount { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? WebhookReceivedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Enrollment Enrollment { get; set; } = null!;
}
