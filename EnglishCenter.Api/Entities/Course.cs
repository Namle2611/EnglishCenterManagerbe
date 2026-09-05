using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class Course
{
    public int Id { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Level { get; set; }
    public int DurationMonths { get; set; }
    public decimal TuitionFee { get; set; }
    public CourseStatus Status { get; set; }

    // Navigation properties
    public ICollection<CourseClass> Classes { get; set; } = new List<CourseClass>();
    public ICollection<Section> Sections { get; set; } = new List<Section>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}
