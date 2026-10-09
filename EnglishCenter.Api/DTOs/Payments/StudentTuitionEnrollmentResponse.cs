using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Payments;

public class StudentTuitionEnrollmentResponse
{
    public int EnrollmentId { get; set; }
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int? ClassId { get; set; }
    public string? ClassCode { get; set; }
    public decimal TuitionAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public EnrollmentStatus Status { get; set; }
    public bool IsFullyPaid { get; set; }
    public SePayPaymentResponse? ActivePayment { get; set; }
}
