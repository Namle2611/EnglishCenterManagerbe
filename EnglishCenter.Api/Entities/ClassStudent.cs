using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class ClassStudent
{
    public int ClassId { get; set; }
    public int StudentId { get; set; }
    public int EnrollmentId { get; set; }
    public DateTime JoinedAt { get; set; }
    public ClassStudentStatus Status { get; set; }

    // Navigation properties
    public CourseClass Class { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Enrollment Enrollment { get; set; } = null!;
}
