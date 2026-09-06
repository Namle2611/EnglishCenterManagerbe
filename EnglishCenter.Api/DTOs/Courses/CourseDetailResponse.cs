using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Courses;

public class CourseDetailResponse
{
    public int Id { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Level { get; set; }
    public int DurationMonths { get; set; }
    public decimal TuitionFee { get; set; }
    public CourseStatus Status { get; set; }
}
