using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Payments;

public class PaymentSummaryResponse
{
    public int EnrollmentId { get; set; }
    public decimal TuitionAmount { get; set; }
    public decimal EffectivePaidAmount { get; set; }
    public decimal PendingPaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public bool IsFullyPaid { get; set; }
    public int CompletedPaymentCount { get; set; }
    public int TotalPaymentCount { get; set; }
    public EnrollmentStatus EnrollmentStatus { get; set; }
}
