using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Payments;

public class PaymentDetailResponse
{
    public int Id { get; set; }
    public int EnrollmentId { get; set; }
    public int StudentId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int? ClassId { get; set; }
    public string? ClassCode { get; set; }
    public decimal TuitionAmount { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? TransactionCode { get; set; }
    public PaymentStatus Status { get; set; }
    public string? Note { get; set; }
}
