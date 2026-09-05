using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class Teacher
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string TeacherCode { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string? Qualification { get; set; }
    public int ExperienceYears { get; set; }
    public DateTime HireDate { get; set; }
    public TeacherStatus Status { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<CourseClass> Classes { get; set; } = new List<CourseClass>();
    public ICollection<AttendanceSession> AttendanceSessions { get; set; } = new List<AttendanceSession>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
