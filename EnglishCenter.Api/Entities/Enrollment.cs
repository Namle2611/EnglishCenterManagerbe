using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class Enrollment
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int CourseId { get; set; }
    public decimal TuitionAmount { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public EnrollmentStatus Status { get; set; }
    public int? ConfirmedBy { get; set; }
    public DateTime? ConfirmedAt { get; set; }

    // Navigation properties
    public Student Student { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public User? ConfirmedByUser { get; set; }
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ClassStudent? ClassStudent { get; set; }
}
