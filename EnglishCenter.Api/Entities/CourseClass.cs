using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class CourseClass
{
    public int Id { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public int? TeacherId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxStudents { get; set; }
    public ClassStatus Status { get; set; }

    // Navigation properties
    public Course Course { get; set; } = null!;
    public Teacher? Teacher { get; set; }
    public ICollection<ClassStudent> ClassStudents { get; set; } = new List<ClassStudent>();
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
    public ICollection<AttendanceSession> AttendanceSessions { get; set; } = new List<AttendanceSession>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public ICollection<Grade> Grades { get; set; } = new List<Grade>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
