using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class Student
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? CurrentLevel { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public StudentStatus Status { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<ClassStudent> ClassStudents { get; set; } = new List<ClassStudent>();
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
    public ICollection<QuizAttempt> QuizAttempts { get; set; } = new List<QuizAttempt>();
    public ICollection<Grade> Grades { get; set; } = new List<Grade>();
}
