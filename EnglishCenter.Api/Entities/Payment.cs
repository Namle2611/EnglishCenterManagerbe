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

    // Navigation properties
    public Enrollment Enrollment { get; set; } = null!;
}
